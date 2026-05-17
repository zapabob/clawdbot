---
name: hypura-vrchat-existing-avatar
description: Use Hypura Harness tools to inspect and safely control the user's currently worn VRChat published avatar through its generated OSC JSON and approved action profile.
category: automation, vrchat, osc, avatar
version: 1.0.0
user-invocable: false
---

# Hypura VRChat Existing Avatar

Use this skill when an agent needs to inspect or gently animate the user's own
currently worn VRChat avatar through the bundled `hypura-harness` plugin.
OpenClaw does not log in to VRChat, modify the client, load models into
VRChat, or require custom `OC_` parameters. The user logs in with the official
VRChat client, enables OSC from the Action Menu, and wears a published avatar
that has already generated a local OSC JSON config.

## Required workflow

1. Check daemon and VRChat state first.

```text
hypura_harness_vrc_status({})
```

2. Inspect the current avatar and parameter catalog.

```text
hypura_harness_vrc_current_avatar({})
hypura_harness_vrc_parameters({})
```

3. Check the action profile before any write.

```text
hypura_harness_vrc_profile({})
```

4. If no approved profile exists, generate only a suggestion and stop.

```text
hypura_harness_vrc_suggest_profile({})
```

Suggested profiles are saved with `approved: false`. Do not change them to
`approved: true` unless the user explicitly reviews and approves the mapping.

5. Send avatar changes only through approved actions.

```text
hypura_harness_vrc_action({
  "action": "smile",
  "reason": "AI is greeting the user"
})
```

## Safety rules

- Do not use direct parameter writes for normal agent behavior.
- Do not approve profiles yourself or invent approval text.
- Do not use ChatBox unless config/status show it is enabled.
- Do not use movement in Public or crowded instances.
- If profile approval, current avatar, or catalog freshness is uncertain, use
  `hypura_harness_companion3d_event` or `hypura_harness_companion3d_set_state`
  instead of writing to VRChat.
- Use `hypura_harness_vrc_emergency_stop({})` immediately if the avatar behaves
  unexpectedly.

## Operator setup

- Start VRChat with the official client and log in manually.
- Enable OSC from the VRChat Action Menu.
- Wear the published avatar once so VRChat writes its OSC JSON under the local
  `VRChat/VRChat/OSC/<userId>/Avatars/<avatarId>.json` tree.
- Start VOICEVOX Engine before using local voice output.
- Configure any virtual audio device manually in Windows and select it in
  VRChat if generated voice should enter VRChat as microphone audio.
