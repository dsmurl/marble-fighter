[← Back to docs/arch/mechanisms](./README.md)

# Control Mechanism (Movement, Jump, Punch)

How the player (and the AI opponent, for punch/movement decisions if not input) drives a marble
around the arena: rolling, jumping, and throwing a punch, across both keyboard/mouse and touch.
Spans [`InputManager.ts`](../../../src/game/InputManager.ts),
[`TouchControls.ts`](../../../src/game/TouchControls.ts),
[`CameraRig.ts`](../../../src/game/CameraRig.ts), [`Glove.ts`](../../../src/game/Glove.ts),
[`Marble.ts`](../../../src/game/Marble.ts) (the force/impulse methods), and
`Game.handlePlayerInput`/`Game.registerPunchInput` in [`Game.ts`](../../../src/game/Game.ts), which
is where all of the above gets wired together per frame.

## What it is

Three player actions, each with its own input path that converges on the same physics body:

- **Roll** — `KeyW/A/S/D` or arrow keys on desktop, an on-screen joystick on touch. Produces a
  `-1..1` forward/right axis pair, rotated to be camera-relative, then applied to the marble as a
  continuous **force** (`Marble.applyRollForce`) — not a velocity or position override.
- **Jump** — `Space` on desktop, a dedicated on-screen button on touch. A one-shot **impulse**
  (`Marble.applyJumpImpulse`), gated by grounded state with a coyote-time grace window.
- **Punch** — left mouse click on desktop, a tap anywhere else on the canvas on touch. Throws a
  glove ([`Glove.ts`](../../../src/game/Glove.ts)) that extends toward the pointer/tap's ground
  position, animates through `extending → retracting → idle`, and applies a knockback impulse to
  whatever it hits during the extend phase.

## Mental model (read this before changing or adding an input)

This is the load-bearing design baked into the current implementation. A future mechanism that
touches input, movement, or combat should be checked against these points before changing one
without touching the others.

1. **All input funnels through one held/edge abstraction.** `InputManager` tracks raw key state
   (`isDown`) and up→down edges (`wasJustPressed`) for *any* key code, real or virtual. Touch input
   does not have a parallel code path — `TouchControls`' jump button calls
   `input.simulateKeyPress("Space")`, injecting a virtual edge into the exact same state machine a
   real `Space` keydown would produce. **Any new input device (e.g. a gamepad) should feed into this
   same abstraction** (either literally through `InputManager`, or by exposing the same
   `isDown`/`wasJustPressed`/`getAxis` shape) rather than adding a third parallel branch to
   `Game.handlePlayerInput`.

2. **Roll and touch axes are alternatives, not additive.** `handlePlayerInput` picks the movement
   axis with `this.input.getAxis(...) || this.input.getAxis(...) || this.touchControls.forwardAxis`
   — the first non-zero source wins; sources are never summed. This is safe today because a device
   produces input from exactly one source at a time in practice (a touch user has no keyboard). If
   a future feature makes combined input possible (e.g. testing on a touch-enabled laptop with a
   keyboard attached), this silently drops one of the two instead of blending them — worth revisiting
   before relying on multi-source input.

3. **Movement is a force, not a teleport, deliberately.** Every marble in the arena is a Havok rigid
   body; `applyRollForce`/`applyJumpImpulse`/`applyPunchImpulse` all push the body rather than move
   the mesh, so momentum, collisions, and being knocked around all fall out of the physics engine for
   free. Any new movement-adjacent mechanism (a dash, a dodge, a hazard that shoves the marble) should
   extend this same force/impulse vocabulary on `Marble` rather than introducing a direct
   `mesh.position` write — direct writes fight the physics step (see the `disablePreStep` dance in
   `Marble.reset`, which exists precisely because position writes are normally ignored).

4. **Jump is edge-triggered on purpose, and the impulse strength is calibrated around firing exactly
   once per press.** `wasJustPressed("Space")` is used instead of `isDown` specifically so that
   holding the key down doesn't restack a jump impulse every frame the ball is still grounded/coyote-
   eligible before physics has lifted it off. `JUMP_IMPULSE` in `Game.ts` was tuned on the premise
   that this invariant holds. Swapping to `isDown`-based jumping without re-deriving the impulse
   value would change jump height/feel.

5. **Coyote time is a property of the marble, not the input.** `Marble.canJump(now, coyoteMs=120)`
   tracks its own `lastGroundedAt`, independent of `InputManager`. Grounded state itself is computed
   once per frame in `Game.updateGrounded` via a downward raycast against the arena platform mesh
   specifically — a marble is never "grounded" against anything else.

6. **Movement is always camera-relative, and the camera can't be reoriented by the player.**
   `CameraRig` removes `ArcRotateCamera`'s default pointer-drag orbit input entirely — "forward"
   always means "away from the fixed camera," and the only camera control left is scroll-wheel zoom.
   This is why movement math in `handlePlayerInput` projects the camera's forward vector onto the XZ
   plane rather than reading a player-controlled yaw. If the camera ever becomes player-rotatable,
   this movement code — and point 7 below — need to be revisited together.

7. **Punch aiming is a flat, horizontal-plane direction, not a raw 3D pointer direction.** The punch
   direction is computed by intersecting the camera's pick ray with a horizontal plane at the
   *player's own height* (`pointerGroundDirectionFromPlayer` in `Game.ts`), then flattening `y` to 0.
   This means punches always aim along the arena's horizontal plane regardless of camera pitch or
   where vertically you clicked on the opponent — consistent with the arena being effectively a 2D
   fighting surface where the win condition is falling off (`y < -6`), not being hit in a particular
   spot.

8. **Punch and movement are on physically separate input devices/surfaces by design, so they never
   compete for the same gesture.** Desktop: keys drive movement, the mouse is dedicated to punching
   (mouse-drag camera orbit was removed specifically to free the mouse up for this). Touch: the
   joystick and jump button are their own DOM elements positioned outside the canvas, so a joystick
   drag or a jump-button tap never reaches the canvas underneath to also register as a punch tap —
   this is a DOM hit-testing property, not something enforced in code, so it would silently break if
   a future touch control were added *on top of* the canvas instead of beside it.

9. **A punch can't be interrupted or re-thrown mid-swing.** `Glove.canPunch()` is only true in the
   `idle` state, so the punch "cooldown" is really just "however long the current animation takes to
   finish" (`EXTEND_DURATION_MS` + `RETRACT_DURATION_MS`), not a separate timer. A hit is latched to
   at most once per punch (`hasHitThisPunch`) and can only land during the `extending` phase.

## Ideation and reasoning (for a human reading this cold)

The core idea driving all three actions is: **the player never directly controls position — only
forces on a physics body.** This was chosen up front so that the marble-knockback fighting mechanic
(win by knocking the opponent off the platform) falls naturally out of Havok's collision resolution
instead of needing bespoke knockback code — a punch, a roll into an opponent, and falling off an edge
are all just "physics happened to this rigid body," not three separately-coded outcomes.

The **single input abstraction** (`InputManager`'s held/edge/axis API) exists so that adding touch
support didn't require duplicating the desktop control logic. Instead of `Game.ts` branching on "is
this a touch device," `TouchControls` translates touch gestures into the same primitives desktop
input already produces (a virtual key-press edge for jump; a raw axis pair for the joystick, shaped
identically to `InputManager.getAxis`'s `-1..1` range). The intent is that `handlePlayerInput` reads
as device-agnostic, and it mostly does — the one seam is the `||` fallback chain (point 2 above),
which was an acceptable shortcut because no supported device produces two input sources at once,
not because combining sources was considered and rejected.

**Movement and punch were deliberately split across two separate input surfaces** (keys vs. mouse on
desktop; joystick+button vs. canvas-tap on touch) rather than, say, both living on a stick-plus-button
scheme or both being taps. This was a UX call: punching is aimed ("throw it *there*"), so it needed a
pointing gesture (click/tap a location), while rolling is directional-and-continuous, so it needed a
holdable directional input (keys/joystick). The camera's orbit control was sacrificed specifically so
the mouse could be repurposed for punch-aiming without splitting attention between "click to orbit"
and "click to punch."

**Jump's edge-triggering and coyote time** exist for feel, not correctness — the "just pressed" check
avoids feeling like the jump button is unresponsive if held slightly too long into landing, and the
120ms coyote window forgives the extremely common case of pressing jump a beat after visually leaving
a ledge. Both were arrived at by feel/testing rather than derived from a formula, which is why the
mechanism doc calls out the specific numbers (`120ms`, `JUMP_IMPULSE = 8.95`) as calibrated constants,
not incidental defaults — changing them changes how the game feels, not just how it behaves.

**Punch's flattened, plane-based aiming** reflects that this is fundamentally a 2D fighting game
rendered in 3D: height only matters for falling off, never for where a punch can land. Aiming at a
literal 3D point (e.g. the exact pixel the ball model appears under, which could be "in the air"
relative to the arena) would make punches miss in ways that feel arbitrary to a player who's reasoning
about the game as top-down positioning. Flattening the aim to the player's own height plane keeps
punch-throwing legible regardless of camera pitch or opponent height differences.

## Where this could go next

Any of the following would be a **new mechanism to compare against this one**, not a silent extension
of it — per the top-level [Mechanisms](../README.md) convention, design them out here and check
compatibility with the points above before building:

- A rebindable-keys / settings mechanism — `InputManager` explicitly says "no key-mapping config, no
  rebinding UI" is out of scope today.
- A gamepad input mechanism — needs to decide whether it feeds into `InputManager` directly or
  becomes a fourth axis source alongside touch in `handlePlayerInput`'s fallback chain (and whether
  that fallback chain still makes sense with a fourth source).
- A combo/charge-punch mechanism — would need to renegotiate point 9 (no mid-swing interruption) and
  probably point 7 (flat aiming) if charge implies a different throw arc.

---

[← Back to docs/arch/mechanisms](./README.md)
