#!/usr/bin/env python3
"""
Automate a security-first upstream sync with a fixed four-stage pipeline.

Pipeline:
  1. Inventory current custom baseline and upstream touched paths.
  2. Classify touched paths in a dry-run resolver pass.
  3. Run the actual merge + conflict resolver only when dry-run blockers are absent.
  4. Audit public API drift and dependency/security versions before committing.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import api_delta_audit
import upstream_diff_inventory
from upstream_merge_policy import DEFAULT_PINNED_UPSTREAM_SHA, load_strategy

REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = REPO_ROOT / "_docs" / "merge-reports"
DEFAULT_REMOTE = "upstream"
DEFAULT_UPSTREAM_REF = "upstream/main"
DEFAULT_STRATEGY_FILE = REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json"
RELEASE_PACKAGE_EXPECTATIONS = (
    ('"hono": "4.12.10"', "package.json must carry hono 4.12.10"),
    ('"@hono/node-server": "1.19.10"', "package.json must carry @hono/node-server 1.19.10"),
)
RELEASE_LOCK_EXPECTATIONS = (
    ("basic-ftp@5.2.1:", "pnpm-lock.yaml must include basic-ftp 5.2.1"),
    ("@hono/node-server@1.19.10", "pnpm-lock.yaml must include @hono/node-server 1.19.10"),
)


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


def run_python(args: List[str], check: bool = True) -> RunResult:
    proc = subprocess.run(
        ["py", "-3", *args],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )
    result = RunResult(proc.returncode, proc.stdout.strip(), proc.stderr.strip())
    if check and result.code != 0:
        raise RuntimeError(
            f"py -3 {' '.join(args)} failed (code={result.code})\n"
            f"stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}"
        )
    return result


def current_branch() -> str:
    return run_git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout


def write_report(report: dict) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = REPORT_DIR / f"upstream-merge-{stamp}.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def resolve_ref_sha(ref: str) -> str:
    return run_git(["rev-parse", ref]).stdout


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def collect_followup_blockers(
    classifications: Iterable[dict[str, str]],
    blocker_actions: set[str] | frozenset[str],
) -> list[str]:
    return sorted(
        item["path"]
        for item in classifications
        if item.get("action") in blocker_actions
    )


def validate_release_security_versions() -> list[str]:
    issues: list[str] = []
    package_text = (REPO_ROOT / "package.json").read_text(encoding="utf-8")
    lock_text = (REPO_ROOT / "pnpm-lock.yaml").read_text(encoding="utf-8")

    for needle, message in RELEASE_PACKAGE_EXPECTATIONS:
        if needle not in package_text:
            issues.append(message)
    for needle, message in RELEASE_LOCK_EXPECTATIONS:
        if needle not in lock_text:
            issues.append(message)

    return issues


def build_api_followup_blockers(audit_report: dict[str, object]) -> list[str]:
    blockers: list[str] = []
    for module_path, module_delta in audit_report["module_named_exports"].items():
        added_exports = module_delta["added_exports_vs_upstream"]
        if added_exports:
            blockers.extend(f"{module_path}:{export_name}" for export_name in added_exports)
    return blockers


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
        "--pinned-upstream-sha",
        default=DEFAULT_PINNED_UPSTREAM_SHA,
        help="Expected upstream commit SHA. The sync stops if the fetched ref differs.",
    )
    parser.add_argument(
        "--commit-message",
        default="merge: sync upstream/main with security-first upstream policy",
        help="Merge commit message.",
    )
    parser.add_argument(
        "--conflict-policy",
        choices=["custom-first", "official-first"],
        default="custom-first",
        help="Default merge preference when strategy rules do not override per-path.",
    )
    parser.add_argument(
        "--strategy-file",
        default=str(DEFAULT_STRATEGY_FILE),
        help="Conflict strategy JSON consumed by resolve-merge-conflicts.py.",
    )
    parser.add_argument(
        "--audit-module",
        action="append",
        default=[],
        help="Optional module path to include in post-merge API audit. Can be passed multiple times.",
    )
    parser.add_argument(
        "--no-verify",
        action="store_true",
        help="Pass --no-verify to the final merge commit.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Run only inventory + dry-run classification.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    started = datetime.now(timezone.utc).isoformat()
    branch_before = current_branch()
    strategy = load_strategy(Path(args.strategy_file))

    report = {
        "started_at": started,
        "repo_root": str(REPO_ROOT),
        "branch_before": branch_before,
        "target_branch": args.target,
        "remote": args.remote,
        "upstream_ref": args.upstream_ref,
        "pinned_upstream_sha": args.pinned_upstream_sha,
        "conflict_policy": args.conflict_policy,
        "strategy_file": args.strategy_file,
        "dry_run": args.dry_run,
        "pipeline": [],
        "steps": [],
    }

    try:
        if branch_before != args.target:
            if args.dry_run:
                report["steps"].append(f"would checkout {args.target}")
            else:
                run_git(["switch", args.target])
                report["steps"].append(f"checked out {args.target}")

        run_git(["fetch", args.remote, "--prune"])
        report["steps"].append(f"fetched {args.remote} --prune")

        resolved_upstream_sha = resolve_ref_sha(args.upstream_ref)
        report["resolved_upstream_sha"] = resolved_upstream_sha
        if resolved_upstream_sha != args.pinned_upstream_sha:
            raise RuntimeError(
                f"{args.upstream_ref} resolved to {resolved_upstream_sha}, expected {args.pinned_upstream_sha}",
            )

        inventory_payload = upstream_diff_inventory.build_inventory(
            current_ref="HEAD",
            upstream_ref=args.upstream_ref,
            strategy_file=Path(args.strategy_file),
        )
        inventory_json = REPO_ROOT / "_docs" / "upstream-main-diff-inventory.json"
        inventory_md = REPO_ROOT / "_docs" / "upstream-main-diff-inventory.md"
        upstream_diff_inventory.write_report(inventory_payload, inventory_json, inventory_md)
        report["pipeline"].append(
            {
                "stage": "inventory",
                "json": str(inventory_json),
                "markdown": str(inventory_md),
                "counts": inventory_payload["counts"],
                "action_counts": inventory_payload["action_counts"],
            },
        )

        resolver_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        resolver_log = REPO_ROOT / "_docs" / f"merge-conflict-resolution-dry-run-{resolver_stamp}.md"
        resolver_json = REPORT_DIR / f"upstream-dry-run-{resolver_stamp}.json"
        resolver_result = run_python(
            [
                "scripts/tools/resolve-merge-conflicts.py",
                "--upstream-ref",
                args.upstream_ref,
                "--strategy-file",
                args.strategy_file,
                "--paths-file",
                str(inventory_json),
                "--dry-run",
                "--log-file",
                str(resolver_log),
                "--report-json",
                str(resolver_json),
                "--strict",
            ],
            check=False,
        )
        resolver_report = load_json(resolver_json)
        preflight_blockers = collect_followup_blockers(
            resolver_report["classifications"],
            strategy.blocker_actions,
        )
        report["pipeline"].append(
            {
                "stage": "upstream_dry_run",
                "report_json": str(resolver_json),
                "markdown": str(resolver_log),
                "stdout": resolver_result.stdout,
                "stderr": resolver_result.stderr,
                "blocked_paths": preflight_blockers,
            },
        )

        if preflight_blockers:
            report["result"] = "blocked-preflight"
            report["blocked_paths"] = preflight_blockers
            path = write_report(report)
            print(f"Preflight blockers found. See report: {path}")
            return 2

        if args.dry_run:
            report["result"] = "dry-run-ok"
            path = write_report(report)
            print(f"Report written: {path}")
            return 0

        merge_preference = "ours" if args.conflict_policy == "custom-first" else "theirs"
        merge_cmd = ["merge", "-X", merge_preference, "--no-edit", "--no-commit", args.upstream_ref]
        merge_result = run_git(merge_cmd, check=False)
        report["steps"].append(f"ran: git {' '.join(merge_cmd)}")
        if merge_result.code != 0:
            conflict_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            conflict_log = REPO_ROOT / "_docs" / f"merge-conflict-resolution-{conflict_stamp}.md"
            conflict_json = REPORT_DIR / f"merge-conflict-resolution-{conflict_stamp}.json"
            conflict_result = run_python(
                [
                    "scripts/tools/resolve-merge-conflicts.py",
                    "--upstream-ref",
                    args.upstream_ref,
                    "--strategy-file",
                    args.strategy_file,
                    "--log-file",
                    str(conflict_log),
                    "--report-json",
                    str(conflict_json),
                    "--strict",
                ],
                check=False,
            )
            conflict_report = load_json(conflict_json)
            conflict_blockers = collect_followup_blockers(
                conflict_report["classifications"],
                strategy.blocker_actions,
            )
            unresolved_conflicts = conflict_report["unresolved_conflicts"]
            report["pipeline"].append(
                {
                    "stage": "conflict_resolution",
                    "report_json": str(conflict_json),
                    "markdown": str(conflict_log),
                    "stdout": conflict_result.stdout,
                    "stderr": conflict_result.stderr,
                    "blocked_paths": conflict_blockers,
                    "unresolved_conflicts": unresolved_conflicts,
                },
            )
            if conflict_blockers or unresolved_conflicts:
                run_git(["merge", "--abort"], check=False)
                report["steps"].append("aborted merge after blocked conflict resolution")
                report["result"] = "blocked-conflict-resolution"
                path = write_report(report)
                print(f"Merge blockers found. See report: {path}")
                return 2
        else:
            report["pipeline"].append({"stage": "conflict_resolution", "status": "no-conflicts"})

        audit_modules = tuple(args.audit_module or api_delta_audit.DEFAULT_MODULES)
        audit_report = api_delta_audit.build_audit_report("WORKTREE", args.upstream_ref, audit_modules)
        audit_json = REPO_ROOT / "_docs" / "upstream-api-delta-audit.json"
        audit_md = REPO_ROOT / "_docs" / "upstream-api-delta-audit.md"
        api_delta_audit.write_report(audit_report, audit_json, audit_md)
        api_blockers = build_api_followup_blockers(audit_report)
        security_issues = validate_release_security_versions()
        report["pipeline"].append(
            {
                "stage": "post_merge_audit",
                "json": str(audit_json),
                "markdown": str(audit_md),
                "api_blockers": api_blockers,
                "security_issues": security_issues,
            },
        )
        if api_blockers or security_issues:
            run_git(["merge", "--abort"], check=False)
            report["steps"].append("aborted merge after post-merge audit blockers")
            report["result"] = "blocked-post-merge-audit"
            path = write_report(report)
            print(f"Post-merge blockers found. See report: {path}")
            return 2

        commit_cmd = ["commit", "-m", args.commit_message]
        if args.no_verify:
            commit_cmd.insert(1, "--no-verify")
        run_git(commit_cmd)
        report["steps"].append("created merge commit")
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
