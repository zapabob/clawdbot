# Gateway Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove generated browser token URLs, harden gateway quickstart defaults, and align Hypura/OpenClaw Python execution messaging around local execution only.

**Architecture:** Keep gateway token ownership in `OPENCLAW_GATEWAY_TOKEN` and `gateway.auth.token`, but stop minting Control UI URLs that embed the token. Apply the same clean-URL rule across dashboard, setup, and desktop launchers, then remove the quickstart-only insecure Control UI default and tighten local Python execution wording without changing the existing Hypura runtime contract.

**Tech Stack:** TypeScript (Vitest, pnpm), PowerShell launchers, Python (`uv`, `pytest`), OpenClaw wizard/CLI, Hypura harness

**Spec:** `docs/superpowers/specs/2026-04-15-gateway-auth-hardening-design.md`

---

## Execution Note

This repo's workspace policy says not to create or modify git worktrees without
explicit approval in chat. Execute this plan in the current workspace unless the
user later asks for worktree isolation.

---

## File Map

| File                                                                       | Responsibility                                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/commands/dashboard.ts`                                                | Stop generating tokenized dashboard URLs for copy/open flows                                           |
| `src/commands/dashboard.links.test.ts`                                     | Lock dashboard output to clean URLs                                                                    |
| `src/commands/onboard-helpers.ts`                                          | Remove tokenized SSH hint output                                                                       |
| `src/commands/onboard-helpers.test.ts`                                     | Verify SSH hint shows only the clean forwarded URL                                                     |
| `src/wizard/setup.finalize.ts`                                             | Remove tokenized Control UI links and tokenized guidance text from setup completion                    |
| `src/wizard/setup.finalize.test.ts`                                        | Verify web hatch opens a clean URL and note copy stays token-free                                      |
| `src/wizard/setup.gateway-config.ts`                                       | Stop auto-enabling `gateway.controlUi.allowInsecureAuth` in quickstart                                 |
| `src/wizard/setup.gateway-config.test.ts`                                  | Lock quickstart auth defaults to the hardened posture                                                  |
| `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1`              | Open the local Control UI without appending `#token=`                                                  |
| `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`                  | Remove the legacy `?token=` browser launch path                                                        |
| `src/commands/openclaw-desktop-launcher-auth-shape.test.ts`                | Prevent launcher regressions that reintroduce tokenized browser URLs                                   |
| `extensions/hypura-harness/scripts/code_runner.py`                         | Clarify prompt wording so generated Python is for local `uv run --script`, not remote `code_execution` |
| `extensions/hypura-harness/scripts/tests/test_code_runner.py`              | Lock the new prompt contract in place                                                                  |
| `extensions/hypura-harness/index.ts`                                       | Keep the `/run` tool description aligned with local execution semantics                                |
| `extensions/hypura-harness/README.md`                                      | Document the local execution path and explicitly steer operators away from remote `code_execution`     |
| `_docs/2026-04-15_gateway-auth-hardening-implementation{clawdbot-main}.md` | Record implementation, verification, and residual risks                                                |

---

### Task 1: Clean Dashboard URLs and SSH Hints

**Files:**

- Modify: `src/commands/dashboard.links.test.ts`
- Modify: `src/commands/onboard-helpers.test.ts`
- Modify: `src/commands/dashboard.ts`
- Modify: `src/commands/onboard-helpers.ts`

- [ ] **Step 1: Update the dashboard and SSH-hint tests to expect clean URLs**

```ts
// src/commands/dashboard.links.test.ts
expect(copyToClipboardMock).toHaveBeenCalledWith("http://127.0.0.1:18789/");
expect(openUrlMock).toHaveBeenCalledWith("http://127.0.0.1:18789/");

formatControlUiSshHintMock.mockReturnValue("ssh hint");
await dashboardCommand(runtime);
expect(formatControlUiSshHintMock).toHaveBeenCalledWith({
  port: 18789,
  basePath: undefined,
});

// src/commands/onboard-helpers.test.ts
import {
  formatControlUiSshHint,
  normalizeGatewayTokenInput,
  openUrl,
  probeGatewayReachable,
  resolveBrowserOpenCommand,
  resolveControlUiLinks,
  validateGatewayPasswordInput,
} from "./onboard-helpers.js";

it("prints only the clean forwarded URL in SSH hints", () => {
  const hint = formatControlUiSshHint({
    port: 18789,
    basePath: "/ui",
  });

  expect(hint).toContain("http://localhost:18789/ui/");
  expect(hint).not.toContain("#token=");
  expect(hint).not.toContain("?token=");
});
```

- [ ] **Step 2: Run the targeted tests and confirm they fail first**

```powershell
pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts
```

Expected: at least the dashboard expectations fail because the current code still
copies and opens `http://127.0.0.1:18789/#token=...`, and the new SSH-hint test
fails because `formatControlUiSshHint()` still emits the alternate authed URL.

- [ ] **Step 3: Implement clean URL generation in the dashboard command**

```ts
// src/commands/dashboard.ts
const dashboardUrl = links.httpUrl;

runtime.log(`Dashboard URL: ${dashboardUrl}`);
if (resolvedToken.secretRefConfigured && token) {
  runtime.log(
    "Token auto-auth is disabled for SecretRef-managed gateway.auth.token; use your external token source if prompted.",
  );
}
if (resolvedToken.unresolvedRefReason) {
  runtime.log(`Token auto-auth unavailable: ${resolvedToken.unresolvedRefReason}`);
  runtime.log(
    "Set OPENCLAW_GATEWAY_TOKEN in this shell or resolve your secret provider, then rerun `openclaw dashboard`.",
  );
}

const copied = await copyToClipboard(dashboardUrl).catch(() => false);
runtime.log(copied ? "Copied to clipboard." : "Copy to clipboard unavailable.");

let opened = false;
let hint: string | undefined;
if (!options.noOpen) {
  const browserSupport = await detectBrowserOpenSupport();
  if (browserSupport.ok) {
    opened = await openUrl(dashboardUrl);
  }
  if (!opened) {
    hint = formatControlUiSshHint({
      port,
      basePath,
    });
  }
} else {
  hint = "Browser launch disabled (--no-open). Use the URL above.";
}
```

- [ ] **Step 4: Remove tokenized SSH hint output**

```ts
// src/commands/onboard-helpers.ts
export function formatControlUiSshHint(params: { port: number; basePath?: string }): string {
  const basePath = normalizeControlUiBasePath(params.basePath);
  const uiPath = basePath ? `${basePath}/` : "/";
  const localUrl = `http://localhost:${params.port}${uiPath}`;
  const sshTarget = resolveSshTargetHint();
  return [
    "No GUI detected. Open from your computer:",
    `ssh -N -L ${params.port}:127.0.0.1:${params.port} ${sshTarget}`,
    "Then open:",
    localUrl,
    "Docs:",
    "https://docs.openclaw.ai/gateway/remote",
    "https://docs.openclaw.ai/web/control-ui",
  ].join("\n");
}
```

- [ ] **Step 5: Re-run the targeted tests**

```powershell
pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts
```

Expected: PASS for both files.

- [ ] **Step 6: Commit the scoped dashboard/helper change**

```powershell
git add src/commands/dashboard.ts src/commands/dashboard.links.test.ts src/commands/onboard-helpers.ts src/commands/onboard-helpers.test.ts
$env:FAST_COMMIT='1'; git commit -m "fix: remove tokenized dashboard urls"; Remove-Item Env:FAST_COMMIT
```

---

### Task 2: Clean Setup Wizard Control UI Links and Token Guidance

**Files:**

- Modify: `src/wizard/setup.finalize.test.ts`
- Modify: `src/wizard/setup.finalize.ts`

- [ ] **Step 1: Make the setup-finalize test file assert clean web-hatch behavior**

```ts
// src/wizard/setup.finalize.test.ts
const detectBrowserOpenSupportMock = vi.hoisted(() => vi.fn(async () => ({ ok: false })));
const formatControlUiSshHintMock = vi.hoisted(() => vi.fn(() => "ssh hint"));
const openUrlMock = vi.hoisted(() => vi.fn(async () => false));

vi.mock("../commands/onboard-helpers.js", () => ({
  detectBrowserOpenSupport: detectBrowserOpenSupportMock,
  formatControlUiSshHint: formatControlUiSshHintMock,
  openUrl: openUrlMock,
  probeGatewayReachable,
  resolveControlUiLinks: vi.fn(() => ({
    httpUrl: "http://127.0.0.1:18789",
    wsUrl: "ws://127.0.0.1:18789",
  })),
  waitForGatewayReachable,
}));

it("opens the clean dashboard URL for web hatch", async () => {
  detectBrowserOpenSupportMock.mockResolvedValue({ ok: true });
  openUrlMock.mockResolvedValue(true);
  const note = vi.fn(async () => {});
  const select = vi.fn(async (params: { message: string }) => {
    if (params.message === "How do you want to hatch your bot?") {
      return "web";
    }
    return "later";
  });
  const prompter = buildWizardPrompter({
    note,
    select: select as never,
    confirm: vi.fn(async () => false),
  });

  await finalizeSetupWizard({
    flow: "quickstart",
    opts: {
      acceptRisk: true,
      authChoice: "skip",
      installDaemon: false,
      skipHealth: true,
      skipUi: false,
    },
    baseConfig: {},
    nextConfig: {},
    workspaceDir: "/tmp",
    settings: {
      port: 18789,
      bind: "loopback",
      authMode: "token",
      gatewayToken: "test-token",
      tailscaleMode: "off",
      tailscaleResetOnExit: false,
    },
    prompter,
    runtime: createRuntime(),
  });

  expect(openUrlMock).toHaveBeenCalledWith("http://127.0.0.1:18789");
  expect(note).toHaveBeenCalledWith(
    expect.stringContaining("Dashboard link: http://127.0.0.1:18789"),
    "Dashboard ready",
  );
  expect(note).not.toHaveBeenCalledWith(expect.stringContaining("with token"), "Dashboard ready");
});
```

- [ ] **Step 2: Run the setup-finalize test and confirm the new clean-URL expectation fails**

```powershell
pnpm test -- src/wizard/setup.finalize.test.ts
```

Expected: FAIL because the current implementation still calls `openUrl(authedUrl)`
and emits `"Dashboard link (with token): ..."`.

- [ ] **Step 3: Replace setup-finalize tokenized browser output with the clean Control UI URL**

```ts
// src/wizard/setup.finalize.ts
const controlUiUrl = links.httpUrl;

await prompter.note(
  [
    `Web UI: ${controlUiUrl}`,
    `Gateway WS: ${links.wsUrl}`,
    gatewayStatusLine,
    "Docs: https://docs.openclaw.ai/web/control-ui",
  ].join("\n"),
  "Control UI",
);

await prompter.note(
  [
    "Gateway token: shared auth for the Gateway + Control UI.",
    "Stored in: $OPENCLAW_CONFIG_PATH (default: ~/.openclaw/openclaw.json) under gateway.auth.token, or in OPENCLAW_GATEWAY_TOKEN.",
    `View token: ${formatCliCommand("openclaw config get gateway.auth.token")}`,
    `Generate token: ${formatCliCommand("openclaw doctor --generate-gateway-token")}`,
    `Open the dashboard anytime: ${formatCliCommand("openclaw dashboard --no-open")}`,
    "If prompted: paste the token into Control UI settings.",
  ].join("\n"),
  "Token",
);
```

- [ ] **Step 4: Update both browser-open branches to use the clean URL and clean hints**

```ts
// src/wizard/setup.finalize.ts
controlUiOpened = await openUrl(controlUiUrl);
if (!controlUiOpened) {
  controlUiOpenHint = formatControlUiSshHint({
    port: settings.port,
    basePath: controlUiBasePath,
  });
}

await prompter.note(
  [
    `Dashboard link: ${controlUiUrl}`,
    controlUiOpened
      ? "Opened in your browser. Keep that tab to control OpenClaw."
      : "Copy/paste this URL in a browser on this machine to control OpenClaw.",
    controlUiOpenHint,
  ]
    .filter(Boolean)
    .join("\n"),
  "Dashboard ready",
);
```

- [ ] **Step 5: Re-run the setup-finalize test**

```powershell
pnpm test -- src/wizard/setup.finalize.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the setup-finalize cleanup**

```powershell
git add src/wizard/setup.finalize.ts src/wizard/setup.finalize.test.ts
$env:FAST_COMMIT='1'; git commit -m "fix: keep setup control ui links token-free"; Remove-Item Env:FAST_COMMIT
```

---

### Task 3: Remove the Quickstart Insecure Control UI Default

**Files:**

- Modify: `src/wizard/setup.gateway-config.test.ts`
- Modify: `src/wizard/setup.gateway-config.ts`

- [ ] **Step 1: Change the quickstart tests to lock in the hardened default**

```ts
// src/wizard/setup.gateway-config.test.ts
it("leaves control ui auth strict for fresh quickstart loopback setups", async () => {
  mocks.randomToken.mockReturnValue("generated-token");

  const result = await runGatewayConfig({
    flow: "quickstart",
    textQueue: [],
  });

  expect(result.nextConfig.gateway?.controlUi?.allowInsecureAuth).toBeUndefined();
});

it("does not auto-enable insecure auth when quickstart reuses an existing loopback config", async () => {
  mocks.randomToken.mockReturnValue("generated-token");
  const prompter = createPrompter({
    selectQueue: [],
    textQueue: [],
  });
  const runtime = createRuntime();

  const result = await configureGatewayForSetup({
    flow: "quickstart",
    baseConfig: {},
    nextConfig: {
      gateway: {
        port: 18789,
        bind: "loopback",
      },
    },
    localPort: 18789,
    quickstartGateway: {
      ...createQuickstartGateway("token"),
      hasExisting: true,
    },
    prompter,
    runtime,
  });

  expect(result.nextConfig.gateway?.controlUi?.allowInsecureAuth).toBeUndefined();
});
```

- [ ] **Step 2: Run the quickstart config tests and confirm they fail first**

```powershell
pnpm test -- src/wizard/setup.gateway-config.test.ts
```

Expected: FAIL because the quickstart branch still injects
`allowInsecureAuth: true`.

- [ ] **Step 3: Remove the quickstart-only `allowInsecureAuth` injection**

```ts
// src/wizard/setup.gateway-config.ts
nextConfig = ensureControlUiAllowedOriginsForNonLoopbackBind(nextConfig, {
  requireControlUiEnabled: true,
}).config;
nextConfig = await maybeAddTailnetOriginToControlUiAllowedOrigins({
  config: nextConfig,
  tailscaleMode,
  tailscaleBin,
});
```

Implementation note: delete the entire block that previously ran immediately
before `ensureControlUiAllowedOriginsForNonLoopbackBind(...)` and set
`gateway.controlUi.allowInsecureAuth = true` for quickstart loopback setups.

- [ ] **Step 4: Re-run the quickstart config tests**

```powershell
pnpm test -- src/wizard/setup.gateway-config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the gateway hardening default change**

```powershell
git add src/wizard/setup.gateway-config.ts src/wizard/setup.gateway-config.test.ts
$env:FAST_COMMIT='1'; git commit -m "fix: harden quickstart control ui defaults"; Remove-Item Env:FAST_COMMIT
```

---

### Task 4: Remove Tokenized Browser Launches from the Desktop Scripts

**Files:**

- Create: `src/commands/openclaw-desktop-launcher-auth-shape.test.ts`
- Modify: `scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1`
- Modify: `scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1`

- [ ] **Step 1: Add a shape-guard test for the PowerShell launchers**

```ts
// src/commands/openclaw-desktop-launcher-auth-shape.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(thisDir, "../..");

function readRepoFile(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("desktop launcher browser auth", () => {
  it("does not embed gateway tokens in browser URLs", () => {
    const stackLauncher = readRepoFile(
      "scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1",
    );
    const sovereignPortal = readRepoFile("scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1");

    expect(stackLauncher).not.toContain("#token=");
    expect(stackLauncher).not.toContain("?token=");
    expect(sovereignPortal).not.toContain("#token=");
    expect(sovereignPortal).not.toContain("?token=");
  });
});
```

- [ ] **Step 2: Run the launcher shape-guard test and confirm it fails**

```powershell
pnpm test -- src/commands/openclaw-desktop-launcher-auth-shape.test.ts
```

Expected: FAIL because both PowerShell scripts still contain tokenized browser
URL patterns.

- [ ] **Step 3: Make the desktop stack launcher open only the clean local gateway URL**

```powershell
# scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1
if (-not $SkipBrowser) {
    $browserUrl = $localGatewayUrl
    $browserScript = Join-Path $PSScriptRoot "..\browser-wait-and-open.ps1"
    Start-StackProcess -Title "OpenClaw Browser" `
        -WorkingDirectory $ProjectDir `
        -WindowStyle "Hidden" `
        -NoExit:$false `
        -EnvironmentOverrides $processEnv `
        -CommandParts @(
            "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $browserScript,
            "-GatewayPort", [string]$GatewayPort, "-Url", $browserUrl
        )
    Write-Host "  [Browser ] Background polling started (env injected; opens when gateway ready)" -ForegroundColor Cyan
}
```

- [ ] **Step 4: Remove the legacy tokenized Edge URL logic from Sovereign Portal**

```powershell
# scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1
$baseUrl = "http://127.0.0.1:$GatewayPort"
if (-not [string]::IsNullOrWhiteSpace([string]$env:OPENCLAW_PUBLIC_URL)) {
    $baseUrl = [string]$env:OPENCLAW_PUBLIC_URL
}
$edgeUrl = $baseUrl
```

Implementation note: delete the now-unused `$gwToken` lookup block if it becomes
dead code after `$edgeUrl` stops depending on the token.

- [ ] **Step 5: Re-run the shape-guard test and grep for regressions**

```powershell
pnpm test -- src/commands/openclaw-desktop-launcher-auth-shape.test.ts
Select-String -Path 'scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1','scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1' -Pattern '#token=','?token='
```

Expected:

- Vitest PASS
- `Select-String` returns no matches

- [ ] **Step 6: Commit the launcher cleanup**

```powershell
git add src/commands/openclaw-desktop-launcher-auth-shape.test.ts scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1 scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1
$env:FAST_COMMIT='1'; git commit -m "fix: remove tokenized desktop browser launches"; Remove-Item Env:FAST_COMMIT
```

---

### Task 5: Align Hypura Messaging with Local Execution

**Files:**

- Modify: `extensions/hypura-harness/scripts/tests/test_code_runner.py`
- Modify: `extensions/hypura-harness/scripts/code_runner.py`
- Modify: `extensions/hypura-harness/index.ts`
- Modify: `extensions/hypura-harness/README.md`

- [ ] **Step 1: Add a prompt-contract test for local execution wording**

````python
# extensions/hypura-harness/scripts/tests/test_code_runner.py
def test_generate_code_prompt_discourages_remote_code_execution(monkeypatch) -> None:
    recorded: list[list[str]] = []

    def fake_run(cmd, **kwargs):
        recorded.append(list(cmd))
        return MagicMock(
            returncode=0,
            stdout='```python\n# /// script\n# dependencies = []\n# ///\nprint("ok")\n```',
            stderr="",
        )

    monkeypatch.setattr("code_runner.subprocess.run", fake_run)
    monkeypatch.setattr("code_runner._USE_GATEWAY_AGENT", False)
    from code_runner import _generate_code

    _generate_code("print hello")
    prompt = recorded[0][-1]
    assert "Return Python source only." in prompt
    assert "Do not call code_execution" in prompt
    assert "uv run --script" in prompt
````

- [ ] **Step 2: Run the Python test and confirm it fails first**

```powershell
Set-Location extensions/hypura-harness/scripts
uv run pytest tests/test_code_runner.py -q
Set-Location ..\..\..
```

Expected: FAIL because the current prompt does not mention `code_execution` or
local `uv run --script`.

- [ ] **Step 3: Tighten the generated prompt so it explicitly targets local execution**

```python
# extensions/hypura-harness/scripts/code_runner.py
prompt = (
    f"Write a self-contained Python script (PEP 723 inline deps) to: {task}"
    + (f"\n\nPrevious error:\n{error_context}" if error_context else "")
    + "\n\nReturn Python source only."
    + "\nDo not call code_execution, and do not depend on a remote sandbox."
    + "\nThis script will be executed locally with uv run --script after generation."
    + "\nPrefer normal file execution, not inline python -c shell fragments."
    + "\n\nStart with:\n# /// script\n# dependencies = [...]\n# ///"
)
```

- [ ] **Step 4: Update the tool description and README wording to match the runtime**

```ts
// extensions/hypura-harness/index.ts
description:
  "POST /run - generate Python source and execute it locally via harness code_runner (PEP 723 + uv run --script).",
```

```md
<!-- extensions/hypura-harness/README.md -->

## Python execution semantics

- Use local `exec` when OpenClaw itself should run Python inside the workspace.
- Use `hypura_harness_run` when the Hypura harness should generate and execute a
  temporary PEP 723 script locally.
- Do not route this through remote `code_execution`; the harness executes
  locally with `uv run --script`.
```

- [ ] **Step 5: Re-run the Python test**

```powershell
Set-Location extensions/hypura-harness/scripts
uv run pytest tests/test_code_runner.py -q
Set-Location ..\..\..
```

Expected: PASS.

- [ ] **Step 6: Commit the Hypura wording change**

```powershell
git add extensions/hypura-harness/scripts/tests/test_code_runner.py extensions/hypura-harness/scripts/code_runner.py extensions/hypura-harness/index.ts extensions/hypura-harness/README.md
$env:FAST_COMMIT='1'; git commit -m "docs: clarify local hypura python execution"; Remove-Item Env:FAST_COMMIT
```

---

### Task 6: Final Verification and Implementation Log

**Files:**

- Create: `_docs/2026-04-15_gateway-auth-hardening-implementation{clawdbot-main}.md`

- [ ] **Step 1: Create the implementation log skeleton**

```md
# Overview

Implemented gateway auth hardening across dashboard, setup, and desktop launchers,
and clarified local Python execution semantics for Hypura/OpenClaw.

# Background / requirements

- Stop generating tokenized browser URLs.
- Remove quickstart `allowInsecureAuth` defaulting.
- Keep UI-side token parsing as a compatibility fallback.
- Clarify that local Python execution uses `exec` or `hypura_harness_run`.

# Assumptions / decisions

- Browser auto-auth via URL token was intentionally removed.
- Existing token parsing in the UI was preserved.
- Dangerous Control UI flags remain operator opt-in only.

# Changed files

- src/commands/dashboard.ts
- src/commands/dashboard.links.test.ts
- src/commands/onboard-helpers.ts
- src/commands/onboard-helpers.test.ts
- src/wizard/setup.finalize.ts
- src/wizard/setup.finalize.test.ts
- src/wizard/setup.gateway-config.ts
- src/wizard/setup.gateway-config.test.ts
- src/commands/openclaw-desktop-launcher-auth-shape.test.ts
- scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1
- scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1
- extensions/hypura-harness/scripts/code_runner.py
- extensions/hypura-harness/scripts/tests/test_code_runner.py
- extensions/hypura-harness/index.ts
- extensions/hypura-harness/README.md
- \_docs/2026-04-15_gateway-auth-hardening-implementation{clawdbot-main}.md

# Implementation details

Removed tokenized browser URLs from dashboard, setup, and desktop launchers;
removed the quickstart-only `allowInsecureAuth` default; and updated Hypura
messaging so local Python execution is clearly described as local `exec` or
local `uv run --script` via the harness.

# Commands run

pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts
uv run pytest tests/test_code_runner.py -q
pnpm check
pnpm build

# Test / verification results

- `pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts`
- `uv run pytest tests/test_code_runner.py -q`
- `pnpm check`
- `pnpm build`

# Residual risks

If `pnpm check` or `pnpm build` fails for an unrelated pre-existing workspace
problem, record the exact command, the first actionable failure, and the fact
that launcher browser behavior was still only shape-guarded plus grep-checked.

# Recommended next actions

If the rollout is stable, consider a later follow-up that removes legacy UI-side
`?token=` and `#token=` parsing after downstream launchers and operator habits
have fully migrated.
```

- [ ] **Step 2: Run the focused test suite for this feature**

```powershell
pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts
Set-Location extensions/hypura-harness/scripts
uv run pytest tests/test_code_runner.py -q
Set-Location ..\..\..
```

Expected: all targeted tests PASS.

- [ ] **Step 3: Run the repo gates required for TypeScript behavior changes**

```powershell
pnpm check
pnpm build
```

Expected: both commands PASS. If either fails for an unrelated pre-existing
reason, capture the exact failure in the implementation log before making any
completion claim.

- [ ] **Step 4: Add one manual regression smoke for tokenized URLs**

```powershell
Select-String -Path 'scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1','scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1','src/commands/dashboard.ts','src/wizard/setup.finalize.ts' -Pattern '#token=','?token='
```

Expected: no matches in the modified generation surfaces.

- [ ] **Step 5: Finish the implementation log with real outputs and residual risks**

```md
# Commands run

pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts
uv run pytest tests/test_code_runner.py -q
pnpm check
pnpm build
Select-String -Path 'scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1','scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1','src/commands/dashboard.ts','src/wizard/setup.finalize.ts' -Pattern '#token=','?token='

# Test / verification results

- `pnpm test -- src/commands/dashboard.links.test.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts` - PASS
- `uv run pytest tests/test_code_runner.py -q` - PASS
- `pnpm check` - PASS
- `pnpm build` - PASS
- `Select-String -Path 'scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1','scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1','src/commands/dashboard.ts','src/wizard/setup.finalize.ts' -Pattern '#token=','?token='` - no tokenized URL matches
```

- [ ] **Step 6: Commit the final verified change set**

```powershell
git add src/commands/dashboard.ts src/commands/dashboard.links.test.ts src/commands/onboard-helpers.ts src/commands/onboard-helpers.test.ts src/wizard/setup.finalize.ts src/wizard/setup.finalize.test.ts src/wizard/setup.gateway-config.ts src/wizard/setup.gateway-config.test.ts src/commands/openclaw-desktop-launcher-auth-shape.test.ts scripts/launchers/openclaw-desktop/launch-desktop-stack.ps1 scripts/launchers/openclaw-desktop/Sovereign-Portal.ps1 extensions/hypura-harness/scripts/code_runner.py extensions/hypura-harness/scripts/tests/test_code_runner.py extensions/hypura-harness/index.ts extensions/hypura-harness/README.md _docs/2026-04-15_gateway-auth-hardening-implementation{clawdbot-main}.md
git commit -m "fix: harden gateway auth surfaces"
```

---

## Self-Review Checklist

- Task 1 covers dashboard and SSH hint generation surfaces from the spec.
- Task 2 covers setup-finalize output and browser-open behavior from the spec.
- Task 3 covers the hardened quickstart default from the spec.
- Task 4 covers both desktop launcher surfaces from the spec.
- Task 5 covers the Hypura/OpenClaw local-execution clarification from the spec.
- Task 6 captures the `_docs` requirement and the verification gates required
  before claiming the implementation complete.
