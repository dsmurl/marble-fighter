[← Back to docs/arch](../README.md)

# Mechanisms

A mechanism is a small, well-defined feature or self-contained part of a system — specific enough
to name and scope in one sentence (e.g. a login mechanism, a matchmaking mechanism, a database-
cleanup mechanism). This directory is where mechanisms get documented as part of the standing
engineering cycle: when someone adds something new to the codebase, the expectation is that they
identify what mechanism(s) it introduces or touches, and that new mechanisms get compared against
existing ones and reviewed for compatibility before or alongside implementation.

Each mechanism doc serves two readers: an AI reviewing a future change (to this mechanism or one
that interacts with it), who needs the current mental model laid out plainly enough to check new
work against; and a human, who needs a narrative of what the mechanism is for, the ideation behind
it, and the reasoning behind its architecture from a code/system standpoint — not just what it does,
but why it was shaped the way it was.

New mechanism docs are user-initiated — created when the user says something like "I want to make a
new mechanism in this code," not inferred by scanning the codebase for features that look
mechanism-shaped. [control-mechanism.md](control-mechanism.md) is a worked example of the shape a
mechanism doc should take — read it first before writing a new one or reviewing a change to input,
movement, or combat.

## Files

| Link | Description |
| --- | --- |
| [control-mechanism.md](control-mechanism.md) | Movement, jump, and punch: how keyboard/touch input drives the physics-based marbles, and the design decisions baked into that. |
| [item-store-mechanism.md](item-store-mechanism.md) | Earning money by punching, localStorage-backed persistence, and a win-dialog store for permanent upgrades (longer spring, faster punch, hover halo). |

## Subdirectories

_None._

---

[← Back to docs/arch](../README.md)
