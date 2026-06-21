# Scoring

Final pit time is calculated by `ScoreCalculator`.

```text
finalPitTime = baseElapsed + judgementPenalty + mistakePenalty - syncBonus
```

Judgement windows are configurable:

- `PERFECT`: 35ms
- `GREAT`: 70ms
- `GOOD`: 120ms
- `MISS`: beyond good

Crew sync compares the two operator completion times for each side. The default thresholds are:

- `PERFECT_SYNC`: 40ms
- `GREAT_SYNC`: 80ms
- `GOOD_SYNC`: 150ms
