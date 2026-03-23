# VRChat Avatar Parameter Registry (Hakua)

## Expression Parameters

| Name         | Type | Default | Used By                       | Notes              |
| ------------ | ---- | ------- | ----------------------------- | ------------------ |
| FX_Smile     | Bool | false   | `vrchat_autonomy_react`       | Joy reaction       |
| FX_Love      | Bool | false   | `vrchat_autonomy_react`       | Affection reaction |
| FX_Angry     | Bool | false   | `vrchat_autonomy_react`       | Angry reaction     |
| FX_Sad       | Bool | false   | `vrchat_autonomy_react`       | Sad reaction       |
| FX_Surprised | Bool | false   | `vrchat_autonomy_react`       | Surprise reaction  |
| VRCEmote     | Int  | 0       | Ghost Bridge / Guardian Pulse | Generic emote slot |

## Locomotion Control

| Intent      | OSC/Input              | Tool Path                                             | Reset Policy                     |
| ----------- | ---------------------- | ----------------------------------------------------- | -------------------------------- |
| Follow user | `/input/Vertical` (+1) | `vrchat_autonomy_react` -> `performMovementWithReset` | Auto-reset to `0` after duration |
| Short jump  | `/input/Jump`          | `vrchat_manual_move` / Ghost Bridge                   | Auto-reset after trigger         |

## Animator Transition Checklist

1. Add transitions from neutral to each `FX_*` state using bool true condition.
2. Add return transitions to neutral when each bool is false.
3. Keep transition duration at `0.05-0.15` for responsiveness.
4. Avoid controlling the same parameter from multiple animator layers.
