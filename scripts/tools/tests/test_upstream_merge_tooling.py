import importlib.util
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def load_module(name: str, relative_path: str):
    spec = importlib.util.spec_from_file_location(name, REPO_ROOT / relative_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load module: {relative_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


policy = load_module("upstream_merge_policy", "scripts/tools/upstream_merge_policy.py")
resolver_module = load_module("resolve_merge_conflicts", "scripts/tools/resolve-merge-conflicts.py")
audit_module = load_module("api_delta_audit", "scripts/tools/api_delta_audit.py")
merge_module = load_module("upstream_merge", "scripts/tools/upstream_merge.py")


class UpstreamMergePolicyTests(unittest.TestCase):
    def test_strategy_classifies_requested_actions(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        cases = {
            "package.json": "upstream",
            "extensions/auto-agent/index.ts": "preserve_custom",
            "extensions/line/src/push-command.ts": "official_with_overlay",
            "extensions/matrix/src/legacy-crypto.ts": "official_with_overlay",
            "extensions/whatsapp/src/auto-reply/monitor.ts": "official_with_overlay",
            "src/infra/outbound/delivery-queue-recovery.ts": "official_with_overlay",
            "src/plugin-sdk/core.ts": "manual_api_followup",
            "src/plugin-sdk/infra-runtime.ts": "manual_api_followup",
            "extensions/hypura-harness/scripts/generated/run_20260409.py": "drop_generated",
        }

        for path, expected in cases.items():
            with self.subTest(path=path):
                classification = policy.classify_path(path, strategy)
                self.assertEqual(classification.action, expected)

    def test_noise_filter_keeps_custom_source_and_drops_runtime_state(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        self.assertEqual(
            strategy.pinned_upstream_sha,
            "1801702ed9592ceeb1d73d1775a210d8e427cbf4",
        )
        kept, ignored = policy.filter_noise_paths(
            [
                ".cursor/hooks/state/continual-learning.json",
                ".openclaw-desktop/flows/registry.sqlite",
                ".openclaw-desktop/subagents/runs.json",
                "scripts/tools/upstream_merge.py",
                "extensions/hypura-harness/scripts/harness_daemon.py",
            ],
            strategy.dirty_tree_ignore,
        )

        self.assertEqual(
            kept,
            [
                "scripts/tools/upstream_merge.py",
                "extensions/hypura-harness/scripts/harness_daemon.py",
            ],
        )
        self.assertEqual(
            ignored,
            [
                ".cursor/hooks/state/continual-learning.json",
                ".openclaw-desktop/flows/registry.sqlite",
                ".openclaw-desktop/subagents/runs.json",
            ],
        )

    def test_contextual_fallback_classifies_upstream_only_and_custom_only_paths(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        classifications = {
            item.path: item
            for item in policy.classify_paths(
                [
                    "docs/providers/openai.md",
                    "_docs/2026-04-09_custom-note.md",
                    "src/plugin-sdk/core.ts",
                ],
                strategy,
                upstream_paths=[
                    "docs/providers/openai.md",
                    "src/plugin-sdk/core.ts",
                ],
                custom_paths=[
                    "_docs/2026-04-09_custom-note.md",
                    "src/plugin-sdk/core.ts",
                ],
            )
        }

        self.assertEqual(classifications["docs/providers/openai.md"].action, "upstream")
        self.assertEqual(classifications["docs/providers/openai.md"].pattern, "@upstream-only")
        self.assertEqual(
            classifications["_docs/2026-04-09_custom-note.md"].action,
            "preserve_custom",
        )
        self.assertEqual(
            classifications["_docs/2026-04-09_custom-note.md"].pattern,
            "@custom-only",
        )
        self.assertEqual(classifications["src/plugin-sdk/core.ts"].action, "manual_api_followup")


class ResolverBehaviorTests(unittest.TestCase):
    def test_resolver_results_cover_all_actions(self):
        resolver = resolver_module.Resolver(upstream_ref="upstream/main", dry_run=True)

        self.assertEqual(resolver.apply_action("package.json", "upstream"), "resolved")
        self.assertEqual(
            resolver.apply_action("extensions/auto-agent/index.ts", "preserve_custom"),
            "resolved",
        )
        self.assertEqual(
            resolver.apply_action("extensions/line/src/push-command.ts", "official_with_overlay"),
            "blocked",
        )
        self.assertEqual(
            resolver.apply_action("src/plugin-sdk/core.ts", "manual_api_followup"),
            "blocked",
        )
        self.assertEqual(
            resolver.apply_action(
                "extensions/hypura-harness/scripts/generated/run_20260409.py",
                "drop_generated",
            ),
            "resolved",
        )

    def test_resolver_can_reuse_preclassified_inventory_entries(self):
        preclassified = resolver_module.load_preclassified_paths(
            REPO_ROOT / "scripts" / "tools" / "tests" / "fixtures" / "preclassified-paths.json",
        )

        self.assertIsNotNone(preclassified)
        self.assertEqual([item.action for item in preclassified], ["upstream", "preserve_custom"])


class ApiDeltaAuditTests(unittest.TestCase):
    def test_extract_named_exports_from_module_source(self):
        source = """
export { alpha, beta as gamma } from "./shared.js";
export type { Delta, Epsilon as Zeta } from "./types.js";
export const theta = 1;
export async function iota() {}
export class Kappa {}
export default {};
"""
        self.assertEqual(
            audit_module.extract_named_exports(source),
            {"alpha", "gamma", "Delta", "Zeta", "theta", "iota", "Kappa"},
        )


class UpstreamMergeTests(unittest.TestCase):
    def test_blocker_detection_uses_strategy_metadata(self):
        blockers = merge_module.collect_followup_blockers(
            [
                {"path": "extensions/line/src/push-command.ts", "action": "official_with_overlay"},
                {"path": "src/plugin-sdk/core.ts", "action": "manual_api_followup"},
                {"path": "package.json", "action": "upstream"},
            ],
            {"official_with_overlay", "manual_api_followup"},
        )

        self.assertEqual(
            blockers,
            [
                "extensions/line/src/push-command.ts",
                "src/plugin-sdk/core.ts",
            ],
        )


if __name__ == "__main__":
    unittest.main()
