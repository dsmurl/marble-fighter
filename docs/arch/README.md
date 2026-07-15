[← Back to docs](../README.md)

# Architecture

Static architecture reference for Marble Fighter — what the system _is_, not how to operate it.
The game is an all-code Babylon.js scene with Havok physics: movement applies forces to rigid
bodies rather than moving meshes directly, so marbles collide and knock each other around. The
"fighter" mechanic is pushing the opponent marble off the circular platform (it's out when
`y < -6`).

## Module inventory

The runtime lives entirely under `src/`:

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | Boots `Game` against the `#renderCanvas` element. |
| `src/game/Game.ts` | Owns the engine/scene, initializes Havok physics, and runs the render loop. |
| `src/game/Arena.ts` | Builds the circular platform and scene lighting. |
| `src/game/Marble.ts` | Physics-driven sphere entity: roll force, jump impulse, grounded check. |
| `src/game/InputManager.ts` | Tracks held keys and exposes `-1..1` movement axes. |
| `src/game/TouchControls.ts` | On-screen joystick / buttons for mobile input. |
| `src/game/CameraRig.ts` | `ArcRotateCamera` configured as a follow camera. |
| `src/game/AIController.ts` | Opponent behavior — an intentionally dumb "charge the player" controller. |
| `src/game/Glove.ts` | Marble accessory / cosmetic attachment. |
| `src/game/Headwear.ts` | Marble accessory / cosmetic attachment. |
| `src/game/SoundEffects.ts` | Audio playback for game events. |
| `src/game/EndGameOverlay.ts` | End-of-round UI overlay. |

Physics is [Havok](https://www.npmjs.com/package/@babylonjs/havok) via `@babylonjs/havok`, loaded
as a wasm module in `Game.initPhysics()`. Havok pulls in a large slice of Babylon's module surface,
which is why the production build warns about a large chunk.

## Files

_None._

## Subdirectories

| Link | Description |
| --- | --- |
| [mechanisms/](mechanisms/README.md) | Per-mechanism design docs — mental model, ideation, and architectural reasoning for well-defined features/system parts. |

---

[← Back to docs](../README.md)
