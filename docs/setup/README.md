[← Back to docs](../README.md)

# Setup

Start here. This directory covers how to stand Marble Fighter up on your machine and get it
running locally, plus how to produce a deployable build. The project has no editor or IDE
lock-in — it's plain `.ts` files driven by Vite.

## Prerequisites

- Node.js (with [`pnpm`](https://pnpm.io/)). If you use [asdf](https://asdf-vm.com/), running
  `asdf install` from the repo root picks up the pinned Node and pnpm versions from
  [`.tool-versions`](../../.tool-versions).

## Run it locally

```bash
cd marble-fighter
pnpm install
pnpm dev
```

Then open the printed `localhost` URL. Vite hot-reloads as you edit files under `src/`.

## Build for deployment

```bash
pnpm build
```

This runs `tsc` and then `vite build`, producing a static `dist/` directory you can host on any
static file host. Use `pnpm preview` to serve that build locally and check it before deploying.

## Files

_None._

## Subdirectories

_None._

---

[← Back to docs](../README.md)
