# VRChat Memory Plugin

VRChat control with GRPO optimization, Ebbinghaus forgetting curve memory, and episodic memory for intelligent session management.

## Features

### GRPO Optimization

- **Group Relative Policy Optimization** based on DeepSeekMath paper
- Group-based advantage estimation without critic model
- Reward normalization within groups
- PPO-style clipped objective
- Reference policy comparison with KL divergence

### Ebbinghaus Memory

- **Forgetting curve**: R(t,S) = (1 + factor \* t / S) ^ (-decay)
- Adaptive stability based on review success
- Difficulty-adjusted decay rates
- Spaced repetition scheduling
- Priority-based review queue

### Episodic Memory

- Session tracking and management
- World visit history
- Avatar change tracking
- Social interaction logging
- Learning moment capture
- Session summarization

### Mode Switching

- **LINE mode**: Natural language commands via LINE
- **CLI mode**: Command-line control
- **GUI mode**: Graphical interface commands
- Automatic routing based on context
- Capability-aware command routing

## Installation

```bash
# Install via OpenClaw plugin system
openclaw plugins install vrchat-memory
```

## Usage

### Initialize the Agent

```typescript
import { VRChatAgent } from "@openclaw/vrchat-memory";

const agent = new VRChatAgent({
  grpo: {
    groupSize: 8,
    learningRate: 0.001,
    clipRatio: 0.2,
    referenceKLWeight: 0.03,
    updateInterval: 100,
  },
  ebbinghaus: {
    decayConstant: 1.25,
    stabilityIncrement: 1.5,
    initialStability: 1.0,
    reviewThreshold: 0.7,
  },
  episodic: {
    maxSessionLength: 180,
    maxEpisodes: 1000,
    importanceThreshold: 0.6,
  },
  modeDefault: "CLI",
  enableHumanInLoop: true,
});

agent.initialize();
```

### Execute Actions

```typescript
const result = await agent.executeAction({
  type: "set_avatar_parameter",
  target: "GestureLeft",
  value: true,
  parameters: { duration: 0.5 },
});

console.log(result.success); // true or false
console.log(result.outcome); // "Action completed successfully"
```

### Process Natural Language Commands

```typescript
const { action, result } = await agent.processCommand("change avatar to my favorite", {
  source: "line",
  userId: "user123",
  timestamp: Date.now(),
  isInteractive: true,
  requiresConfirmation: false,
});
```

### Memory Management

```typescript
// Get memories due for review
const dueReviews = agent.getDueReviews(10);

// Get upcoming scheduled reviews
const upcoming = agent.getUpcomingReviews(10);

// Get session summary
const summary = agent.getSessionSummary();
```

## Tools

### `vrchat_memory_initialize`

Initialize the VRChat Memory agent.

### `vrchat_memory_status`

Get agent status and performance metrics.

### `vrchat_memory_execute`

Execute a VRChat action with GRPO optimization.

### `vrchat_memory_process_command`

Process a natural language command and execute action.

### `vrchat_memory_set_mode`

Set the control mode (LINE, CLI, GUI).

### `vrchat_memory_get_reviews`

Get memories due for review based on Ebbinghaus forgetting curve.

### `vrchat_memory_get_session`

Get current or specific session summary.

### `vrchat_memory_get_upcoming`

Get upcoming scheduled reviews.

### `vrchat_memory_start_session`

Start a new VRChat session.

### `vrchat_memory_end_session`

End the current VRChat session.

### `vrchat_memory_get_policy`

Get current GRPO policy parameters.

### `vrchat_memory_clear`

Clear all VRChat memory data.

## Configuration

```json
{
  "grpo": {
    "groupSize": 8,
    "learningRate": 0.001,
    "clipRatio": 0.2,
    "referenceKLWeight": 0.03,
    "updateInterval": 100
  },
  "ebbinghaus": {
    "decayConstant": 1.25,
    "stabilityIncrement": 1.5,
    "initialStability": 1.0,
    "reviewThreshold": 0.7
  },
  "episodic": {
    "maxSessionLength": 180,
    "maxEpisodes": 1000,
    "importanceThreshold": 0.6
  },
  "modeDefault": "CLI",
  "enableHumanInLoop": true
}
```

## Architecture

```
src/
├── grpo-engine.ts          # GRPO optimization engine
├── ebbinghaus-memory.ts    # Ebbinghaus forgetting curve
├── episodic-memory.ts      # Session-based episodic memory
├── mode-switcher.ts        # LINE/CLI/GUI mode switching
└── vrchat-agent.ts         # Main VRChat control agent
```

## Integration

### With Evolution Engine

The GRPO engine can be integrated with the existing evolution engine for enhanced optimization.

### With Memory Manager

The episodic memory layer can sync with the SQLite memory backend for persistent storage.

### With VRChat Relay

The agent integrates with the VRChat Relay extension for OSC communication.

## License

MIT
