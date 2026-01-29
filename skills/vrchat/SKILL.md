---
name: vrchat
description: Interact with VRChat via OSC (Chatbox, Avatar Parameters) and monitor VRChat logs for events like users joining/leaving.
metadata: { "moltbot": { "emoji": "👓", "requires": { "os": ["win32"] } } }
---

# VRChat Integration (Pro v1.2 - BoB-Nyan)

Advanced OSC Integration for high-fidelity control, safety, and cinematography in the Agent Era.

## Features (v1.2 Agent-Safe)

- **Permission Profiles**: `SAFE`, `PRO`, `DIRECTOR`. Commands are gated to prevent unauthorized agent actions.
- **Capability Negotiation**: Automatically checks OSCQuery/JSON Config before sending to prevent updates to non-existent parameters.
- **BoB-Nyan Protocol**: Bi-directional sync with Token Bucket rate limiting (5/5s) and 30s auto-jail.
- **Loop Protection**: Built-in echo suppression to prevent parameter feedback loops.
- **Camera Director**: Complete control over User Camera and Dolly (Zoom, Aperture, Focus, Dolly Pos).
- **Concierge Flow**: Realistic typing delays and UTF-8 sanitized chat with SFX support.

## Security Profiles

- **SAFE**: (Current default) Chat and parameter updates only. No input/camera.
- **PRO**: Grants access to controller inputs (`Jump`, `Move`, etc.).
- **DIRECTOR**: Grants access to user camera and dolly commands.

To switch profiles: `/vrc_profile <PROFILE>`

## Moltbot Commands

- `/vrc <message>` : Simple chat relay (Safe).
- `/vrc_speak <message>` : Concierge flow with typing delay and audio alert.
- `/vrc_cam <cmd> <val>` : Control camera (zoom, mode, aperture, dolly pos) [DIRECTOR].
- `/vrc_profile <profile>` : Switch security context.
- `/vrc_status` : View current capabilities and security profile.

## Security & Reliability

- **Rate Limit**: Token bucket allows bursts but strictly enforces average limits.
- **Cap-Negotiation**: Only sends parameter updates that the current avatar supports.
- **Echo Suppression**: Ignores self-echoes from VRChat within a 1s window.
- **Permission Guard**: Strictly local (127.0.0.1) and profile-gated.
