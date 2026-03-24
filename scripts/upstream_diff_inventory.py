#!/usr/bin/env python3
import json
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class BucketRule:
    name: str
    prefixes: tuple[str, ...]


BUCKETS: tuple[BucketRule, ...] = (
    BucketRule("channels_extensions", ("extensions/",)),
    BucketRule("core_src", ("src/",)),
    BucketRule("ui_apps", ("ui/", "apps/")),
    BucketRule("docs", ("docs/", "_docs/")),
    BucketRule("scripts_ops", ("scripts/",)),
    BucketRule("infra_vendor_dist", ("infra/", "vendor/", "dist-runtime/")),
    BucketRule("meta_repo", (".github/", ".cursor/", ".openclaw-desktop/", ".agents/")),
    BucketRule("root_files", ("",)),
)


def run_git(args: list[str]) -> str:
    completed = subprocess.run(
        ["git", *args],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    return completed.stdout


def bucket_for(path: str) -> str:
    for bucket in BUCKETS:
        if bucket.name == "root_files":
            continue
        if path.startswith(bucket.prefixes):
            return bucket.name
    if "/" not in path:
        return "root_files"
    return "other"


def main() -> int:
    paths_raw = run_git(["diff", "--name-only", "upstream/main...main"])
    paths = [line.strip() for line in paths_raw.splitlines() if line.strip()]

    grouped: dict[str, list[str]] = defaultdict(list)
    for p in paths:
        grouped[bucket_for(p)].append(p)

    for group in grouped.values():
        group.sort()

    payload = {
        "total_changed_files": len(paths),
        "groups": {k: v for k, v in sorted(grouped.items(), key=lambda x: x[0])},
    }

    out_json = Path("_docs/upstream-main-diff-inventory.json")
    out_md = Path("_docs/upstream-main-diff-inventory.md")

    out_json.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines: list[str] = []
    lines.append("# Upstream Diff Inventory")
    lines.append("")
    lines.append(f"- Base: `upstream/main...main`")
    lines.append(f"- Total changed files: `{len(paths)}`")
    lines.append("")
    for group_name in sorted(grouped.keys()):
        files = grouped[group_name]
        lines.append(f"## {group_name} ({len(files)})")
        lines.append("")
        for f in files:
            lines.append(f"- `{f}`")
        lines.append("")

    out_md.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_json}")
    print(f"Wrote {out_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
