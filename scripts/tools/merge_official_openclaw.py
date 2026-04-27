#!/usr/bin/env python3
"""Assist release-to-fork OpenClaw merges without touching SOUL files."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
IMMUTABLE_FILES = ("SOUL.md", "identity/SOUL.md")
REPORT_DIR = "_docs"


@dataclass(frozen=True)
class CommandResult:
    args: list[str]
    returncode: int
    stdout: str
    stderr: str


def run_git(args: list[str], *, check: bool = True) -> CommandResult:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
    )
    command_result = CommandResult(args=args, returncode=result.returncode, stdout=result.stdout, stderr=result.stderr)
    if check and result.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} failed with {result.returncode}\n{result.stdout}\n{result.stderr}"
        )
    return command_result


def sha256_file(relative_path: str) -> dict[str, object]:
    data = (REPO_ROOT / relative_path).read_bytes()
    return {
        "path": relative_path,
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def ensure_clean() -> None:
    status = run_git(["status", "--porcelain"], check=True).stdout.strip()
    if status:
        raise RuntimeError("Working tree must be clean before merge helper runs.")


def resolve_revision(revision: str) -> str:
    return run_git(["rev-parse", f"{revision}^{{commit}}"], check=True).stdout.strip()


def current_head() -> str:
    return run_git(["rev-parse", "HEAD"], check=True).stdout.strip()


def classify_path(path: str) -> str:
    normalized = path.replace("\\", "/")
    if normalized in IMMUTABLE_FILES:
        return "immutable"
    if normalized.startswith(("docs/.generated/", "dist/", "apps/")):
        return "generated-or-platform"
    if normalized.startswith((".openclaw-desktop/", "identity/", "memory/", "_docs/", "_artifacts/", "_snapshots/")):
        return "local-overlay"
    if normalized.startswith(("extensions/hypura-harness/", "extensions/live2d-companion/", "vendor/submodules/")):
        return "local-extension"
    if normalized.startswith(("src/plugin-sdk/", "src/plugins/", "src/agents/", "scripts/", "package.json", "pnpm-lock.yaml")):
        return "shared-api"
    return "official-owned"


def conflicted_files() -> list[dict[str, str]]:
    raw = run_git(["diff", "--name-only", "--diff-filter=U"], check=True).stdout
    return [
        {"path": line.strip(), "bucket": classify_path(line.strip())}
        for line in raw.splitlines()
        if line.strip()
    ]


def write_report(report: dict[str, object], name: str | None = None) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_name = name or f"{timestamp}_official-openclaw-merge-report.json"
    report_path = REPO_ROOT / REPORT_DIR / report_name
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report_path


def verify_immutable(before: list[dict[str, object]]) -> None:
    after = [sha256_file(path) for path in IMMUTABLE_FILES]
    if before != after:
        raise RuntimeError("Immutable SOUL files changed during merge helper execution.")


def build_report(target: str, target_commit: str, before_hashes: list[dict[str, object]]) -> dict[str, object]:
    return {
        "target": target,
        "targetCommit": target_commit,
        "headBefore": current_head(),
        "immutableBefore": before_hashes,
        "conflicts": conflicted_files(),
        "statusPorcelain": run_git(["status", "--porcelain"], check=True).stdout.splitlines(),
    }


def dry_run(target: str) -> Path:
    ensure_clean()
    before = [sha256_file(path) for path in IMMUTABLE_FILES]
    target_commit = resolve_revision(target)
    merge = run_git(["merge", "--no-commit", "--no-ff", target_commit], check=False)
    report = build_report(target, target_commit, before)
    report["mergeReturnCode"] = merge.returncode
    report["mergeStdout"] = merge.stdout.splitlines()
    report["mergeStderr"] = merge.stderr.splitlines()
    report_path = write_report(report)
    run_git(["merge", "--abort"], check=False)
    verify_immutable(before)
    return report_path


def real_merge(target: str) -> Path:
    ensure_clean()
    before = [sha256_file(path) for path in IMMUTABLE_FILES]
    target_commit = resolve_revision(target)
    merge = run_git(["merge", "--no-commit", "--no-ff", target_commit], check=False)
    report = build_report(target, target_commit, before)
    report["mergeReturnCode"] = merge.returncode
    report["mergeStdout"] = merge.stdout.splitlines()
    report["mergeStderr"] = merge.stderr.splitlines()
    report_path = write_report(report)
    verify_immutable(before)
    if any(item["bucket"] == "immutable" for item in report["conflicts"]):  # type: ignore[index]
        raise RuntimeError("Immutable file conflict detected; abort and resolve policy first.")
    return report_path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", default="v2026.4.25", help="Official tag/branch/commit to merge.")
    parser.add_argument("--dry-run", action="store_true", help="Run merge classification, then abort.")
    parser.add_argument("--fetch", action="store_true", help="Fetch upstream before resolving the target.")
    args = parser.parse_args()

    if args.fetch:
        fetch = run_git(["fetch", "upstream", "--prune"], check=False)
        if fetch.returncode != 0:
            print(fetch.stdout, end="")
            print(fetch.stderr, end="", file=sys.stderr)
            return fetch.returncode

    try:
        report_path = dry_run(args.target) if args.dry_run else real_merge(args.target)
    except Exception as error:
        print(f"merge helper failed: {error}", file=sys.stderr)
        return 1

    print(report_path.relative_to(REPO_ROOT).as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
