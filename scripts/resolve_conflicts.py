#!/usr/bin/env python3
"""
resolve_conflicts.py
====================
Resolves git merge conflicts for Clawdbot upstream sync.

Strategy:
  - Files unique to our fork (custom features) -> keep OURS
  - pnpm-lock.yaml -> accept THEIRS (upstream package lock)
  - Extensions deleted upstream but present locally -> keep OURS
  - All other conflicts -> accept THEIRS (upstream wins for bug fixes/security)
  - command-registry.ts -> MERGE (keep evo registration from OURS + upstream changes)
"""

import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

# Files/patterns where we always keep OUR version
OURS_FILES = {
    "src/cli/program/command-registry.ts",  # has evo command registration
}

# Files/patterns where upstream THEIRS always wins
THEIRS_FILES = {
    "pnpm-lock.yaml",
}

# Patterns - custom files we added that upstream deleted -> keep OURS
OURS_PATTERNS = [
    r"src/agents/",
    r"extensions/vrchat",
    r"src/cli/evo-cli",
]

CONFLICT_START = "<<<<<<< "
CONFLICT_SEP   = "======="
CONFLICT_END   = ">>>>>>> "


def get_conflicted_files(repo_dir: Path) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=U"],
        cwd=repo_dir,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return [f.strip() for f in result.stdout.splitlines() if f.strip()]


def resolve_file_strategy(filepath: str) -> str:
    """Determine resolution strategy: 'ours', 'theirs', or 'merge'"""
    if filepath in OURS_FILES:
        return "ours"
    if filepath in THEIRS_FILES:
        return "theirs"
    for pat in OURS_PATTERNS:
        if re.search(pat, filepath):
            return "ours"
    return "theirs"


def parse_conflict_blocks(content: str) -> list[dict]:
    """Parse conflict markers into structured blocks"""
    blocks = []
    lines = content.splitlines(keepends=True)
    i = 0
    while i < len(lines):
        if lines[i].startswith(CONFLICT_START):
            ours_lines = []
            theirs_lines = []
            in_ours = True
            i += 1
            while i < len(lines):
                if lines[i].startswith(CONFLICT_SEP) and not lines[i].startswith(CONFLICT_SEP + " "):
                    in_ours = False
                    i += 1
                    continue
                if lines[i].startswith(CONFLICT_END):
                    blocks.append({"ours": ours_lines, "theirs": theirs_lines})
                    i += 1
                    break
                if in_ours:
                    ours_lines.append(lines[i])
                else:
                    theirs_lines.append(lines[i])
                i += 1
        else:
            blocks.append({"plain": lines[i]})
            i += 1
    return blocks


def resolve_content(content: str, strategy: str, filepath: str) -> str:
    """Apply resolution strategy to file content"""
    blocks = parse_conflict_blocks(content)
    result = []

    for block in blocks:
        if "plain" in block:
            result.append(block["plain"])
        else:
            ours = block["ours"]
            theirs = block["theirs"]

            if strategy == "ours":
                result.extend(ours)
            elif strategy == "theirs":
                result.extend(theirs)
            else:  # merge strategy
                # For command-registry.ts: accept theirs, then inject our evo block if missing
                result.extend(theirs)
                # Inject evo registration if theirs lacks it
                theirs_joined = "".join(theirs)
                ours_joined = "".join(ours)
                if "registerEvoCommands" in ours_joined and "registerEvoCommands" not in theirs_joined:
                    result.extend(ours)

    resolved = "".join(result)

    # Post-processing for command-registry.ts:
    # Make sure evo imports and registration are present
    if "command-registry.ts" in filepath:
        resolved = _ensure_evo_in_registry(resolved)

    return resolved


def _ensure_evo_in_registry(content: str) -> str:
    """Ensure evo CLI import and registration survive in command-registry.ts"""
    evo_import = 'import { registerEvoCommands } from "../evo-cli.js";'
    evo_register = '''  {
    id: "evo",
    register: ({ program }) => registerEvoCommands(program),
  },'''

    if "registerEvoCommands" not in content:
        # Add import after last import line
        lines = content.splitlines(keepends=True)
        last_import_idx = 0
        for idx, line in enumerate(lines):
            if line.startswith("import "):
                last_import_idx = idx
        lines.insert(last_import_idx + 1, evo_import + "\n")
        content = "".join(lines)

    if '"evo"' not in content and "id: \"evo\"" not in content:
        # Add evo registration before the first { id: entry
        content = content.replace(
            '  {\n    id: "setup"',
            evo_register + '\n  {\n    id: "setup"',
        )

    return content


def resolve_modify_delete(repo_dir: Path, filepath: str) -> None:
    """Handle modify/delete conflicts (file deleted in upstream, modified locally)"""
    # Keep our version (the file exists locally = custom feature)
    subprocess.run(["git", "checkout", "--ours", filepath], cwd=repo_dir, check=True)
    subprocess.run(["git", "add", filepath], cwd=repo_dir, check=True)
    print(f"  [modify/delete -> OURS kept] {filepath}")


def resolve_file(repo_dir: Path, filepath: str) -> bool:
    full_path = repo_dir / filepath

    # Check if it's a modify/delete conflict (file might not exist)
    if not full_path.exists():
        resolve_modify_delete(repo_dir, filepath)
        return True

    content = full_path.read_text(encoding="utf-8", errors="replace")

    if CONFLICT_START not in content:
        # Might be a delete/add conflict; mark as resolved with ours
        subprocess.run(["git", "add", filepath], cwd=repo_dir, check=True)
        print(f"  [no markers -> add] {filepath}")
        return True

    strategy = resolve_file_strategy(filepath)
    print(f"  [{strategy}] {filepath}")

    resolved = resolve_content(content, strategy, filepath)
    full_path.write_text(resolved, encoding="utf-8")
    subprocess.run(["git", "add", filepath], cwd=repo_dir, check=True)
    return True


def main() -> int:
    repo_dir = Path(__file__).parent.parent.resolve()
    print(f"Repo: {repo_dir}")

    conflicts = get_conflicted_files(repo_dir)
    if not conflicts:
        print("No conflicted files found.")
        return 0

    print(f"\nFound {len(conflicts)} conflicted file(s):\n")
    errors = 0
    for filepath in conflicts:
        try:
            resolve_file(repo_dir, filepath)
        except Exception as exc:
            print(f"  [ERROR] {filepath}: {exc}")
            errors += 1

    print(f"\nResolution complete. Errors: {errors}")
    return errors


if __name__ == "__main__":
    sys.exit(main())
