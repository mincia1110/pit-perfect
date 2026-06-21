# PIT//PERFECT

Original hypercar pit-stop rhythm time-attack MVP for desktop and mobile browsers.

## Run Locally

```bash
pnpm install
pnpm dev
```

The local dev server binds to `127.0.0.1` by default.

## Verify

```bash
pnpm test
pnpm build
pnpm test:e2e
```

## Controls

- `F`: Operator A front-wheel action
- `J`: Operator B rear-wheel action
- `Space`: jack, crossover, or release action
- `Esc`: pause
- Mouse/touch: tap the left, right, or center input zones

The MVP uses a serverless static architecture. Scores, best times, options, and input calibration are stored in `localStorage` through a repository interface that can later be swapped for a remote leaderboard implementation.

## Deployment

The Vite base path is `./`, so GitHub Pages subpaths load assets correctly. Pushes to `main` deploy through `.github/workflows/pages.yml`.
