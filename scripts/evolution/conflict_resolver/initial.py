#!/usr/bin/env python3
"""
initial.py - Starting solution for conflict resolution evolution.
"""

import re
import subprocess
import sys
from pathlib import Path
from typing import Optional, List, Dict

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
CONFLICT_SEP = "======="
CONFLICT_END = ">>>>>>> "


# EVOLVE-BLOCK-START
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
                if lines[i].startswith(CONFLICT_SEP) and not lines[i].startswith(
                    CONFLICT_SEP + " "
                ):
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
                if (
                    "registerEvoCommands" in ours_joined
                    and "registerEvoCommands" not in theirs_joined
                ):
                    result.extend(ours)

    resolved = "".join(result)

    # Post-processing for command-registry.ts:
    if "command-registry.ts" in filepath:
        resolved = _ensure_evo_in_registry(resolved)

    return resolved


def _ensure_evo_in_registry(content: str) -> str:
    """Ensure evo CLI import and registration survive in command-registry.ts"""
    evo_import = 'import { registerEvoCommands } from "../evo-cli.js";'
    evo_register = """  {
    id: "evo",
    register: ({ program }) => registerEvoCommands(program),
  },"""

    if "registerEvoCommands" not in content:
        lines = content.splitlines(keepends=True)
        last_import_idx = 0
        for idx, line in enumerate(lines):
            if line.startswith("import "):
                last_import_idx = idx
        lines.insert(last_import_idx + 1, evo_import + "\n")
        content = "".join(lines)

    if '"evo"' not in content and 'id: "evo"' not in content:
        content = content.replace(
            '  {\n    id: "setup"',
            evo_register + '\n  {\n    id: "setup"',
        )

    return content


# EVOLVE-BLOCK-END


def run_experiment(**kwargs):
    """
    Main entry point for ShinkaEvolve evaluation.
    Expects 'content', 'strategy', 'filepath' in kwargs.
    Returns resolved content.
    """
    content = kwargs.get("content", "")
    strategy = kwargs.get("strategy", "theirs")
    filepath = kwargs.get("filepath", "dummy.txt")

    return resolve_content(content, strategy, filepath)


if __name__ == "__main__":
    # Test run
    dummy_content = "<<<<<<< OURS\nours code\n=======\ntheirs code\n>>>>>>> THEIRS\n"
    print(run_experiment(content=dummy_content, strategy="ours", filepath="dummy.txt"))
