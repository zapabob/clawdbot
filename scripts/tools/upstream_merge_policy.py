#!/usr/bin/env python3
"""Shared policy helpers for upstream merge planning and conflict resolution."""

from __future__ import annotations

import fnmatch
import json
from dataclasses import dataclass
from pathlib import Path

VALID_ACTIONS = frozenset(
    {
        "upstream",
        "preserve_custom",
        "official_with_overlay",
        "manual_api_followup",
        "drop_generated",
    },
)
DEFAULT_PINNED_UPSTREAM_SHA = "1801702ed9592ceeb1d73d1775a210d8e427cbf4"
DEFAULT_BLOCKER_ACTIONS = frozenset({"official_with_overlay", "manual_api_followup"})
DEFAULT_DIRTY_TREE_IGNORE = (
    ".cursor/hooks/state/*",
    ".openclaw-desktop/flows/*",
    ".openclaw-desktop/subagents/*",
    ".openclaw-desktop/telegram/*",
    ".openclaw-desktop/agents/*/agent/*.json",
    "logs/*",
    "*.log",
)


@dataclass(frozen=True)
class StrategyRule:
    pattern: str
    action: str
    note: str = ""


@dataclass(frozen=True)
class Strategy:
    default_action: str
    rules: tuple[StrategyRule, ...]
    blocker_actions: frozenset[str]
    dirty_tree_ignore: tuple[str, ...]
    pinned_upstream_sha: str


@dataclass(frozen=True)
class Classification:
    path: str
    action: str
    note: str
    pattern: str
    touched_upstream: bool = False
    touched_custom: bool = False


def normalize_repo_path(path: str) -> str:
    normalized = path.replace("\\", "/")
    if normalized.startswith("./"):
        return normalized[2:]
    return normalized


def dedupe_paths(paths: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for raw_path in paths:
        normalized = normalize_repo_path(raw_path.strip())
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered


def filter_noise_paths(paths: list[str], ignore_patterns: tuple[str, ...]) -> tuple[list[str], list[str]]:
    kept: list[str] = []
    ignored: list[str] = []
    for path in dedupe_paths(paths):
        if any(fnmatch.fnmatch(path, pattern) for pattern in ignore_patterns):
            ignored.append(path)
        else:
            kept.append(path)
    return kept, ignored


def load_strategy(path: Path) -> Strategy:
    payload = json.loads(path.read_text(encoding="utf-8"))
    default_action = payload.get("default_action", "manual_api_followup")
    if default_action not in VALID_ACTIONS:
        raise ValueError(f"Unknown default action: {default_action}")

    blocker_actions = frozenset(payload.get("blocker_actions", list(DEFAULT_BLOCKER_ACTIONS)))
    unknown_blockers = blocker_actions - VALID_ACTIONS
    if unknown_blockers:
        raise ValueError(f"Unknown blocker actions: {sorted(unknown_blockers)}")

    dirty_tree_ignore = tuple(payload.get("dirty_tree_ignore", list(DEFAULT_DIRTY_TREE_IGNORE)))
    pinned_upstream_sha = payload.get("pinned_upstream_sha", DEFAULT_PINNED_UPSTREAM_SHA)

    rules: list[StrategyRule] = []
    for item in payload.get("rules", []):
        action = item["action"]
        if action not in VALID_ACTIONS:
            raise ValueError(f"Unknown action: {action}")
        rules.append(
            StrategyRule(
                pattern=normalize_repo_path(item["pattern"]),
                action=action,
                note=item.get("note", ""),
            ),
        )

    return Strategy(
        default_action=default_action,
        rules=tuple(rules),
        blocker_actions=blocker_actions,
        dirty_tree_ignore=dirty_tree_ignore,
        pinned_upstream_sha=pinned_upstream_sha,
    )


def match_rule(path: str, strategy: Strategy) -> StrategyRule | None:
    normalized = normalize_repo_path(path)
    for rule in strategy.rules:
        if fnmatch.fnmatch(normalized, rule.pattern):
            return rule
    return None


def select_rule(path: str, strategy: Strategy) -> StrategyRule:
    return match_rule(path, strategy) or StrategyRule(
        pattern="*",
        action=strategy.default_action,
        note="fallback",
    )


def classify_path(path: str, strategy: Strategy) -> Classification:
    return classify_path_with_context(path, strategy)


def classify_path_with_context(
    path: str,
    strategy: Strategy,
    *,
    touched_upstream: bool = False,
    touched_custom: bool = False,
) -> Classification:
    normalized = normalize_repo_path(path)
    rule = match_rule(normalized, strategy)
    if rule is not None:
        action = rule.action
        note = rule.note
        pattern = rule.pattern
    elif touched_upstream and not touched_custom:
        action = "upstream"
        note = "defaulted from upstream-only touched path"
        pattern = "@upstream-only"
    elif touched_custom and not touched_upstream:
        action = "preserve_custom"
        note = "defaulted from custom-only touched path"
        pattern = "@custom-only"
    elif touched_upstream and touched_custom:
        action = strategy.default_action
        note = "touched in both upstream and custom baseline"
        pattern = "@overlap-fallback"
    else:
        action = strategy.default_action
        note = "fallback"
        pattern = "*"
    return Classification(
        path=normalized,
        action=action,
        note=note,
        pattern=pattern,
        touched_upstream=touched_upstream,
        touched_custom=touched_custom,
    )


def classify_paths(
    paths: list[str],
    strategy: Strategy,
    *,
    upstream_paths: list[str] | None = None,
    custom_paths: list[str] | None = None,
) -> list[Classification]:
    upstream_set = set(dedupe_paths(upstream_paths or []))
    custom_set = set(dedupe_paths(custom_paths or []))
    classifications: list[Classification] = []
    for normalized_path in dedupe_paths(paths):
        classifications.append(
            classify_path_with_context(
                normalized_path,
                strategy,
                touched_upstream=normalized_path in upstream_set,
                touched_custom=normalized_path in custom_set,
            ),
        )
    return classifications
