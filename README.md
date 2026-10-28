# Marble Fighter

A minimal, all-code 3D marble battle prototype: TypeScript + Vite + Babylon.js + Havok physics.
No editor, no IDE lock-in — everything is plain `.ts` files you (or an AI) can edit directly.

**[Try the live demo](https://marble-fighter.vercel.app/)** — no install, runs in the browser.

## Setup

```bash
cd marble-fighter
pnpm install
pnpm dev
```

Then open the printed `localhost` URL. `pnpm build` produces a static `dist/` you can host anywhere.

## Controls

- **WASD / Arrow keys** — roll the marble (movement is camera-relative)
- **Space** — jump (has a short coyote-time window)
- **Mouse drag** — orbit the camera, **scroll** — zoom

## How it's put together

```
index.html            canvas + minimal HUD
src/main.ts            boots Game against #renderCanvas
src/game/
  Game.ts               owns the engine/scene, physics init, and the render loop
  Arena.ts               builds the circular platform + lighting
  Marble.ts              physics-driven sphere entity (roll force, jump impulse, grounded check)
  InputManager.ts         tracks held keys, exposes -1..1 axes
  CameraRig.ts            ArcRotateCamera configured as a follow cam
  AIController.ts         intentionally dumb "charge the player" opponent
```

Physics is [Havok](https://www.npmjs.com/package/@babylonjs/havok) via `@babylonjs/havok`,
loaded as a wasm module in `Game.initPhysics()`. Movement applies forces to a rigid body rather
than moving the mesh directly, so marbles collide and knock each other around believably —
that's the whole "fighter" mechanic: push the opponent marble off the platform (`y < -6`).

## Where to go from here

- Multiple opponents / a real round system → currently `Game.endRound()` just `alert()`s and stops.
- Replace `AIController`'s straight-line charge with steering behaviors or a state machine.
- Swap `StandardMaterial` for `PBRMaterial` if you want more realistic marble shading (glass/metal look).
- Havok pulls in a good chunk of Babylon's full module surface, which is why the production build
  warns about a large chunk. If that matters, switch imports from `@babylonjs/core` to the more
  granular `@babylonjs/core/*` paths per-feature, or add code-splitting.
- Add a second physics shape for arena hazards/ramps via `MeshBuilder` + `PhysicsAggregate`, same
  pattern as the platform in `Arena.ts`.
