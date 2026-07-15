[← Back to docs](../README.md)

# How-To Guides

Procedural, task-oriented guides for working on Marble Fighter day to day — the "here's how you
actually do X" companion to the static reference in [arch/](../arch/README.md). Where an `arch/`
doc describes what a module is, a guide here walks through changing or extending it.

Some starting points, drawn from the project's "where to go from here" notes:

- **Add a new opponent behavior** — replace `AIController`'s straight-line charge with steering
  behaviors or a state machine.
- **Add arena hazards or ramps** — create a second physics shape with `MeshBuilder` +
  `PhysicsAggregate`, following the same pattern as the platform in `Arena.ts`.
- **Improve marble shading** — swap `StandardMaterial` for `PBRMaterial` for a glass/metal look.
- **Shrink the production bundle** — switch `@babylonjs/core` imports to the granular
  `@babylonjs/core/*` per-feature paths, or add code-splitting, to address the large-chunk warning.

## Files

_None._

## Subdirectories

_None._

---

[← Back to docs](../README.md)
