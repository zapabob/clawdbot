#!/usr/bin/env python3
"""Resolve upstream merge conflicts with reproducible strategy mapping."""

import argparse
import fnmatch
import json
import re
import subprocess
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_STRATEGY_FILE = REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.json"


@dataclass(frozen=True)
class Rule:
    pattern: str
    resolution: str
    note: str = ""


class Resolver:
    def __init__(self, upstream_ref: str, dry_run: bool):
        self.upstream_ref = upstream_ref
        self.dry_run = dry_run
        self.actions: list[dict[str, str]] = []

    def run(self, cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
        print(f"  $ {' '.join(cmd)}")
        if self.dry_run:
            return subprocess.CompletedProcess(cmd, 0, "", "")
        return subprocess.run(
            cmd,
            cwd=REPO_ROOT,
            check=check,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )

    def record(self, path: str, resolution: str, result: str, note: str = "") -> None:
        self.actions.append(
            {
                "path": path,
                "resolution": resolution,
                "result": result,
                "note": note,
            },
        )

    def git_checkout_upstream(self, path: str) -> None:
        self.run(["git", "checkout", self.upstream_ref, "--", path])

    def git_checkout_head(self, path: str) -> None:
        self.run(["git", "checkout", "HEAD", "--", path])

    def git_add(self, path: str) -> None:
        self.run(["git", "add", "--", path], check=False)

    def resolve_ours(self, path: str) -> None:
        self.git_checkout_head(path)
        self.git_add(path)

    def resolve_theirs(self, path: str) -> None:
        self.git_checkout_upstream(path)
        self.git_add(path)

    def accept_upstream_file(self, path: str) -> None:
        self.git_checkout_upstream(path)
        self.git_add(path)

    def accept_upstream_deletion(self, path: str) -> None:
        if not self.dry_run:
            file = REPO_ROOT / path
            if file.exists():
                file.unlink()
        result = self.run(["git", "rm", "--cached", "--", path], check=False)
        if result.returncode != 0:
            self.run(["git", "add", "--", path], check=False)

    def resolve_gitignore(self, path: str) -> None:
        self.git_checkout_head(path)
        if self.dry_run:
            self.git_add(path)
            return
        filepath = REPO_ROOT / path
        content = filepath.read_text(encoding="utf-8")
        upstream_additions = [
            "# Deprecated changelog fragment workflow",
            "changelog/fragments/",
            "",
            "# Local scratch workspace",
            ".tmp/",
        ]
        lines_to_add = [line for line in upstream_additions if line not in content]
        if lines_to_add:
            content = content.rstrip("\n") + "\n\n" + "\n".join(lines_to_add) + "\n"
            filepath.write_text(content, encoding="utf-8")
        self.git_add(path)

    def resolve_agents_md(self, path: str) -> None:
        self.git_checkout_head(path)
        if self.dry_run:
            self.git_add(path)
            return
        filepath = REPO_ROOT / path
        content = filepath.read_text(encoding="utf-8")
        upstream_header = (
            "<!-- upstream: https://github.com/openclaw/openclaw -->\n"
            "<!-- Do not edit CODEOWNERS-restricted paths without explicit owner review. -->\n\n"
        )
        if "<!-- upstream:" not in content:
            filepath.write_text(upstream_header + content, encoding="utf-8")
        self.git_add(path)

    def resolve_package_json_fixup(self, path: str) -> None:
        self.resolve_theirs(path)
        if self.dry_run:
            return
        filepath = REPO_ROOT / path
        if not filepath.exists():
            return
        content = filepath.read_text(encoding="utf-8")
        updated = re.sub(
            r'"format:check":\s*"oxfmt --check[^"]*"',
            '"format:check": "oxfmt --check --threads=1"',
            content,
        )
        if updated != content:
            filepath.write_text(updated, encoding="utf-8")
            self.git_add(path)

    def apply_resolution(self, path: str, resolution: str) -> str:
        if resolution == "ours":
            self.resolve_ours(path)
            return "resolved"
        if resolution == "theirs":
            self.resolve_theirs(path)
            return "resolved"
        if resolution == "upstream_file":
            self.accept_upstream_file(path)
            return "resolved"
        if resolution == "upstream_delete":
            self.accept_upstream_deletion(path)
            return "resolved"
        if resolution == "custom_gitignore":
            self.resolve_gitignore(path)
            return "resolved"
        if resolution == "custom_agents_md":
            self.resolve_agents_md(path)
            return "resolved"
        if resolution == "package_json_fixup":
            self.resolve_package_json_fixup(path)
            return "resolved"
        if resolution == "manual":
            return "manual"
        raise ValueError(f"Unknown resolution: {resolution}")


def run_git(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=check,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def load_rules(path: Path) -> tuple[list[Rule], str]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    default_resolution = payload.get("default_resolution", "manual")
    rules = [
        Rule(
            pattern=item["pattern"],
            resolution=item["resolution"],
            note=item.get("note", ""),
        )
        for item in payload.get("rules", [])
    ]
    return rules, default_resolution


def select_rule(path: str, rules: list[Rule], default_resolution: str) -> Rule:
    for rule in rules:
        if fnmatch.fnmatch(path, rule.pattern):
            return rule
    return Rule(pattern="*", resolution=default_resolution, note="fallback")


def unresolved_files() -> list[str]:
    result = run_git(["diff", "--name-only", "--diff-filter=U"], check=False)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def write_markdown_log(log_path: Path, resolver: Resolver, before: list[str], after: list[str]) -> None:
    timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%SZ")
    lines = [
        "# Merge Conflict Resolution Log",
        "",
        f"- Timestamp (UTC): `{timestamp}`",
        f"- Upstream ref: `{resolver.upstream_ref}`",
        f"- Dry run: `{resolver.dry_run}`",
        f"- Initial conflicts: `{len(before)}`",
        f"- Remaining conflicts: `{len(after)}`",
        "",
        "## Actions",
        "",
    ]
    if resolver.actions:
        for action in resolver.actions:
            note_text = f" - {action['note']}" if action["note"] else ""
            lines.append(
                f"- `{action['path']}`: `{action['resolution']}` -> `{action['result']}`{note_text}",
            )
    else:
        lines.append("- none")
    lines.extend(["", "## Remaining Conflicts", ""])
    if after:
        lines.extend([f"- `{path}`" for path in after])
    else:
        lines.append("- none")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Resolve merge conflicts using a strategy map.",
    )
    parser.add_argument(
        "--upstream-ref",
        default="upstream/main",
        help="Git ref used for upstream/theirs selection (default: upstream/main).",
    )
    parser.add_argument(
        "--strategy-file",
        default=str(DEFAULT_STRATEGY_FILE),
        help="JSON strategy file path.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without mutating files or index.",
    )
    parser.add_argument(
        "--log-file",
        default="",
        help="Markdown output path for action log.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Return non-zero when unresolved files remain.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    strategy_file = Path(args.strategy_file)
    if not strategy_file.is_absolute():
        strategy_file = (REPO_ROOT / strategy_file).resolve()
    if not strategy_file.exists():
        raise FileNotFoundError(f"Strategy file not found: {strategy_file}")

    rules, default_resolution = load_rules(strategy_file)
    before = unresolved_files()
    resolver = Resolver(upstream_ref=args.upstream_ref, dry_run=args.dry_run)
    print(f"Detected conflicts: {len(before)}")

    for path in before:
        rule = select_rule(path, rules, default_resolution)
        result = resolver.apply_resolution(path, rule.resolution)
        resolver.record(path, rule.resolution, result, rule.note)

    after = unresolved_files()
    if args.log_file:
        log_path = Path(args.log_file)
    else:
        stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        log_path = REPO_ROOT / "_docs" / f"merge-conflict-resolution-{stamp}.md"
    if not log_path.is_absolute():
        log_path = (REPO_ROOT / log_path).resolve()
    write_markdown_log(log_path, resolver, before, after)
    print(f"Wrote log: {log_path}")

    if after:
        print("Remaining unresolved files:")
        for path in after:
            print(f" - {path}")
        if args.strict:
            return 1
    else:
        print("All conflicts resolved.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
