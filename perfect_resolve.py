
import os
import subprocess

def perfect_resolve(file_path):
    print(f"Resolving: {file_path}")
    if not os.path.exists(file_path):
        return False
        
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"  Error reading: {e}")
        return False

    new_lines = []
    state = "normal" # or "head", "upstream"
    head_block = []
    upstream_block = []
    
    resolved_any = False

    for line in lines:
        if line.startswith("<<<<<<< HEAD"):
            state = "head"
            head_block = []
            resolved_any = True
        elif line.startswith("======="):
            if state == "head":
                state = "upstream"
                upstream_block = []
            else:
                # Unexpected marker, treat as normal text or handle error
                new_lines.append(line)
        elif line.startswith(">>>>>>> upstream/main"):
            if state == "upstream":
                # Decision time:
                # 1. If it's a doc/config, keep both (Union)
                # 2. If it's code, prioritize HEAD (our features) but keep upstream if HEAD is empty
                if file_path.endswith(('.md', '.txt', '.css', '.gitignore', '.env.example')):
                    # Union strategy
                    for l in head_block: new_lines.append(l)
                    if head_block and upstream_block: new_lines.append("\n")
                    for l in upstream_block: new_lines.append(l)
                else:
                    # Priority strategy: Keep HEAD if not empty
                    content_head = "".join(head_block).strip()
                    if content_head:
                        for l in head_block: new_lines.append(l)
                    else:
                        for l in upstream_block: new_lines.append(l)
                state = "normal"
            else:
                new_lines.append(line)
        else:
            if state == "head":
                head_block.append(line)
            elif state == "upstream":
                upstream_block.append(line)
            else:
                new_lines.append(line)

    if resolved_any:
        # Avoid writing if it didn't change (though we track changes)
        # But we also want to deduplicate imports if possible for TS/JS files
        if file_path.endswith(('.ts', '.js', '.mjs')):
            # Simple deduplication for imports
            final_lines = []
            seen_imports = set()
            for l in new_lines:
                if l.strip().startswith("import "):
                    if l.strip() not in seen_imports:
                        final_lines.append(l)
                        seen_imports.add(l.strip())
                else:
                    final_lines.append(l)
            new_lines = final_lines

        with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
            f.writelines(new_lines)
        subprocess.run(['git', 'add', file_path])
        return True
    return False

if __name__ == "__main__":
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], capture_output=True, text=True)
    conflicted = result.stdout.splitlines()
    # Also check files found by last grep if not in 'conflicted'
    # but git status is more reliable for "officially" conflicted files.
    
    # Let's just use all files from the previous grep list too, to be safe.
    manual_list = [
        "ui/src/ui/app-render.ts", "ui/src/ui/app-settings.ts", "ui/src/ui/views/skills.ts",
        "ui/src/ui/controllers/cron.ts", "ui/src/styles/components.css", "src/wizard/onboarding.finalize.ts",
        "src/wizard/onboarding.ts", "src/version.ts", "src/telegram/bot/helpers.ts",
        "src/telegram/bot-handlers.ts", "src/telegram/bot-native-commands.ts", "src/telegram/proxy.ts",
        "src/slack/monitor/message-handler/prepare.ts", "src/slack/monitor/slash.ts", "src/runtime.ts",
        "src/security/external-content.ts", "src/imessage/probe.ts", "src/plugin-sdk/index.ts",
        "src/node-host/runner.ts", "skills/tmux/SKILL.md", "src/memory/manager.ts",
        "src/memory/search-manager.ts", "src/memory/session-files.ts", "src/imessage/monitor/deliver.ts",
        "src/imessage/monitor/monitor-provider.ts", "src/imessage/client.ts", "src/infra/control-ui-assets.test.ts",
        "src/infra/exec-approvals.test.ts", "src/infra/exec-approvals.ts", "src/infra/openclaw-root.ts",
        "src/infra/outbound/outbound-session.ts", "src/infra/heartbeat-runner.ts", "skills/healthcheck/SKILL.md",
        "src/gateway/control-ui.ts", "src/discord/monitor/native-command.ts", "src/discord/targets.ts",
        "src/gateway/server-runtime-config.ts", "src/gateway/server-runtime-state.ts", "src/gateway/server-methods/cron.ts",
        "src/gateway/server-http.ts", "src/discord/monitor/provider.ts", "src/gateway/server.impl.ts",
        "src/discord/monitor/message-handler.process.ts", "src/gateway/server.roles-allowlist-update.e2e.test.ts",
        "src/gateway/server-methods/update.ts", "src/discord/monitor/message-handler.inbound-contract.test.ts",
        "src/gateway/protocol/schema/cron.ts", "src/gateway/server/ws-connection/message-handler.ts",
        "skills/discord/SKILL.md", "src/cron/isolated-agent.skips-delivery-without-whatsapp-recipient-besteffortdeliver-true.test.ts",
        "src/cron/isolated-agent/delivery-target.ts", "src/cron/isolated-agent/run.ts", "src/cron/service/jobs.ts",
        "src/cron/service/state.ts", "src/cron/service/store.ts", "src/cron/service/timer.ts", "src/cron/types.ts",
        "src/commands/auth-choice.apply.api-providers.ts", "src/commands/auth-choice-options.ts", "src/commands/auth-choice-options.test.ts",
        "src/cron/normalize.ts", "src/cron/isolated-agent.uses-last-non-empty-agent-text-as.test.ts",
        "src/cron/isolated-agent.delivers-response-has-heartbeat-ok-but-includes.test.ts", "src/commands/auth-choice.test.ts",
        "src/config/schema.ts", "src/config/types.channels.ts", "src/config/types.openclaw.ts", "src/config/types.ts",
        "src/config/zod-schema.session.ts", "src/config/zod-schema.ts", "src/cli/cron-cli.test.ts",
        "src/cli/cron-cli/register.cron-add.ts", "src/commands/onboard-auth.credentials.ts", "src/commands/onboard-interactive.ts",
        "src/commands/onboard-non-interactive/local/auth-choice.ts", "src/commands/status.scan.ts", "src/cli/update-cli.ts",
        "src/cli/program/register.onboard.ts", "src/cli/memory-cli.ts", "src/commands/onboard-auth.config-core.ts",
        "src/cli/cron-cli/register.cron-edit.ts", "src/agents/bash-tools.exec.ts", "src/auto-reply/templating.ts",
        "src/auto-reply/reply/commands-approve.test.ts", "README.md", "src/auto-reply/reply/commands-models.ts",
        "src/auto-reply/reply/directive-handling.impl.ts", "scripts/package-mac-dist.sh", "src/auto-reply/reply/get-reply-run.ts",
        "src/agents/openclaw-tools.ts", "src/agents/models-config.providers.ts", "src/auto-reply/reply/directive-handling.model.ts",
        "src/agents/pi-embedded-runner/run/attempt.ts", "src/agents/pi-embedded-runner/system-prompt.ts", "src/agents/skills-status.ts",
        "src/agents/system-prompt.ts", "src/agents/pi-tools.ts", "src/agents/tools/cron-tool.ts", "src/agents/tools/discord-actions.ts",
        "src/agents/tools/memory-tool.ts", "src/agents/tools/message-tool.ts", "src/agents/tools/session-status-tool.ts",
        "src/agents/tools/web-fetch.ts", "src/agents/tools/web-tools.fetch.test.ts", "CHANGELOG.md"
    ]

    all_files = list(set(conflicted + manual_list))
    count = 0
    for f in all_files:
        if perfect_resolve(f):
            count += 1
    print(f"Finished. Resolved {count} files.")
