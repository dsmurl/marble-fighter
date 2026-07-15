[← Back to docs](../README.md)

# Testing

Testing strategy and the current state of the test suite for Marble Fighter.

**Current state:** there is no automated test suite yet. `package.json` defines only `dev`,
`build`, and `preview` scripts, and `npm run build` (which runs `tsc`) is the closest thing to a
gate — it will fail the build on type errors. Verification today is manual: run `npm run dev` and
play the game.

When automated tests are added, document the framework, how to run them, and what they cover here.

## Files

_None._

## Subdirectories

_None._

---

[← Back to docs](../README.md)
