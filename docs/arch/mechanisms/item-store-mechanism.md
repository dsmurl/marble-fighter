[← Back to docs/arch/mechanisms](./README.md)

# Item Store Mechanism (Money, Persistence, Purchasable Upgrades)

**Status: proposed / not yet implemented.** This doc is written ahead of code per the
[Mechanisms](../README.md) convention — new mechanisms get designed and checked for compatibility
against existing ones before or alongside implementation, not documented after the fact. Treat the
"Mental model" section below as the target design an implementation should be checked against, and
update it if the implementation ends up deviating.

Will span a new `Store.ts` (localStorage-backed money/inventory state), changes to
[`Game.ts`](../../../src/game/Game.ts) (awarding money on a landed player punch, applying owned-item
effects to the player's [`Marble`](../../../src/game/Marble.ts)/[`Glove`](../../../src/game/Glove.ts)),
[`EndGameOverlay.ts`](../../../src/game/EndGameOverlay.ts) (rendering the store inside the win dialog),
and `index.html` (HUD money readout, top-right reset button, store markup/styles).

## What it is

A persistent, single-player meta-progression layer on top of a round: the player earns money by
landing punches on the opponent, and spends it between rounds on permanent upgrades.

- **Earning** — every time the *player's* glove lands a hit on the opponent (the existing
  `onHit` callback in `Glove.update`, wired in `Game.registerLoop`), the player gets **+$5**. The
  opponent (AI) never earns or spends money — this is a player-only progression system, not a
  symmetric game rule.
- **Storage** — money and owned items live in the browser's `localStorage`, under the single key
  `marble-fighter:store`, as one JSON blob: `{ "money": number, "ownedItems": string[] }`. Item ids
  are the kebab-case slugs `"long-spring"`, `"coffee"`, `"halo"` — the same three names used
  throughout this doc — chosen so the raw value is self-describing if a human ever inspects it in
  devtools. No backend, no schema migrations, no version field — this is deliberately the simplest
  thing that qualifies as persistence; see point 1.
- **Display** — current money is always visible in the on-screen HUD (`#hud`), the same corner
  that already shows controls text.
- **Reset** — a small gray button fixed to the top-right corner clears the stored money and owned
  items back to defaults, behind a native `confirm()` prompt (one click of insurance against an
  accidental misclick erasing progress — the "keep it simple" brief covers the storage mechanism,
  not the UX guardrail around destroying it). It resets *only* this store data, nothing else about
  the game.
- **Spending** — the store UI lives inside the existing win dialog (`EndGameOverlay`), shown only
  on the `"win"` outcome. It lists exactly three items, each a one-time permanent purchase: once
  bought, an item's card visibly darkens and can't be bought again (the player's money is the only
  gate on affording it; owning it is a separate, permanent gate on buying it twice). A single visit
  to the store (one win) can buy more than one item, as long as money covers each purchase in turn —
  it's a shop, not a one-pick-per-win offer.

### The three items

All three cost a flat **$20** — simple and uniform rather than tiered by perceived power.

| Item | Effect | Mechanism touched |
| --- | --- | --- |
| **Long Spring** | Doubles the glove's reach — both the visible spring length and the punch's travel distance. | `Glove` (`reach`, spring mesh geometry) |
| **Coffee** | Doubles punch speed — the extend/retract animation (and thus the effective punch cadence) runs in half the time. | `Glove` (`EXTEND_DURATION_MS`/`RETRACT_DURATION_MS`) |
| **Halo** | A halo that floats above the player's marble. While owned, holding `Space` lets the marble hang motionless at the very top of a jump for as long as `Space` stays held. | New cosmetic in the style of [`Headwear.ts`](../../../src/game/Headwear.ts); apex-gated zero-gravity hold on `Marble`/`Game.ts` |

## Mental model (read this before changing or extending the store)

This is the target design; an implementation (or a later feature) that touches money, persistence,
or any of the three items should be checked against these points.

1. **The store is a thin wrapper around one `localStorage` key, not a generic database.** The exact
   shape, settled during ideation: key `marble-fighter:store`, value
   `{ "money": number, "ownedItems": string[] }`, where `ownedItems` holds a subset of the three
   fixed id strings `"long-spring"`, `"coffee"`, `"halo"` (an array, not an id→boolean map — with
   only three possible values, `.includes()` is simpler to read and debug than a map, and an empty
   array is a self-evident "nothing owned" state for reset). Read once at startup and rewritten on
   every change. No IndexedDB, no per-field keys, **no version field** — this is intentional given
   the "keep it simple" brief; if the shape ever needs to grow (e.g. per-item metadata, purchase
   history), that's a deliberate migration (bump the key name, e.g. `marble-fighter:store:v2`, and
   let old data be abandoned) rather than an incremental field add or an in-place migration path.

2. **Money is earned by exactly one event: the player's glove landing a hit.** It hooks the same
   `onHit` callback in `Glove.update` that already applies knockback impulse and plays the hit
   sound (`Game.ts`'s `this.playerGlove.update(...)` call) — not a new detection path. The
   opponent's glove (`this.opponentGlove.update(...)`) never touches the store. This keeps the
   store from becoming a second combat-outcome system that has to stay in sync with the physics-
   based knockback one described in [control-mechanism.md](./control-mechanism.md).

3. **Owned items are permanent and player-only; the AI opponent is never affected.** An item, once
   bought, applies for the rest of the browser session (until the reset button is pressed) — it is
   read from the store and applied to `this.player`'s `Marble`/`Glove`, never `this.opponent`'s.
   This keeps the AI's balance/tuning (`AIController.ts`) decoupled from player progression.

4. **The store UI only ever appears on a win, and only lists what's still unowned-or-affordable
   as active.** `EndGameOverlay.show("win", ...)` renders the three item cards; `show("lose", ...)`
   never does. A card for an already-owned item is rendered darkened/disabled permanently; a card
   for an item the player can't yet afford is disabled until they have enough money (this is the
   "wait, come back richer" loop, not a one-shot offer that disappears if declined). Buying an item
   deducts its price immediately and re-evaluates affordability for the remaining cards in the same
   dialog — a player who wins with $40 can buy two $20 items in one visit, not just one.

5. **Item effects are applied by *parameterizing* the existing mechanisms, not branching them.**
   `Glove` already derives `reach` from `ballRadius` in its constructor and hardcodes
   `EXTEND_DURATION_MS`/`RETRACT_DURATION_MS` as module constants. Long Spring and Coffee become
   multipliers passed into `Glove`'s constructor (read from the store when `Game.buildScene`/
   `resetRound` constructs or reconfigures the player's glove), not an `if (ownsLongSpring)` branch
   scattered through `Glove.update`. This mirrors how `control-mechanism.md` treats new
   movement-adjacent features — extend the existing vocabulary (`reach`, duration constants)
   instead of forking the code path.

6. **Halo's hover only triggers at the jump's apex, not for the whole time airborne — it's a hang,
   not a flight.** The apex is the instant the marble's vertical velocity crosses from rising
   (`vy > 0`) to falling (`vy <= 0`). If `Space` is held (`input.isDown`, not edge-triggered like
   the initial jump — see control-mechanism.md point 4, which this deliberately does *not* reuse,
   since hover is a hold-to-sustain effect) at/through that instant **and** the player owns the
   halo item, the marble's vertical velocity is pinned to zero and its effective gravity is zeroed
   for as long as `Space` stays held — it hangs motionless in midair at that exact height. Releasing
   `Space` (or never holding it at the apex) immediately restores normal gravity and the marble
   resumes falling from wherever it is. Per
   [control-mechanism.md point 3](./control-mechanism.md) ("movement is a force, not a teleport"),
   this should still be expressed as a physics-body property (a per-frame gravity cancel while held,
   e.g. a gravity-factor toggle or a per-frame counter-force) rather than a raw `mesh.position`
   freeze, so collisions and the eventual fall still fall out of Havok once released. Deliberately
   scoped this narrow — a full "hold Space anywhere in the air to float" ability would let the
   player camp indefinitely above the arena, which conflicts with the ring-out win condition
   (`checkRingOut`, `y < -6`) reading as a race to the bottom, not a stalling contest.

## Ideation and reasoning (for a human reading this cold)

The core idea is a lightweight risk/reward loop layered on top of a game that otherwise resets
completely every round: normally nothing about a round persists (`resetRound` puts both marbles
back at their start positions and clears `roundOver`), so the store is the *first* thing in the
game with state that survives a reset-round, deliberately fenced off into its own storage key and
its own reset button so it doesn't get entangled with round-reset logic.

**Money comes from punching, not winning**, so a player who's mechanically good at landing hits
but loses the round anyway still progresses — the reward is tied to the skill expressed
mid-fight, not just the binary outcome. This also means the store naturally only prompts a
purchase decision at the moment the player has just demonstrated they can win (the store shows on
the win dialog), which is a good moment to offer an upgrade rather than interrupting the loss flow.

**All three items were chosen to extend a mechanism that already exists** rather than invent new
systems: Long Spring and Coffee are pure parameter tweaks to `Glove` (reach and animation speed
are already tunable numbers, just currently hardcoded), and Halo extends the same force/impulse
vocabulary that jump already uses. None of the three needed new physics primitives, new input
devices, or new win/lose conditions — they're reskins of numbers the codebase already has.

**LocalStorage-as-database was chosen over anything heavier** because this is a client-only game
with no server component anywhere else in the codebase (checked — there's no backend directory,
no API calls). Introducing a real database or even IndexedDB for a single number and a 3-element
list would be solving a problem the project doesn't have. The tradeoff being knowingly accepted:
progress is per-browser, per-device, clearable by the user's own browser settings (not just the
in-game reset button) — acceptable for a small game, worth reconsidering if this ever needs
cross-device accounts.

## Decisions made

Flagged back to the user during ideation rather than guessed at silently:

- **Pricing**: flat $20 per item (not tiered by perceived power) — 4 punches' worth each.
- **Multi-purchase**: a single win-dialog visit can buy more than one item, as long as money
  covers each in turn.
- **Reset**: gated behind a native `confirm()` prompt.
- **Halo hover**: apex-only — zero gravity/pinned velocity only while `Space` is held *at* the
  jump's peak, not for the whole airborne duration. See mental-model point 6.
- **Coffee**: halves *both* `EXTEND_DURATION_MS` and `RETRACT_DURATION_MS` — the whole punch cycle
  runs in half the time, not just the jab-out. This is the literal reading of "punches twice as
  fast," and it's the only one of the three items whose effect is otherwise invisible if the
  retract half isn't also sped up (the player wouldn't feel the second half of every punch as
  faster, only the first).
- **Storage schema**: key `marble-fighter:store`, value `{ "money": number, "ownedItems": string[] }`,
  item ids are the kebab-case slugs `"long-spring"` / `"coffee"` / `"halo"`, no schema-version field.
  See mental-model point 1.

All open design questions from ideation are now resolved; no unresolved items remain as of this
writing.

## Where this could go next

Any of the following would be a **new mechanism to compare against this one**, not a silent
extension of it, per the top-level [Mechanisms](../README.md) convention:

- More than three items, or item tiers/upgrades (e.g. a second, more expensive spring tier) —
  would need the store UI to scroll/paginate rather than a fixed 3-card layout.
- Making the AI opponent also earn/spend money — would break point 3 above and needs its own
  balance pass in `AIController.ts`.
- Any server-backed persistence (accounts, leaderboards) — would replace the localStorage-as-
  database approach entirely, not extend it.

---

[← Back to docs/arch/mechanisms](./README.md)
