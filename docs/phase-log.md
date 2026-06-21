# Phase Log

## Phase 1

- Completed: repository analysis, architecture direction, game rules, integration contract, scoring/deployment/rules notes.
- Major files: `docs/*`, `src/core/*`.
- Tests run: none in this phase.
- Remaining risks: none specific to architecture.
- Next phase: implement and test pure core modules.

## Phase 2

- Completed: pure TypeScript game core, timing engine, state machine, scoring, sync, penalties, calibration, local score repository, deterministic sequence generator.
- Major files: `src/core/*`, `tests/unit/*`, `tests/integration/*`.
- Tests run: `env CI=true pnpm test`.
- Remaining risks: tuning note timings for feel, not correctness.
- Next phase: implement Phaser and HTML/CSS frontend.

## Phase 3

- Completed: original visual direction assets, Phaser scenes, responsive layout service, timing rings tied to wheel positions, HTML/CSS menu/settings/result/touch overlay.
- Major files: `src/game/*`, `src/ui/*`, `src/assets/manifest.ts`, `public/assets/*`.
- Tests run: `env CI=true pnpm build`.
- Remaining risks: art is MVP placeholder quality and can be replaced through the manifest.
- Next phase: integrate real GameController.

## Phase 4

- Completed: frontend wired to `GameController`, keyboard/mouse/touch commands mapped through `InputMapper`, localStorage calibration and scores connected.
- Major files: `src/main.ts`, `src/ui/screens/AppOverlay.ts`, `src/game/scenes/PitStopScene.ts`.
- Tests run: `env CI=true pnpm test`, `env CI=true pnpm build`.
- Remaining risks: no production audio layer yet.
- Next phase: browser verification.

## Phase 5

- Completed: local Vite server, desktop Chrome smoke, mobile Chrome viewport smoke.
- Major files: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`.
- Tests run: `env CI=true pnpm test:e2e`.
- Remaining risks: Playwright uses installed system Chrome channel for local smoke.
- Next phase: final documentation and deployment setup.

## Phase 6

- Completed: README, deployment docs, GitHub Pages workflow, asset guide, lockfile and pnpm build approval settings.
- Major files: `README.md`, `docs/deployment.md`, `docs/assets.md`, `.github/workflows/pages.yml`, `pnpm-workspace.yaml`.
- Tests run: `env CI=true pnpm test`, `env CI=true pnpm build`, `env CI=true pnpm test:e2e`.
- Remaining risks: Phaser bundle is large enough to trigger Vite's chunk-size warning, acceptable for MVP.
- Next phase: tune game feel and replace placeholder art/audio.
