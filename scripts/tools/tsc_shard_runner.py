#!/usr/bin/env python3
"""Run TypeScript checks in timeboxed shards with reproducible logs."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = REPO_ROOT / "scripts" / "tools" / "tsc-shards.json"
TMP_DIR = REPO_ROOT / ".tmp" / "tsc-shards"

TSC_ERROR_RE = re.compile(r"^(?P<file>.+?)\((?P<line>\d+),(?P<col>\d+)\): error (?P<code>TS\d+): (?P<msg>.+)$")
TSC_GENERIC_ERROR_RE = re.compile(r"^error (?P<code>TS\d+): (?P<msg>.+)$")


@dataclass(frozen=True)
class Shard:
    shard_id: str
    description: str
    include: list[str]
    exclude: list[str]


def maybe_progress(iterable: list[Any], desc: str):
    try:
        from tqdm import tqdm  # type: ignore

        return tqdm(iterable, desc=desc, unit="shard")
    except Exception:
        return iterable


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run timeboxed tsc shards.")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path to shard config JSON")
    parser.add_argument(
        "--failed-only",
        default="",
        help="Path to a previous report JSON; rerun failed/timeout shards only",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=0,
        help="Override timeout seconds per shard",
    )
    return parser.parse_args()


def load_config(path: Path) -> tuple[int, list[Shard]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    timeout_seconds = int(payload.get("timeout_seconds", 900))
    shards: list[Shard] = []
    for row in payload.get("shards", []):
        shards.append(
            Shard(
                shard_id=row["id"],
                description=row.get("description", row["id"]),
                include=list(row.get("include", [])),
                exclude=list(row.get("exclude", [])),
            ),
        )
    return timeout_seconds, shards


def select_failed_shards(shards: list[Shard], previous_report_path: Path) -> list[Shard]:
    payload = json.loads(previous_report_path.read_text(encoding="utf-8"))
    failed = {
        row["id"]
        for row in payload.get("shards", [])
        if row.get("status") in {"failed", "timeout", "error"}
    }
    return [shard for shard in shards if shard.shard_id in failed]


def write_temp_tsconfig(shard: Shard) -> Path:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    rel_repo = Path("..") / ".."
    include = [str((rel_repo / pattern).as_posix()) for pattern in shard.include]
    exclude = [str((rel_repo / pattern).as_posix()) for pattern in shard.exclude]
    files: list[str] = []
    ambient_decl = REPO_ROOT / "src" / "types" / "vendor-ambient.d.ts"
    if ambient_decl.exists():
        files.append(str((rel_repo / "src" / "types" / "vendor-ambient.d.ts").as_posix()))
    payload = {
        "extends": str(REPO_ROOT / "tsconfig.json"),
        "compilerOptions": {
            "rootDir": str((Path("..") / "..").as_posix()),
        },
        "files": files,
        "include": include,
        "exclude": ["node_modules", "dist", *exclude],
    }
    out = TMP_DIR / f"tsconfig.{shard.shard_id}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out


def bucket_error(code: str, message: str) -> str:
    lowered = message.lower()
    if "cannot find module" in lowered:
        return "import_resolution"
    if "is not assignable to" in lowered:
        return "type_compatibility"
    if "does not exist on type" in lowered or "may only specify known properties" in lowered:
        return "missing_or_extra_property"
    if "possibly 'undefined'" in lowered or "possibly 'null'" in lowered:
        return "strict_nullability"
    if "implicitly has an 'any' type" in lowered:
        return "implicit_any"
    return f"other_{code.lower()}"


def parse_tsc_errors(stdout: str) -> tuple[list[dict[str, str]], dict[str, int]]:
    rows: list[dict[str, str]] = []
    buckets: dict[str, int] = {}
    for line in stdout.splitlines():
        text = line.strip()
        match = TSC_ERROR_RE.match(text)
        generic = TSC_GENERIC_ERROR_RE.match(text) if not match else None
        if not match and not generic:
            continue
        code = match.group("code") if match else generic.group("code")
        message = match.group("msg") if match else generic.group("msg")
        bucket = bucket_error(code, message)
        rows.append(
            {
                "file": match.group("file") if match else "<global>",
                "line": match.group("line") if match else "0",
                "col": match.group("col") if match else "0",
                "code": code,
                "message": message,
                "bucket": bucket,
            }
        )
        buckets[bucket] = buckets.get(bucket, 0) + 1
    return rows, buckets


def run_shard(shard: Shard, timeout_seconds: int) -> dict[str, Any]:
    started = time.time()
    temp_config = write_temp_tsconfig(shard)
    pnpm_exec = "pnpm.cmd" if sys.platform == "win32" else "pnpm"
    cmd = [
        pnpm_exec,
        "-s",
        "tsc",
        "-p",
        str(temp_config),
        "--noEmit",
        "--pretty",
        "false",
    ]
    env = dict(os.environ)
    env["NODE_OPTIONS"] = "--max-old-space-size=8192"
    try:
        completed = subprocess.run(
            cmd,
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout_seconds,
            env=env,
            check=False,
        )
        combined = (completed.stdout or "") + ("\n" + completed.stderr if completed.stderr else "")
        errors, buckets = parse_tsc_errors(combined)
        status = "passed" if completed.returncode == 0 else "failed"
        return {
            "id": shard.shard_id,
            "description": shard.description,
            "status": status,
            "exit_code": completed.returncode,
            "elapsed_seconds": round(time.time() - started, 2),
            "error_count": len(errors),
            "error_buckets": buckets,
            "errors": errors[:100],
            "output_excerpt": combined[-6000:],
        }
    except subprocess.TimeoutExpired as exc:
        combined = (exc.stdout or "") + ("\n" + exc.stderr if exc.stderr else "")
        errors, buckets = parse_tsc_errors(combined)
        return {
            "id": shard.shard_id,
            "description": shard.description,
            "status": "timeout",
            "exit_code": None,
            "elapsed_seconds": round(time.time() - started, 2),
            "error_count": len(errors),
            "error_buckets": buckets,
            "errors": errors[:100],
            "output_excerpt": combined[-6000:],
        }


def write_reports(report: dict[str, Any]) -> tuple[Path, Path]:
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    json_path = REPO_ROOT / "_docs" / f"tsc-shard-report-{stamp}.json"
    md_path = REPO_ROOT / "_docs" / f"tsc-shard-report-{stamp}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines: list[str] = [
        "# TSC Shard Report",
        "",
        f"- Started (UTC): `{report['started_utc']}`",
        f"- Timeout per shard (seconds): `{report['timeout_seconds']}`",
        f"- Total shards: `{len(report['shards'])}`",
        "",
        "## Shards",
        "",
    ]
    for row in report["shards"]:
        lines.append(
            f"- `{row['id']}`: `{row['status']}` (errors={row['error_count']}, elapsed={row['elapsed_seconds']}s)"
        )
    lines.extend(["", "## Error Buckets (aggregate)", ""])
    if report["error_buckets"]:
        for bucket, count in sorted(report["error_buckets"].items(), key=lambda x: (-x[1], x[0])):
            lines.append(f"- `{bucket}`: {count}")
    else:
        lines.append("- none")
    lines.extend(["", "## Failed Or Timeout Shards", ""])
    failed = [row for row in report["shards"] if row["status"] in {"failed", "timeout"}]
    if failed:
        for row in failed:
            lines.append(f"- `{row['id']}`: `{row['status']}`")
    else:
        lines.append("- none")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, md_path


def main() -> int:
    args = parse_args()
    config_path = Path(args.config).resolve()
    timeout_seconds, shards = load_config(config_path)
    if args.timeout_seconds > 0:
        timeout_seconds = args.timeout_seconds
    if args.failed_only:
        shards = select_failed_shards(shards, Path(args.failed_only).resolve())
        if not shards:
            print("No failed shards found in previous report.")
            return 0

    started_utc = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    results: list[dict[str, Any]] = []
    for shard in maybe_progress(shards, "tsc-shards"):
        results.append(run_shard(shard, timeout_seconds))

    aggregate_buckets: dict[str, int] = {}
    for row in results:
        for bucket, count in row["error_buckets"].items():
            aggregate_buckets[bucket] = aggregate_buckets.get(bucket, 0) + int(count)

    report = {
        "started_utc": started_utc,
        "timeout_seconds": timeout_seconds,
        "shards": results,
        "error_buckets": aggregate_buckets,
    }
    json_path, md_path = write_reports(report)
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")

    failed = [row for row in results if row["status"] in {"failed", "timeout"}]
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
