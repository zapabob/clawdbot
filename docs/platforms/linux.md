---
summary: "Linux support + companion app status"
read_when:
  - Looking for Linux companion app status
  - Planning platform coverage or contributions
  - Debugging Linux OOM kills or exit 137 on a VPS or container
title: "Linux app"
---

The Gateway is fully supported on Linux. **Node is the recommended runtime**.
Bun is not recommended for the Gateway (WhatsApp/Telegram bugs).

The strict-local Desktop Companion overlay exists in source through the bundled
`live2d-companion` plugin. It is useful on graphical Linux desktops for local
VRM/FBX avatar workflows, local character profiles, VOICEVOX speech, opt-in
capture permissions, and the `control_companion` agent tool. Packaged native
Linux companion apps are still planned. Contributions are welcome if you want to
help build one.

## Beginner quick path (VPS)

1. Install Node 24 (recommended; Node 22 LTS, currently `22.16+`, still works for compatibility)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. From your laptop: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Open `http://127.0.0.1:18789/` and authenticate with the configured shared secret (token by default; password if you set `gateway.auth.mode: "password"`)

Full Linux server guide: [Linux Server](/vps). Step-by-step VPS example: [exe.dev](/install/exe-dev)

## Install

- [Getting Started](/start/getting-started)
- [Install & updates](/install/updating)
- Optional flows: [Bun (experimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Desktop Companion overlay

On a Linux desktop with a working display server, the source checkout can run
the local Electron Desktop Companion overlay:

```bash
pnpm --dir extensions/live2d-companion start
```

The overlay stays local by default. It prefers VRM/FBX avatars, keeps Live2D as
a compatibility path, stores the companion character profile in local state,
requires explicit permission for microphone, camera, screen, and browser-follow
capture, and can be driven by the `control_companion` agent tool. The setup
panel includes a Character profile card for editing the local display name,
mood, greeting, persona prompt, voice profile, and relationship label. Use
`control_companion` with `action: "profile"` to read or update the same local
character profile from an agent. The saved profile is also appended to
`before_prompt_build` system context so companion turns can keep the local
character name, mood, greeting, voice profile, and relationship tone without a
remote profile service. Use `control_companion` with `action: "window_capture"`
when you need visual proof of the rendered companion window.

Headless servers and VPS installs should keep using the Gateway and Control UI;
the Desktop Companion overlay needs a graphical session.

## Gateway service install (CLI)

Use one of these:

```
openclaw onboard --install-daemon
```

Or:

```
openclaw gateway install
```

Or:

```
openclaw configure
```

Select **Gateway service** when prompted.

Repair/migrate:

```
openclaw doctor
```

## System control (systemd user unit)

OpenClaw installs a systemd **user** service by default. Use a **system**
service for shared or always-on servers. `openclaw gateway install` and
`openclaw onboard --install-daemon` already render the current canonical unit
for you; write one by hand only when you need a custom system/service-manager
setup. The full service guidance lives in the [Gateway runbook](/gateway).

Minimal setup:

Create `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Enable it:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Memory pressure and OOM kills

On Linux, the kernel chooses an OOM victim when a host, VM, or container cgroup
runs out of memory. The Gateway can be a poor victim because it owns long-lived
sessions and channel connections. OpenClaw therefore biases transient child
processes to be killed before the Gateway when possible.

For eligible Linux child spawns, OpenClaw starts the child through a short
`/bin/sh` wrapper that raises the child's own `oom_score_adj` to `1000`, then
`exec`s the real command. This is an unprivileged operation because the child is
only increasing its own OOM kill likelihood.

Covered child process surfaces include:

- supervisor-managed command children,
- PTY shell children,
- MCP stdio server children,
- OpenClaw-launched browser/Chrome processes.

The wrapper is Linux-only and is skipped when `/bin/sh` is unavailable. It is
also skipped if the child env sets `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, or `off`.

To verify a child process:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Expected value for covered children is `1000`. The Gateway process should keep
its normal score, usually `0`.

This does not replace normal memory tuning. If a VPS or container repeatedly
kills children, increase the memory limit, reduce concurrency, or add stronger
resource controls such as systemd `MemoryMax=` or container-level memory limits.

## Related

- [Install overview](/install)
- [Linux server](/vps)
- [Raspberry Pi](/platforms/raspberry-pi)
