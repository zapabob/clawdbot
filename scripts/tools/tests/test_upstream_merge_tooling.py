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
        cases = (
            (".pre-commit-config.yaml", "preserve_custom", True, True),
            ("package.json", "upstream", True, False),
            ("extensions/acpx/openclaw.plugin.json", "preserve_custom", True, True),
            ("extensions/auto-agent/index.ts", "preserve_custom", False, True),
            ("apps/android/app/build.gradle.kts", "preserve_custom", True, True),
            ("apps/ios/Config/Version.xcconfig", "preserve_custom", True, True),
            ("apps/macos/Sources/OpenClaw/Resources/Info.plist", "preserve_custom", True, True),
            ("extensions/discord/src/doctor-contract.ts", "preserve_custom", True, True),
            ("extensions/discord/src/monitor/exec-approvals.test.ts", "preserve_custom", True, True),
            ("extensions/discord/src/proxy-request-client.ts", "preserve_custom", True, True),
            ("extensions/line/src/card-command.ts", "preserve_custom", True, True),
            ("extensions/line/src/push-command.ts", "official_with_overlay", True, True),
            ("extensions/matrix/runtime-heavy-api.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/approval-native.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/approval-native.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/exec-approval-resolver.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/exec-approvals-handler.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/legacy-crypto-inspector-availability.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/exec-approval-resolver.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/legacy-crypto.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/legacy-crypto.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix-migration.runtime.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix/client.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix/client/config.ts", "preserve_custom", True, True),
            (
                "extensions/matrix/src/matrix/client/migration-snapshot.runtime.ts",
                "preserve_custom",
                True,
                True,
            ),
            ("extensions/matrix/src/matrix/monitor/allowlist.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix/monitor/handler.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix/monitor/reaction-events.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/matrix/monitor/reaction-events.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/migration-snapshot-backup.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/migration-snapshot.test.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/migration-snapshot.ts", "preserve_custom", True, True),
            ("extensions/matrix/src/runtime-heavy-api.ts", "preserve_custom", True, True),
            ("extensions/memory-core/index.ts", "preserve_custom", True, True),
            ("extensions/ollama/src/stream.ts", "preserve_custom", True, True),
            ("extensions/qa-lab/web/src/styles.css", "preserve_custom", True, True),
            ("extensions/slack/src/doctor-contract.ts", "preserve_custom", True, True),
            ("extensions/telegram/src/bot.ts", "preserve_custom", True, True),
            ("extensions/whatsapp/src/auto-reply/monitor.ts", "preserve_custom", True, True),
            ("scripts/lib/plugin-sdk-entrypoints.json", "preserve_custom", True, True),
            ("src/cli/config-cli.ts", "preserve_custom", True, True),
            ("src/config/bundled-channel-config-runtime.ts", "preserve_custom", True, True),
            ("src/config/config.schema-regressions.test.ts", "preserve_custom", True, True),
            ("src/config/config.secrets-schema.test.ts", "preserve_custom", True, True),
            ("src/config/legacy.ts", "preserve_custom", True, True),
            ("src/config/types.secrets.ts", "preserve_custom", True, True),
            ("src/config/zod-schema.core.ts", "preserve_custom", True, True),
            ("src/commands/status-all/report-data.ts", "preserve_custom", True, True),
            ("src/commands/status-json-payload.test.ts", "preserve_custom", True, True),
            ("src/commands/status.command-report-data.ts", "preserve_custom", True, True),
            ("src/commands/status.command-report-data.test.ts", "preserve_custom", True, True),
            ("src/commands/status.command.ts", "preserve_custom", True, True),
            ("src/commands/status.gateway-connection.test.ts", "preserve_custom", True, True),
            ("src/commands/status.scan-execute.test.ts", "preserve_custom", True, True),
            ("src/channels/plugins/bootstrap-registry.ts", "preserve_custom", True, True),
            ("src/channels/plugins/bundled.ts", "preserve_custom", True, True),
            ("src/channels/plugins/bundled.shape-guard.test.ts", "preserve_custom", True, True),
            (
                "src/channels/plugins/contracts/plugin.registry-backed.contract.test.ts",
                "preserve_custom",
                True,
                True,
            ),
            ("src/gateway/http-auth-helpers.test.ts", "preserve_custom", True, True),
            ("src/gateway/server-methods.ts", "preserve_custom", True, True),
            ("src/gateway/server-methods/chat.ts", "preserve_custom", True, True),
            ("src/gateway/server.impl.ts", "preserve_custom", True, True),
            (
                "src/gateway/server.openai-compatible-http-write-scope-bypass.poc.test.ts",
                "preserve_custom",
                True,
                True,
            ),
            ("src/gateway/sessions-history-http.test.ts", "preserve_custom", True, True),
            ("src/agents/model-fallback.ts", "preserve_custom", True, True),
            ("src/agents/openclaw-tools.ts", "preserve_custom", True, True),
            ("src/agents/pi-embedded-runner/compact.ts", "preserve_custom", True, True),
            ("src/agents/pi-embedded-runner/compact.hooks.test.ts", "preserve_custom", True, True),
            ("src/agents/pi-embedded-runner/run/attempt.ts", "preserve_custom", True, True),
            ("src/agents/pi-project-settings.ts", "preserve_custom", True, True),
            ("src/agents/pi-settings.ts", "preserve_custom", True, True),
            ("src/agents/system-prompt.test.ts", "preserve_custom", True, True),
            ("src/agents/system-prompt.ts", "preserve_custom", True, True),
            ("src/agents/tools/chat-history-text.ts", "preserve_custom", True, True),
            ("src/infra/outbound/delivery-queue.ts", "preserve_custom", True, True),
            ("src/infra/outbound/delivery-queue-recovery.ts", "preserve_custom", True, True),
            ("src/infra/outbound/delivery-queue-storage.ts", "preserve_custom", True, True),
            ("src/infra/outbound/delivery-queue.reconnect-drain.test.ts", "preserve_custom", True, True),
            ("src/infra/run-node.test.ts", "preserve_custom", True, True),
            ("src/infra/state-migrations.ts", "preserve_custom", True, True),
            ("src/cli/route.ts", "preserve_custom", True, True),
            ("src/cli/run-main.ts", "preserve_custom", True, True),
            ("src/media/pdf-extract.ts", "preserve_custom", True, True),
            ("src/plugins/provider-replay-helpers.test.ts", "preserve_custom", True, True),
            ("src/plugin-sdk/core.ts", "manual_api_followup", True, True),
            ("src/plugin-sdk/infra-runtime.ts", "preserve_custom", True, True),
            ("src/plugin-sdk/irc-surface.ts", "preserve_custom", True, True),
            ("src/plugins/bundled-plugin-metadata.ts", "preserve_custom", True, True),
            ("src/secrets/configure.ts", "preserve_custom", True, True),
            ("src/secrets/resolve.ts", "preserve_custom", True, True),
            ("src/secrets/target-registry-data.ts", "preserve_custom", True, True),
            ("src/secrets/target-registry-query.ts", "preserve_custom", True, True),
            ("src/security/fix.ts", "preserve_custom", True, True),
            ("src/security/audit-install-metadata.test.ts", "preserve_custom", True, True),
            ("src/security/audit-node-command-findings.test.ts", "preserve_custom", True, True),
            ("src/tui/gateway-chat.ts", "preserve_custom", True, True),
            ("src/tui/tui-session-actions.ts", "preserve_custom", True, True),
            ("test/helpers/channels/surface-contract-registry.ts", "preserve_custom", True, True),
            ("test/setup.shared.ts", "preserve_custom", True, True),
            ("ui/package.json", "preserve_custom", True, True),
            ("extensions/hypura-harness/scripts/generated/run_20260409.py", "drop_generated", True, False),
        )

        for path, expected, touched_upstream, touched_custom in cases:
            with self.subTest(path=path):
                classification = policy.classify_path_with_context(
                    path,
                    strategy,
                    touched_upstream=touched_upstream,
                    touched_custom=touched_custom,
                )
                self.assertEqual(classification.action, expected)

    def test_noise_filter_keeps_custom_source_and_drops_runtime_state(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        self.assertEqual(
            strategy.pinned_upstream_sha,
            "6f1d321aababd96e7b67e4b8dc7fdd5d9c1a554b",
        )
        kept, ignored = policy.filter_noise_paths(
            [
                ".cursor/hooks/state/continual-learning.json",
                ".openclaw-desktop/python/Lib/test/test_ctypes/test_objects.py",
                ".openclaw-desktop/python/DLLs/_asyncio.pyd",
                ".openclaw-desktop/flows/registry.sqlite",
                ".openclaw-desktop/subagents/runs.json",
                ".openclaw-desktop/skills/hypura-harness/scripts/whisper_stt_loop.py",
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
                ".openclaw-desktop/python/Lib/test/test_ctypes/test_objects.py",
                ".openclaw-desktop/python/DLLs/_asyncio.pyd",
                ".openclaw-desktop/flows/registry.sqlite",
                ".openclaw-desktop/subagents/runs.json",
                ".openclaw-desktop/skills/hypura-harness/scripts/whisper_stt_loop.py",
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

    def test_overlap_only_rules_do_not_block_upstream_only_sdk_paths(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        classification = policy.classify_paths(
            ["src/plugin-sdk/qa-lab.ts"],
            strategy,
            upstream_paths=["src/plugin-sdk/qa-lab.ts"],
            custom_paths=[],
        )[0]

        self.assertEqual(classification.action, "upstream")
        self.assertEqual(classification.pattern, "@upstream-only")


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
