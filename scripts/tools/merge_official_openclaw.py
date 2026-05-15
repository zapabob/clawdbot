#!/usr/bin/env python3
"""Assist release-to-fork OpenClaw merges without touching identity SOUL files."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


REPO_ROOT = Path(__file__).resolve().parents[2]
IMMUTABLE_FILES = ("SOUL.md", "identity/SOUL.md")
REPORT_DIR = "_docs"
REPORT_SUFFIX = "_official-openclaw-merge-report.json"
DEFAULT_TARGET = "latest-main"
LATEST_MAIN_ALIASES = {"latest", "latest-main", "latest-official", "official-main", "upstream-main"}
LATEST_STABLE_ALIASES = {"latest-stable", "latest-release", "official-release"}
OFFICIAL_TAG_NAMESPACE = "refs/openclaw-official/tags"
OFFICIAL_VERSION_TAG_RE = re.compile(
    r"^v(?P<year>\d{4})\.(?P<month>\d+)\.(?P<day>\d+)(?:-(?P<suffix>[0-9A-Za-z.-]+))?$"
)
KNOWN_UNTRACKED_LOCAL_PREFIXES = (
    ".openclaw-desktop/",
    ".openclaw/",
    ".openhands/",
    ".pi/",
    ".pochi/",
    ".python/",
    ".qoder/",
    ".qwen/",
    ".roo/",
    ".specstory/",
    ".trae/",
    ".vscode/",
    ".windsurf/",
    ".zencoder/",
    "_docs/",
    "_artifacts/",
    "_snapshots/",
    "debug-",
    "logs/",
    "tmp-",
)
KNOWN_UNTRACKED_LOCAL_FILES = {
    "MEMORY.md",
    "SOUL.md",
    "identity/SOUL.md",
    "nul",
    "pnpm-dev-build-last.log",
    "tsdown-last.log",
    "web_scavenge.log",
}


RESOLUTION_POLICY = {
    "immutable": "Abort and preserve local bytes; do not resolve by accepting official changes.",
    "generated-or-platform": "Prefer regenerated output or official platform updates after source-side review.",
    "local-overlay": "Preserve local overlay state; do not stage runtime or identity artifacts.",
    "local-extension": "Prefer local extension ownership unless official contract changes require an adapter.",
    "shared-api": "Manual review; keep SDK/API compatibility and add/update contract tests when needed.",
    "official-owned": "Prefer official OpenClaw content unless it breaks documented local fork behavior.",
}


@dataclass(frozen=True)
class CommandResult:
    args: list[str]
    returncode: int
    stdout: str
    stderr: str


@dataclass(frozen=True)
class ResolvedRef:
    requested: str
    target_ref: str
    commit: str


@dataclass(frozen=True)
class RemoteTag:
    name: str
    object_id: str


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


def normalize_path(path: str) -> str:
    return path.replace("\\", "/")


def is_merge_report_path(path: str) -> bool:
    normalized = normalize_path(path)
    return normalized.startswith(f"{REPORT_DIR}/") and normalized.endswith(REPORT_SUFFIX)


def is_immutable_path(path: str) -> bool:
    normalized = normalize_path(path)
    return normalized in IMMUTABLE_FILES


def is_known_untracked_local_path(path: str) -> bool:
    normalized = normalize_path(path)
    return normalized in KNOWN_UNTRACKED_LOCAL_FILES or any(
        normalized.startswith(prefix) for prefix in KNOWN_UNTRACKED_LOCAL_PREFIXES
    )


def path_overlaps(left: str, right: str) -> bool:
    left_normalized = normalize_path(left).rstrip("/")
    right_normalized = normalize_path(right).rstrip("/")
    return (
        left_normalized == right_normalized
        or right_normalized.startswith(f"{left_normalized}/")
        or left_normalized.startswith(f"{right_normalized}/")
    )


def overlapping_paths(left_paths: list[str], right_paths: list[str]) -> list[str]:
    overlaps: set[str] = set()
    for left in left_paths:
        for right in right_paths:
            if path_overlaps(left, right):
                overlaps.add(left)
    return sorted(overlaps)


def overlapping_untracked_paths(
    left_paths: list[str],
    right_paths: list[str],
    *,
    path_exists: Callable[[str], bool] | None = None,
) -> list[str]:
    exists = path_exists or (lambda path: (REPO_ROOT / path).exists())
    overlaps: set[str] = set()
    for left in left_paths:
        left_normalized = normalize_path(left)
        left_directory = left_normalized.endswith("/") or (REPO_ROOT / left_normalized).is_dir()
        left_prefix = left_normalized.rstrip("/")
        for right in right_paths:
            right_normalized = normalize_path(right)
            if left_directory:
                if right_normalized.startswith(f"{left_prefix}/") and exists(right_normalized):
                    overlaps.add(right_normalized)
                continue
            if path_overlaps(left_normalized, right_normalized):
                overlaps.add(left_normalized)
    return sorted(overlaps)


def parse_official_version_tag(tag: str) -> tuple[int, int, int, int, int] | None:
    match = OFFICIAL_VERSION_TAG_RE.match(tag)
    if not match:
        return None
    suffix = match.group("suffix") or ""
    suffix_lower = suffix.lower()
    if any(marker in suffix_lower for marker in ("alpha", "beta", "rc", "pre")):
        return None

    suffix_rank = 0
    if suffix:
        numeric_parts = [int(part) for part in re.findall(r"\d+", suffix)]
        suffix_rank = 1 + (numeric_parts[0] if numeric_parts else 0)

    return (
        int(match.group("year")),
        int(match.group("month")),
        int(match.group("day")),
        suffix_rank,
        len(suffix),
    )


def select_latest_official_tag(tags: list[RemoteTag]) -> RemoteTag | None:
    candidates: list[tuple[tuple[int, int, int, int, int], RemoteTag]] = []
    for tag in tags:
        sort_key = parse_official_version_tag(tag.name)
        if sort_key is not None:
            candidates.append((sort_key, tag))
    if not candidates:
        return None
    return max(candidates, key=lambda item: item[0])[1]


def list_remote_official_tags() -> list[RemoteTag]:
    result = run_git(["ls-remote", "--tags", "--refs", "upstream", "refs/tags/v[0-9]*"], check=True)
    tags: list[RemoteTag] = []
    for line in result.stdout.splitlines():
        parts = line.split()
        if len(parts) != 2:
            continue
        object_id, ref = parts
        if not ref.startswith("refs/tags/"):
            continue
        tags.append(RemoteTag(name=ref.removeprefix("refs/tags/"), object_id=object_id))
    return tags


def fetch_official_tag_to_namespace(tag: str) -> ResolvedRef:
    namespace_ref = f"{OFFICIAL_TAG_NAMESPACE}/{tag}"
    run_git(["fetch", "upstream", "--no-tags", f"refs/tags/{tag}:{namespace_ref}"], check=True)
    commit = try_resolve_revision(namespace_ref)
    if commit is None:
        raise RuntimeError(f"Could not resolve fetched official tag as a commit: {tag}")
    return ResolvedRef(requested=tag, target_ref=namespace_ref, commit=commit)


def sha256_file(relative_path: str) -> dict[str, Any]:
    path = REPO_ROOT / relative_path
    if not path.exists():
        return {
            "path": relative_path,
            "exists": False,
            "sha256": None,
            "bytes": 0,
        }
    data = path.read_bytes()
    return {
        "path": relative_path,
        "exists": True,
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def soul_hashes() -> list[dict[str, Any]]:
    return [sha256_file(path) for path in IMMUTABLE_FILES]


def clean_validation() -> dict[str, Any]:
    blocked: list[dict[str, str]] = []
    ignored_untracked: list[str] = []
    other_untracked: list[str] = []
    status_lines = run_git(["status", "--porcelain"], check=True).stdout.splitlines()

    for line in status_lines:
        if len(line) < 4:
            continue
        status = line[:2]
        path = normalize_path(line[3:].strip())
        if " -> " in path:
            path = normalize_path(path.split(" -> ", 1)[1])

        if is_merge_report_path(path):
            continue
        if status == "??" and is_known_untracked_local_path(path):
            ignored_untracked.append(path)
            continue
        if status == "??":
            other_untracked.append(path)
            continue
        blocked.append({"path": path, "status": status, "reason": "tracked-or-staged"})

    return {
        "ok": not blocked,
        "blocked": blocked,
        "ignoredUntracked": sorted(ignored_untracked),
        "otherUntracked": sorted(other_untracked),
        "untrackedPaths": sorted(ignored_untracked + other_untracked),
    }


def status_path(line: str) -> str | None:
    if len(line) < 4:
        return None
    path = normalize_path(line[3:].strip())
    if " -> " in path:
        path = normalize_path(path.split(" -> ", 1)[1])
    return path


def tracked_status_paths(status_lines: list[str]) -> set[str]:
    paths: set[str] = set()
    for line in status_lines:
        if len(line) < 4 or line[:2] == "??":
            continue
        path = status_path(line)
        if path:
            paths.add(path)
    return paths


def restore_pathspec(paths: list[str], *, filename: str) -> CommandResult | None:
    if not paths:
        return None
    pathspec = REPO_ROOT / ".git" / filename
    pathspec.write_text("\n".join(paths) + "\n", encoding="utf-8")
    try:
        return run_git(["restore", "--staged", "--worktree", f"--pathspec-from-file={pathspec}"], check=False)
    finally:
        pathspec.unlink(missing_ok=True)


def restore_dry_run_side_effects(preexisting_tracked_dirty: set[str]) -> dict[str, Any]:
    status_after = run_git(["status", "--porcelain"], check=True).stdout.splitlines()
    changed_after = tracked_status_paths(status_after)
    restore_paths = sorted(changed_after - preexisting_tracked_dirty)
    restore_result = restore_pathspec(restore_paths, filename="openclaw-dry-run-restore-paths.txt")
    status_restored = run_git(["status", "--porcelain"], check=True).stdout.splitlines()
    remaining_unexpected = sorted(tracked_status_paths(status_restored) - preexisting_tracked_dirty)
    return {
        "paths": restore_paths,
        "restoreCommand": None
        if restore_result is None
        else {
            "args": ["git", *restore_result.args],
            "returnCode": restore_result.returncode,
            "stderr": restore_result.stderr.splitlines(),
        },
        "remainingUnexpectedTrackedPaths": remaining_unexpected,
    }


def ensure_tracked_clean() -> dict[str, Any]:
    validation = clean_validation()
    if not validation["ok"]:
        blocked = ", ".join(f"{item['status']} {item['path']}" for item in validation["blocked"])
        raise RuntimeError(f"Tracked/staged or unknown-untracked changes block merge helper: {blocked}")
    return validation


def try_resolve_revision(revision: str) -> str | None:
    result = run_git(["rev-parse", "--verify", f"{revision}^{{commit}}"], check=False)
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def resolve_target_ref(target: str) -> ResolvedRef:
    if target in LATEST_MAIN_ALIASES:
        commit = try_resolve_revision("refs/remotes/upstream/main") or try_resolve_revision("upstream/main")
        if commit:
            return ResolvedRef(requested=target, target_ref="refs/remotes/upstream/main", commit=commit)
        raise RuntimeError("Could not resolve latest official main. Run with --fetch-ref main or fetch upstream/main.")

    if target in LATEST_STABLE_ALIASES:
        latest_tag = select_latest_official_tag(list_remote_official_tags())
        if latest_tag is None:
            raise RuntimeError("Could not discover a latest stable official OpenClaw tag.")
        return fetch_official_tag_to_namespace(latest_tag.name)

    candidates = [
        target,
        f"refs/tags/{target}",
        f"{OFFICIAL_TAG_NAMESPACE}/{target}",
        f"refs/heads/{target}",
        f"refs/remotes/upstream/{target}",
        f"upstream/{target}",
        f"refs/remotes/origin/{target}",
        f"origin/{target}",
    ]
    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        commit = try_resolve_revision(candidate)
        if commit:
            return ResolvedRef(requested=target, target_ref=candidate, commit=commit)
    raise RuntimeError(f"Could not resolve target ref as a commit: {target}")


def current_head() -> str:
    return run_git(["rev-parse", "HEAD"], check=True).stdout.strip()


def merge_base(target_commit: str) -> str | None:
    result = run_git(["merge-base", "HEAD", target_commit], check=False)
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def changed_paths_between(base: str | None, target_commit: str) -> list[str]:
    if base:
        args = ["diff", "--name-only", "--find-renames", f"{base}..{target_commit}"]
    else:
        args = ["diff", "--name-only", "--find-renames", "HEAD", target_commit]
    raw = run_git(args, check=True).stdout
    return sorted(normalize_path(line.strip()) for line in raw.splitlines() if line.strip())


def tracked_dirty_paths(clean: dict[str, Any]) -> list[str]:
    return sorted(
        normalize_path(item["path"])
        for item in clean.get("blocked", [])
        if isinstance(item, dict) and item.get("status") != "??" and item.get("path")
    )


def workspace_state_against_target(
    target_commit: str,
    *,
    allow_dirty_overlay: bool,
) -> dict[str, Any]:
    validation = clean_validation()
    base = merge_base(target_commit)
    target_changed_paths = changed_paths_between(base, target_commit)
    dirty_paths = tracked_dirty_paths(validation)
    tracked_overlap = overlapping_paths(dirty_paths, target_changed_paths)
    untracked_paths = [
        normalize_path(path)
        for path in validation.get("untrackedPaths", [])
        if isinstance(path, str)
    ]
    untracked_overlap = overlapping_untracked_paths(untracked_paths, target_changed_paths)
    immutable_target_paths = sorted(path for path in target_changed_paths if is_immutable_path(path))
    validation["dirtyOverlay"] = {
        "allowed": allow_dirty_overlay,
        "mergeBase": base,
        "dirtyTrackedPaths": dirty_paths,
        "untrackedPaths": sorted(untracked_paths),
        "targetChangedPaths": target_changed_paths,
        "overlap": tracked_overlap,
        "untrackedOverlap": untracked_overlap,
        "immutableTargetPaths": immutable_target_paths,
        "ok": validation["ok"] or (allow_dirty_overlay and not tracked_overlap and not untracked_overlap),
    }
    return validation


def ensure_merge_safe_workspace(
    target_commit: str,
    *,
    allow_dirty_overlay: bool,
) -> dict[str, Any]:
    validation = workspace_state_against_target(
        target_commit,
        allow_dirty_overlay=allow_dirty_overlay,
    )
    dirty_overlay = validation["dirtyOverlay"]
    immutable_target_paths = dirty_overlay.get("immutableTargetPaths", [])
    if immutable_target_paths:
        raise RuntimeError(
            "Official target touches immutable SOUL files; aborting before merge: "
            + ", ".join(immutable_target_paths)
        )
    if dirty_overlay.get("untrackedOverlap"):
        raise RuntimeError(
            "Untracked local files overlap the official target; move/checkpoint first: "
            + ", ".join(dirty_overlay["untrackedOverlap"])
        )
    if validation["ok"]:
        return validation
    if allow_dirty_overlay and not dirty_overlay.get("overlap"):
        return validation
    blocked = ", ".join(f"{item['status']} {item['path']}" for item in validation["blocked"])
    if dirty_overlay.get("overlap"):
        raise RuntimeError(
            "Dirty tracked changes overlap the official target; clean/checkpoint first: "
            + ", ".join(dirty_overlay["overlap"])
        )
    raise RuntimeError(f"Tracked/staged or unknown-untracked changes block merge helper: {blocked}")


def classify_path(path: str) -> str:
    normalized = normalize_path(path)
    if is_immutable_path(normalized):
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


def conflict_buckets(conflicts: list[dict[str, str]]) -> dict[str, list[str]]:
    buckets: dict[str, list[str]] = {bucket: [] for bucket in RESOLUTION_POLICY}
    for conflict in conflicts:
        buckets.setdefault(conflict["bucket"], []).append(conflict["path"])
    return {bucket: sorted(paths) for bucket, paths in buckets.items() if paths}


def write_report(report: dict[str, Any], name: str | None = None) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_name = name or f"{timestamp}{REPORT_SUFFIX}"
    report_path = REPO_ROOT / REPORT_DIR / report_name
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report_path


def verify_immutable(before: list[dict[str, Any]]) -> dict[str, Any]:
    after = soul_hashes()
    ok = before == after
    return {
        "ok": ok,
        "before": before,
        "after": after,
        "changed": [item["path"] for item in after if item not in before],
    }


def enforce_immutable(before: list[dict[str, Any]]) -> None:
    after = soul_hashes()
    if before != after:
        raise RuntimeError("Immutable SOUL files changed during merge helper execution.")


def build_report(
    *,
    mode: str,
    target: str,
    resolved: ResolvedRef | None,
    head_before: str,
    before_hashes: list[dict[str, Any]],
    clean: dict[str, Any] | None,
    merge_result: CommandResult | None = None,
    fetch_result: CommandResult | None = None,
) -> dict[str, Any]:
    after_hashes = soul_hashes()
    conflicts = conflicted_files()
    target_commit = resolved.commit if resolved else None
    return {
        "mode": mode,
        "target": target,
        "targetRef": resolved.target_ref if resolved else None,
        "targetCommit": target_commit,
        "headBefore": head_before,
        "mergeBase": merge_base(target_commit) if target_commit else None,
        "soulHashesBeforeAfter": {
            "before": before_hashes,
            "after": after_hashes,
        },
        "conflicts": conflicts,
        "conflictBuckets": conflict_buckets(conflicts),
        "resolutionPolicy": RESOLUTION_POLICY,
        "verificationResults": {
            "trackedClean": clean,
            "targetResolved": {
                "ok": resolved is not None,
                "requested": target,
                "targetRef": resolved.target_ref if resolved else None,
                "targetCommit": target_commit,
            },
            "soulHashGuard": {
                "ok": before_hashes == after_hashes,
            },
            "mergeCommand": None
            if merge_result is None
            else {
                "args": ["git", *merge_result.args],
                "returnCode": merge_result.returncode,
            },
            "fetchCommand": None
            if fetch_result is None
            else {
                "args": ["git", *fetch_result.args],
                "returnCode": fetch_result.returncode,
            },
        },
        "mergeReturnCode": merge_result.returncode if merge_result else None,
        "mergeStdout": merge_result.stdout.splitlines() if merge_result else [],
        "mergeStderr": merge_result.stderr.splitlines() if merge_result else [],
        "fetchReturnCode": fetch_result.returncode if fetch_result else None,
        "fetchStdout": fetch_result.stdout.splitlines() if fetch_result else [],
        "fetchStderr": fetch_result.stderr.splitlines() if fetch_result else [],
        "statusPorcelain": run_git(["status", "--porcelain"], check=True).stdout.splitlines(),
    }


def fetch_upstream(fetch_ref: str | None) -> CommandResult | None:
    if fetch_ref is None:
        return None
    args = ["fetch", "upstream", "--prune", "--no-tags"]
    if fetch_ref:
        args.append(fetch_ref)
    fetch = run_git(args, check=False)
    if fetch.returncode != 0:
        print(fetch.stdout, end="")
        print(fetch.stderr, end="", file=sys.stderr)
        raise RuntimeError(f"git {' '.join(args)} failed with {fetch.returncode}")
    return fetch


def dry_run(
    target: str,
    *,
    fetch_result: CommandResult | None = None,
    allow_dirty_overlay: bool = False,
) -> Path:
    head_before = current_head()
    before = soul_hashes()
    status_before = run_git(["status", "--porcelain"], check=True).stdout.splitlines()
    preexisting_tracked_dirty = tracked_status_paths(status_before)
    resolved = resolve_target_ref(target)
    clean = ensure_merge_safe_workspace(
        resolved.commit,
        allow_dirty_overlay=allow_dirty_overlay,
    )
    merge = run_git(["merge", "--no-commit", "--no-ff", resolved.commit], check=False)
    report = build_report(
        mode="dry-run",
        target=target,
        resolved=resolved,
        head_before=head_before,
        before_hashes=before,
        clean=clean,
        merge_result=merge,
        fetch_result=fetch_result,
    )
    report_path = write_report(report)
    abort = run_git(["merge", "--abort"], check=False)
    report["verificationResults"]["mergeAbort"] = {  # type: ignore[index]
        "args": ["git", *abort.args],
        "returnCode": abort.returncode,
    }
    if abort.returncode != 0:
        report["verificationResults"]["dryRunSideEffectRestore"] = restore_dry_run_side_effects(  # type: ignore[index]
            preexisting_tracked_dirty,
        )
    report["statusAfterAbort"] = run_git(["status", "--porcelain"], check=True).stdout.splitlines()
    write_report(report, report_path.name)
    enforce_immutable(before)
    return report_path


def real_merge(
    target: str,
    *,
    fetch_result: CommandResult | None = None,
    allow_dirty_overlay: bool = False,
) -> Path:
    if allow_dirty_overlay:
        raise RuntimeError(
            "--allow-dirty-overlay is report/dry-run only; checkpoint or clean tracked changes before real merge."
        )
    head_before = current_head()
    before = soul_hashes()
    resolved = resolve_target_ref(target)
    clean = ensure_merge_safe_workspace(
        resolved.commit,
        allow_dirty_overlay=allow_dirty_overlay,
    )
    merge = run_git(["merge", "--no-commit", "--no-ff", resolved.commit], check=False)
    report = build_report(
        mode="merge",
        target=target,
        resolved=resolved,
        head_before=head_before,
        before_hashes=before,
        clean=clean,
        merge_result=merge,
        fetch_result=fetch_result,
    )
    report_path = write_report(report)
    enforce_immutable(before)
    if any(item["bucket"] == "immutable" for item in report["conflicts"]):  # type: ignore[index]
        raise RuntimeError("Immutable file conflict detected; abort and resolve policy first.")
    return report_path


def report_only(target: str, *, fetch_result: CommandResult | None = None) -> Path:
    head_before = current_head()
    before = soul_hashes()
    resolved: ResolvedRef | None = None
    resolve_error: str | None = None
    try:
        resolved = resolve_target_ref(target)
    except Exception as error:
        resolve_error = str(error)
    clean = clean_validation()
    if resolved:
        clean = workspace_state_against_target(resolved.commit, allow_dirty_overlay=True)
    report = build_report(
        mode="report-only",
        target=target,
        resolved=resolved,
        head_before=head_before,
        before_hashes=before,
        clean=clean,
        fetch_result=fetch_result,
    )
    if resolve_error:
        report["verificationResults"]["targetResolved"]["error"] = resolve_error  # type: ignore[index]
    return write_report(report)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help="Official tag/branch/commit to merge. Aliases: latest-main, latest-stable.",
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Run merge classification, then abort.")
    mode.add_argument("--report-only", action="store_true", help="Write a report for the current state without merging.")
    parser.add_argument(
        "--allow-dirty-overlay",
        action="store_true",
        help="Allow dirty tracked local overlay only when it does not overlap target-changed paths.",
    )
    parser.add_argument(
        "--fetch-ref",
        nargs="?",
        const="main",
        default="main",
        help="Fetch upstream before resolving the target; optionally pass one ref/refspec.",
    )
    parser.add_argument("--no-fetch", action="store_true", help="Skip the default upstream fetch.")
    parser.add_argument("--fetch", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()

    try:
        fetch_ref = None if args.no_fetch else args.fetch_ref
        if args.fetch and fetch_ref is None:
            fetch_ref = "main"
        fetch_result = fetch_upstream(fetch_ref)
        if args.report_only:
            report_path = report_only(args.target, fetch_result=fetch_result)
        elif args.dry_run:
            report_path = dry_run(
                args.target,
                fetch_result=fetch_result,
                allow_dirty_overlay=args.allow_dirty_overlay,
            )
        else:
            report_path = real_merge(
                args.target,
                fetch_result=fetch_result,
                allow_dirty_overlay=args.allow_dirty_overlay,
            )
    except Exception as error:
        print(f"merge helper failed: {error}", file=sys.stderr)
        return 1

    print(report_path.relative_to(REPO_ROOT).as_posix())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
