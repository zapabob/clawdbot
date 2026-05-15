import importlib.util
import subprocess
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
official_merge_module = load_module(
    "merge_official_openclaw",
    "scripts/tools/merge_official_openclaw.py",
)


class UpstreamMergePolicyTests(unittest.TestCase):
    def test_strategy_classifies_requested_actions(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        cases = (
            (".pre-commit-config.yaml", "preserve_custom", True, True),
            (".prettierignore", "preserve_custom", True, True),
            ("package.json", "upstream", True, False),
            ("extensions/acpx/openclaw.plugin.json", "preserve_custom", True, True),
            ("extensions/auto-agent/index.ts", "preserve_custom", False, True),
            ("apps/android/app/build.gradle.kts", "preserve_custom", True, True),
            ("apps/ios/Config/Version.xcconfig", "preserve_custom", True, True),
            ("apps/macos/Sources/OpenClaw/Resources/Info.plist", "preserve_custom", True, True),
            ("apps/macos/Packaging/clawdbot.ico", "preserve_custom", False, False),
            (
                "apps/macos/Packaging/NFD/Hakua/FBX/Animations/Expression/Icons/Facial/Jito2.png",
                "preserve_custom",
                False,
                False,
            ),
            ("docs/channels/bluebubbles.md", "preserve_custom", True, False),
            ("extensions/bluebubbles/src/channel-shared.ts", "preserve_custom", True, True),
            ("docker-setup.sh", "preserve_custom", True, True),
            ("setup-podman.sh", "preserve_custom", True, True),
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
            ("src/commands/doctor/shared/runtime-compat-api.ts", "upstream", True, True),
            ("src/config/schema.base.generated.ts", "upstream", True, True),
            ("src/plugins/bundled-runtime-deps-install.ts", "upstream", True, True),
            ("src/plugins/bundled-runtime-mirror.ts", "upstream", True, True),
            ("src/plugins/test-helpers/bundled-runtime-deps-fixtures.ts", "upstream", True, True),
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
                ".specstory/history/session.json",
                "_artifacts/root-captured/example.txt",
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
                ".specstory/history/session.json",
                "_artifacts/root-captured/example.txt",
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

    def test_resolver_filters_preclassified_entries_to_unresolved_paths(self):
        strategy = policy.load_strategy(
            REPO_ROOT / "scripts" / "tools" / "merge-conflict-strategies.custom-first.json",
        )
        preclassified = [
            policy.Classification(
                path="package.json",
                action="upstream",
                note="official metadata",
                pattern="package.json",
                touched_upstream=True,
                touched_custom=False,
            ),
            policy.Classification(
                path="extensions/live2d-companion/index.ts",
                action="preserve_custom",
                note="custom plugin",
                pattern="extensions/live2d-companion/*",
                touched_upstream=False,
                touched_custom=True,
            ),
        ]

        selected = resolver_module.select_classifications_for_unresolved(
            preclassified,
            [
                "extensions/live2d-companion/index.ts",
                "docs/providers/openai.md",
            ],
            strategy,
        )

        self.assertEqual(
            [(item.path, item.action) for item in selected],
            [
                ("extensions/live2d-companion/index.ts", "preserve_custom"),
                ("docs/providers/openai.md", "manual_api_followup"),
            ],
        )

    def test_upstream_action_removes_paths_deleted_upstream(self):
        class RecordingResolver(resolver_module.Resolver):
            def __init__(self):
                super().__init__(upstream_ref="upstream/main", dry_run=False)
                self.calls = []

            def git_checkout_upstream(self, path: str):
                self.calls.append(("checkout-upstream", path))
                return subprocess.CompletedProcess([], 1, "", "")

            def git_rm(self, path: str):
                self.calls.append(("rm", path))

            def git_add(self, path: str):
                self.calls.append(("add", path))

        resolver = RecordingResolver()

        resolver.resolve_upstream("src/plugins/bundled-runtime-deps-install.ts")

        self.assertEqual(
            resolver.calls,
            [
                ("checkout-upstream", "src/plugins/bundled-runtime-deps-install.ts"),
                ("rm", "src/plugins/bundled-runtime-deps-install.ts"),
            ],
        )


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

    def test_preflight_followups_do_not_have_to_be_blockers(self):
        followups = merge_module.collect_followup_blockers(
            [
                {"path": "src/plugin-sdk/core.ts", "action": "manual_api_followup"},
                {"path": "package.json", "action": "upstream"},
            ],
            {"manual_api_followup"},
        )

        self.assertEqual(followups, ["src/plugin-sdk/core.ts"])
        self.assertEqual(
            merge_module.preflight_blockers_from_followups(
                followups,
                block_preflight_followups=False,
            ),
            [],
        )
        self.assertEqual(
            merge_module.preflight_blockers_from_followups(
                followups,
                block_preflight_followups=True,
            ),
            ["src/plugin-sdk/core.ts"],
        )


class OfficialOpenClawMergeHelperTests(unittest.TestCase):
    def test_immutable_guard_only_protects_identity_soul_files(self):
        self.assertTrue(official_merge_module.is_immutable_path("SOUL.md"))
        self.assertTrue(official_merge_module.is_immutable_path("identity/SOUL.md"))
        self.assertFalse(
            official_merge_module.is_immutable_path(
                "extensions/oc-path/src/oc-path/tests/fixtures/real/SOUL.md",
            ),
        )

    def test_latest_stable_tag_selection_ignores_beta_tags(self):
        tags = [
            official_merge_module.RemoteTag("v2026.5.4", "a" * 40),
            official_merge_module.RemoteTag("v2026.5.5-beta.2", "b" * 40),
            official_merge_module.RemoteTag("v2026.5.5", "c" * 40),
            official_merge_module.RemoteTag("v2026.5.3-1", "d" * 40),
        ]

        latest = official_merge_module.select_latest_official_tag(tags)

        self.assertIsNotNone(latest)
        self.assertEqual(latest.name, "v2026.5.5")

    def test_untracked_directory_overlap_blocks_only_existing_children(self):
        self.assertTrue(
            official_merge_module.path_overlaps(
                "extensions/live2d-companion/",
                "extensions/live2d-companion/package.json",
            ),
        )
        self.assertEqual(
            official_merge_module.overlapping_untracked_paths(
                ["extensions/live2d-companion/", "logs/build.log"],
                ["extensions/live2d-companion/package.json", "src/index.ts"],
                path_exists=lambda path: False,
            ),
            [],
        )
        self.assertEqual(
            official_merge_module.overlapping_untracked_paths(
                ["extensions/live2d-companion/"],
                ["extensions/live2d-companion/package.json"],
                path_exists=lambda path: path == "extensions/live2d-companion/package.json",
            ),
            ["extensions/live2d-companion/package.json"],
        )

    def test_tracked_status_paths_preserves_dirty_baseline(self):
        self.assertEqual(
            official_merge_module.tracked_status_paths(
                [
                    " M scripts/tools/merge_official_openclaw.py",
                    "R  old/path.ts -> src/new/path.ts",
                    "?? .openclaw-desktop/logs/",
                ],
            ),
            {
                "scripts/tools/merge_official_openclaw.py",
                "src/new/path.ts",
            },
        )


if __name__ == "__main__":
    unittest.main()
