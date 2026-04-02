#!/usr/bin/env python3
"""
Automate upstream/main sync with official-first policy.

Usage examples:
  py -3 scripts/tools/upstream_merge.py --target integrate/upstream-main-2026-04-01
  py -3 scripts/tools/upstream_merge.py --target main --dry-run
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List


REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = REPO_ROOT / "_docs" / "merge-reports"
DEFAULT_REMOTE = "upstream"
DEFAULT_UPSTREAM_REF = "upstream/main"


@dataclass
class RunResult:
    code: int
    stdout: str
    stderr: str


def run_git(args: List[str], check: bool = True) -> RunResult:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )
    result = RunResult(proc.returncode, proc.stdout.strip(), proc.stderr.strip())
    if check and result.code != 0:
        raise RuntimeError(
            f"git {' '.join(args)} failed (code={result.code})\n"
            f"stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}"
        )
    return result


def current_branch() -> str:
    return run_git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout


def unmerged_files() -> List[str]:
    out = run_git(["diff", "--name-only", "--diff-filter=U"], check=False).stdout
    return [line for line in out.splitlines() if line.strip()]


def resolve_conflicts_official_first(paths: List[str]) -> dict:
    kept_upstream: List[str] = []
    removed_local: List[str] = []
    unresolved: List[str] = []
    for path in paths:
        theirs = run_git(["checkout", "--theirs", "--", path], check=False)
        if theirs.code == 0:
            run_git(["add", "--", path], check=False)
            kept_upstream.append(path)
            continue
        rm = run_git(["rm", "--", path], check=False)
        if rm.code == 0:
            removed_local.append(path)
            continue
        unresolved.append(path)
    return {
        "kept_upstream": kept_upstream,
        "removed_local": removed_local,
        "unresolved": unresolved,
    }


def write_report(report: dict) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = REPORT_DIR / f"upstream-merge-{stamp}.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync with upstream/main automatically.")
    parser.add_argument("--target", required=True, help="Target branch to merge into.")
    parser.add_argument("--remote", default=DEFAULT_REMOTE, help="Upstream remote name.")
    parser.add_argument(
        "--upstream-ref",
        default=DEFAULT_UPSTREAM_REF,
        help="Upstream ref to merge (default: upstream/main).",
    )
    parser.add_argument(
        "--commit-message",
        default="merge: sync upstream/main with official-first conflict policy",
        help="Merge commit message.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Do not modify repository.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    started = datetime.now(timezone.utc).isoformat()
    branch_before = current_branch()

    report = {
        "started_at": started,
        "repo_root": str(REPO_ROOT),
        "branch_before": branch_before,
        "target_branch": args.target,
        "remote": args.remote,
        "upstream_ref": args.upstream_ref,
        "dry_run": args.dry_run,
        "steps": [],
    }

    try:
        if branch_before != args.target:
            if args.dry_run:
                report["steps"].append(f"would checkout {args.target}")
            else:
                run_git(["checkout", args.target])
                report["steps"].append(f"checked out {args.target}")

        if args.dry_run:
            report["steps"].append(f"would fetch {args.remote} --prune")
        else:
            run_git(["fetch", args.remote, "--prune"])
            report["steps"].append("fetched upstream")

        merge_cmd = ["merge", "-X", "theirs", "--no-edit", args.upstream_ref]
        if args.dry_run:
            report["steps"].append(f"would run: git {' '.join(merge_cmd)}")
            report["result"] = "dry-run"
        else:
            merge_result = run_git(merge_cmd, check=False)
            if merge_result.code != 0:
                report["steps"].append("merge reported conflicts, applying official-first resolver")
                conflicts = unmerged_files()
                report["conflicts"] = conflicts
                resolved = resolve_conflicts_official_first(conflicts)
                report["conflict_resolution"] = resolved
                if resolved["unresolved"]:
                    report["result"] = "failed-unresolved-conflicts"
                    report["errors"] = resolved["unresolved"]
                    path = write_report(report)
                    print(f"Unresolved conflicts. See report: {path}")
                    return 2
                run_git(["add", "-A"])
                run_git(["commit", "--no-verify", "-m", args.commit_message])
                report["steps"].append("merge commit created with no-verify fallback")
            else:
                report["steps"].append("merge completed without conflicts")
            report["result"] = "ok"

        path = write_report(report)
        print(f"Report written: {path}")
        return 0
    except Exception as exc:  # pylint: disable=broad-except
        report["result"] = "failed-exception"
        report["error"] = str(exc)
        path = write_report(report)
        print(f"Failed. See report: {path}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
