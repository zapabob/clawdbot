
import os
import subprocess
import re

# Files identified by grep
files_to_resolve = [
    "ui/src/styles/components.css",
    "ui/src/ui/app-render.ts",
    "ui/src/ui/app-settings.ts",
    "ui/src/ui/controllers/cron.ts",
    "ui/src/ui/markdown.ts",
    "ui/src/ui/types.ts",
    "ui/src/ui/views/skills.ts",
    "skills/discord/SKILL.md",
    "src/version.ts",
    "src/cli/memory-cli.ts",
    "src/wizard/onboarding.ts",
    "src/wizard/onboarding.finalize.ts",
    "skills/tmux/SKILL.md",
    "src/telegram/bot-handlers.ts",
    "src/cli/update-cli.ts",
    "src/slack/monitor/slash.ts",
    "src/telegram/proxy.ts",
    "src/slack/monitor/message-handler/prepare.ts",
    "src/telegram/bot-native-commands.ts",
    "src/cli/program/register.onboard.ts",
    "src/telegram/bot/helpers.ts",
    "src/security/external-content.ts",
    "src/cli/cron-cli/register.cron-edit.ts",
    "src/runtime.ts",
    "src/cli/cron-cli/register.cron-add.ts",
    "src/cli/cron-cli.test.ts",
    "src/cli/completion-cli.ts",
    "src/plugins/discovery.ts",
    "src/plugin-sdk/index.ts",
    "src/node-host/runner.ts",
    "src/memory/manager.ts",
    "src/memory/search-manager.ts",
    "src/memory/session-files.ts",
    "src/imessage/client.ts",
    "src/imessage/monitor/monitor-provider.ts",
    "src/imessage/probe.ts",
    "src/infra/control-ui-assets.test.ts",
    "src/infra/control-ui-assets.ts",
    "src/imessage/monitor/deliver.ts",
    "src/infra/exec-approvals.ts",
    "src/infra/exec-approvals.test.ts",
    "src/infra/heartbeat-runner.ts",
    "src/infra/openclaw-root.ts",
    "src/infra/outbound/outbound-session.ts",
    "skills/healthcheck/SKILL.md",
    "src/gateway/control-ui.ts",
    "src/gateway/protocol/schema/cron.ts",
    "src/gateway/server-http.ts",
    "src/discord/monitor/native-command.ts",
    "src/gateway/server-runtime-state.ts",
    "src/discord/monitor/provider.ts",
    "src/gateway/server-methods/cron.ts",
    "src/discord/targets.ts",
    "src/gateway/server.impl.ts",
    "src/gateway/server.roles-allowlist-update.e2e.test.ts",
    "src/gateway/server-runtime-config.ts",
    "src/discord/monitor/message-handler.process.ts",
    "src/gateway/server-methods/update.ts",
    "src/discord/monitor/message-handler.inbound-contract.test.ts",
    "src/cron/isolated-agent.delivers-response-has-heartbeat-ok-but-includes.test.ts",
    "src/cron/isolated-agent.uses-last-non-empty-agent-text-as.test.ts",
    "src/cron/service/store.ts",
    "src/cron/service/timer.ts",
    "src/cron/types.ts",
    "src/cron/service/state.ts",
    "src/cron/service/jobs.ts",
    "src/cron/normalize.ts",
    "src/gateway/server/ws-connection/message-handler.ts",
    "src/cron/isolated-agent.skips-delivery-without-whatsapp-recipient-besteffortdeliver-true.test.ts",
    "src/cron/isolated-agent/delivery-target.ts",
    "src/cron/isolated-agent/run.ts",
    "src/commands/auth-choice-options.test.ts",
    "src/commands/auth-choice.apply.api-providers.ts",
    "src/config/schema.ts",
    "src/config/types.channels.ts",
    "src/commands/auth-choice.test.ts",
    "src/config/types.openclaw.ts",
    "src/config/types.ts",
    "src/config/zod-schema.session.ts",
    "src/commands/auth-choice-options.ts",
    "src/config/zod-schema.ts",
    "src/commands/onboard-auth.config-core.ts",
    "src/commands/onboard-auth.credentials.ts",
    "src/commands/onboard-auth.ts",
    "src/commands/onboard-interactive.ts",
    "src/auto-reply/reply/commands-approve.test.ts",
    "src/commands/status.scan.ts",
    "src/auto-reply/reply/commands-models.ts",
    "src/auto-reply/templating.ts",
    "src/auto-reply/reply/commands-approve.ts",
    "src/auto-reply/reply/directive-handling.impl.ts",
    "src/auto-reply/reply/directive-handling.model.ts",
    "src/commands/onboard-types.ts",
    "src/auto-reply/reply/get-reply-run.ts",
    "src/agents/bash-tools.exec.ts",
    "src/commands/onboard-non-interactive/local/auth-choice.ts",
    "README.md",
    "src/agents/models-config.providers.ts",
    "scripts/package-mac-dist.sh",
    "src/agents/openclaw-tools.ts",
    "src/agents/opencode-zen-models.ts",
    "src/agents/pi-embedded-runner/system-prompt.ts",
    "src/agents/pi-embedded-runner/run/attempt.ts",
    "src/agents/pi-tools.ts",
    "src/agents/system-prompt.ts",
    "src/agents/tools/cron-tool.ts",
    "src/agents/tools/discord-actions.ts",
    "src/agents/tools/memory-tool.ts",
    "src/agents/tools/message-tool.ts",
    "src/agents/tools/session-status-tool.ts",
    "src/agents/tools/web-fetch.ts",
    "src/agents/tools/web-tools.fetch.test.ts",
    "src/agents/skills-status.ts",
    "CHANGELOG.md"
]

def resolve_file(file_path):
    print(f"Resolving: {file_path}")
    if not os.path.exists(file_path):
        print(f"  Warning: File not found: {file_path}")
        return False
        
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"  Error reading {file_path}: {e}")
        return False
    
    # Robust pattern for conflict markers
    pattern = re.compile(r'<<<<<<< HEAD\s*[\r\n]+([\s\S]*?)=======[\s\S]*?[\r\n]+([\s\S]*?)>>>>>>> upstream/main', re.M)
    
    if not pattern.search(content):
        print(f"  Note: No markers found in {file_path}")
        return False

    def replacement(match):
        head = match.group(1).strip()
        upstream = match.group(2).strip()
        
        # Policy: favor HEAD (our fork) for code/logic, combine for docs/configs.
        if file_path.endswith(('.md', '.txt', '.css', '.gitignore', '.env.example')):
            if head and upstream:
                return f"{head}\n\n{upstream}"
            return head or upstream
        
        # For TS/JS/Json, combining might break it. Let's favor HEAD (our features).
        # However, if HEAD is empty, take Upstream.
        if not head: return upstream
        return head

    new_content = pattern.sub(replacement, content)
    # Handle nested or multiple blocks
    while pattern.search(new_content):
        new_content = pattern.sub(replacement, new_content)

    with open(file_path, 'w', encoding='utf-8', errors='ignore') as f:
        f.write(new_content)
    
    subprocess.run(['git', 'add', file_path])
    return True

if __name__ == "__main__":
    count = 0
    for f in files_to_resolve:
        if resolve_file(f):
            count += 1
    print(f"Finished. Resolved markers in {count} files.")
