#!/usr/bin/env python3
"""Audit upstream package and named-export drift for selected SDK/core modules."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

DEFAULT_MODULES = ("src/plugin-sdk/core.ts",)
EXPORT_BLOCK_RE = re.compile(r"export\s+(?:type\s+)?\{([^}]+)\}", re.MULTILINE | re.DOTALL)
EXPORT_DECL_RE = re.compile(
    r"^\s*export\s+(?:async\s+)?(?:const|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)",
    re.MULTILINE,
)


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


def read_file_from_worktree(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def read_source(ref: str, path: str) -> str:
    if ref.upper() in {"WORKTREE", "CURRENT"}:
        return read_file_from_worktree(path)
    return read_file_from_ref(ref, path)


def parse_export_keys(package_json_text: str) -> set[str]:
    data = json.loads(package_json_text)
    exports = data.get("exports", {})
    if isinstance(exports, dict):
        return set(exports.keys())
    return set()


def extract_named_exports(module_source: str) -> set[str]:
    exports: set[str] = set()

    for match in EXPORT_BLOCK_RE.finditer(module_source):
        for raw_part in match.group(1).split(","):
            part = raw_part.strip()
            if not part:
                continue
            if " as " in part:
                exports.add(part.split(" as ", 1)[1].strip())
            else:
                exports.add(part)

    for match in EXPORT_DECL_RE.finditer(module_source):
        exports.add(match.group(1))

    return exports


def git_grep_count(pattern: str) -> int:
    completed = subprocess.run(
        ["git", "grep", "-n", pattern, "--", "src", "extensions", "ui", "test"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    if completed.returncode not in (0, 1):
        raise RuntimeError(completed.stderr.strip())
    return 0 if completed.returncode == 1 else len([line for line in completed.stdout.splitlines() if line])


def build_module_delta(ref_left: str, ref_right: str, module_path: str) -> dict[str, object]:
    current_exports = extract_named_exports(read_source(ref_left, module_path))
    upstream_exports = extract_named_exports(read_source(ref_right, module_path))
    added = sorted(current_exports - upstream_exports)
    removed = sorted(upstream_exports - current_exports)
    usage = {name: git_grep_count(name) for name in added + removed}
    return {
        "added_exports_vs_upstream": added,
        "removed_exports_vs_upstream": removed,
        "shared_exports_count": len(current_exports & upstream_exports),
        "usage_counts_in_repo": usage,
    }


def build_audit_report(current_ref: str, upstream_ref: str, modules: tuple[str, ...]) -> dict[str, object]:
    current_package = read_source(current_ref, "package.json")
    upstream_package = read_source(upstream_ref, "package.json")

    current_keys = parse_export_keys(current_package)
    upstream_keys = parse_export_keys(upstream_package)

    added_package_exports = sorted(current_keys - upstream_keys)
    removed_package_exports = sorted(upstream_keys - current_keys)
    package_usage = {
        key: git_grep_count(key.replace(".", r"\."))
        for key in added_package_exports + removed_package_exports
    }

    module_report = {
        module_path: build_module_delta(current_ref, upstream_ref, module_path)
        for module_path in modules
    }

    return {
        "refs": {
            "current": current_ref,
            "upstream": upstream_ref,
        },
        "package_exports": {
            "added_exports_vs_upstream": added_package_exports,
            "removed_exports_vs_upstream": removed_package_exports,
            "shared_exports_count": len(current_keys & upstream_keys),
            "usage_counts_in_repo": package_usage,
        },
        "module_named_exports": module_report,
    }


def write_report(report: dict[str, object], json_path: Path, md_path: Path) -> None:
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Upstream API Delta Audit",
        "",
        f"- Compared refs: `{report['refs']['current']}` vs `{report['refs']['upstream']}`",
        "",
        "## Package Exports",
        "",
        f"- Added exports: `{len(report['package_exports']['added_exports_vs_upstream'])}`",
        f"- Removed exports: `{len(report['package_exports']['removed_exports_vs_upstream'])}`",
        "",
    ]
    package_section = report["package_exports"]
    if package_section["added_exports_vs_upstream"]:
        lines.extend(
            [
                f"- Added `{key}` (repo usage hits: {package_section['usage_counts_in_repo'][key]})"
                for key in package_section["added_exports_vs_upstream"]
            ],
        )
    if package_section["removed_exports_vs_upstream"]:
        lines.extend(
            [
                f"- Removed `{key}` (repo usage hits: {package_section['usage_counts_in_repo'][key]})"
                for key in package_section["removed_exports_vs_upstream"]
            ],
        )

    for module_path, module_delta in report["module_named_exports"].items():
        lines.extend(
            [
                "",
                f"## {module_path}",
                "",
                f"- Added named exports: `{len(module_delta['added_exports_vs_upstream'])}`",
                f"- Removed named exports: `{len(module_delta['removed_exports_vs_upstream'])}`",
            ],
        )
        if module_delta["added_exports_vs_upstream"]:
            lines.extend(
                [
                    f"- Added `{name}` (repo usage hits: {module_delta['usage_counts_in_repo'][name]})"
                    for name in module_delta["added_exports_vs_upstream"]
                ],
            )
        if module_delta["removed_exports_vs_upstream"]:
            lines.extend(
                [
                    f"- Removed `{name}` (repo usage hits: {module_delta['usage_counts_in_repo'][name]})"
                    for name in module_delta["removed_exports_vs_upstream"]
                ],
            )

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit package and module export drift versus upstream.")
    parser.add_argument(
        "--current-ref",
        default="WORKTREE",
        help="Current ref to inspect (default: WORKTREE for local files).",
    )
    parser.add_argument("--upstream-ref", default="upstream/main", help="Upstream ref to compare against.")
    parser.add_argument(
        "--module",
        action="append",
        default=[],
        help="Module path to compare for named exports. Can be passed multiple times.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    modules = tuple(args.module or DEFAULT_MODULES)
    report = build_audit_report(
        current_ref=args.current_ref,
        upstream_ref=args.upstream_ref,
        modules=modules,
    )

    out_json = Path("_docs/upstream-api-delta-audit.json")
    out_md = Path("_docs/upstream-api-delta-audit.md")
    write_report(report, out_json, out_md)
    print(f"Wrote {out_json}")
    print(f"Wrote {out_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
