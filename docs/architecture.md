# Architecture

PIT//PERFECT is split into a Phaser-independent game core and a Phaser/HTML frontend.

## Core Boundary

`src/core` owns rules, state transitions, timing judgement, score calculation, deterministic sequence generation, calibration, and storage contracts. It has no import from Phaser, DOM layout, CSS, canvas, or browser input events.

The public frontend surface is `GameController`:

- `startGame(config)`
- `dispatch(command, timestamp)`
- `update(timestamp)`
- `pause()`
- `resume()`
- `restart()`
- `getSnapshot()`
- `subscribe(listener)`

## Frontend Boundary

`src/game` maps the current `PitStopSnapshot` into visuals and converts keyboard, mouse, and touch input into `GameCommand`. Phaser scenes never calculate score, pit time, judgement windows, or phase legality.

`src/ui` owns HTML/CSS menu, settings, calibration, pause, and result overlays. It reads snapshots and repository data, then calls `GameController`.

## Determinism

Game timing uses injected timestamps in seconds. Tests use manual timestamps. Given the same seed, config, and input times, the final snapshot is deterministic.

## Backend Extension

There is no server in the MVP. Scores are written via `ScoreRepository`; replacing `LocalScoreRepository` with a future remote implementation does not require game-core changes.
