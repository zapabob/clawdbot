#!/usr/bin/env python3
import json
import re
import subprocess
from pathlib import Path


EXPORT_RE = re.compile(r'^\s*"([^"]+)":\s*')


def run(args: list[str]) -> str:
    completed = subprocess.run(
        args,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    return completed.stdout


def read_file_from_ref(ref: str, path: str) -> str:
    return run(["git", "show", f"{ref}:{path}"])


def parse_export_keys(package_json_text: str) -> set[str]:
    data = json.loads(package_json_text)
    exports = data.get("exports", {})
    if isinstance(exports, dict):
        return set(exports.keys())
    return set()


def git_grep_count(pattern: str) -> int:
    completed = subprocess.run(
        ["git", "grep", "-n", pattern, "--", "src", "extensions", "ui"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    if completed.returncode not in (0, 1):
        raise RuntimeError(completed.stderr.strip())
    return 0 if completed.returncode == 1 else len([line for line in completed.stdout.splitlines() if line])


def main() -> int:
    current = Path("package.json").read_text(encoding="utf-8")
    upstream = read_file_from_ref("upstream/main", "package.json")

    current_keys = parse_export_keys(current)
    upstream_keys = parse_export_keys(upstream)

    added = sorted(current_keys - upstream_keys)
    removed = sorted(upstream_keys - current_keys)
    shared = sorted(current_keys & upstream_keys)

    usage = {}
    for key in added + removed:
        usage[key] = git_grep_count(f"openclaw{re.escape(key)}")

    report = {
        "added_exports_vs_upstream": added,
        "removed_exports_vs_upstream": removed,
        "shared_exports_count": len(shared),
        "usage_counts_in_repo": usage,
    }

    out_json = Path("_docs/upstream-api-delta-audit.json")
    out_md = Path("_docs/upstream-api-delta-audit.md")
    out_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Upstream API Delta Audit",
        "",
        "- Compared refs: `upstream/main` vs current merge worktree",
        f"- Added exports: `{len(added)}`",
        f"- Removed exports: `{len(removed)}`",
        f"- Shared exports: `{len(shared)}`",
        "",
        "## Added exports",
        "",
    ]
    if added:
        lines.extend([f"- `{k}` (repo usage hits: {usage[k]})" for k in added])
    else:
        lines.append("- none")

    lines.extend(["", "## Removed exports", ""])
    if removed:
        lines.extend([f"- `{k}` (repo usage hits: {usage[k]})" for k in removed])
    else:
        lines.append("- none")

    out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out_json}")
    print(f"Wrote {out_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
