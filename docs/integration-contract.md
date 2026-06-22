# Integration Contract

Frontend code must import from `src/core` public exports and use `GameController` only for gameplay decisions.

## Commands

- `START_RUN`
- `OPERATOR_A_PRESS`
- `OPERATOR_A_RELEASE`
- `OPERATOR_B_PRESS`
- `OPERATOR_B_RELEASE`
- `CENTRAL_ACTION`
- `PAUSE`

Keyboard, mouse, and touch inputs must be mapped into these commands by `InputMapper`.

## Snapshot

`PitStopSnapshot` includes current phase, elapsed time, active side, wheel progress, queued notes, recent events, penalty totals, crew sync, final score, and result fields.

The frontend may render timing rings from snapshot notes, but it must not create its own hidden timing model.
