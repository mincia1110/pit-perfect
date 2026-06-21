import type { GameConfig, SyncJudgement } from '../domain/types';

export class SyncCalculator {
  judge(deltaMs: number, config: GameConfig): { judgement: SyncJudgement; bonus: number; score: number } {
    const abs = Math.abs(deltaMs);
    if (abs <= config.sync.perfectMs) return { judgement: 'PERFECT_SYNC', bonus: 0.12, score: 100 };
    if (abs <= config.sync.greatMs) return { judgement: 'GREAT_SYNC', bonus: 0.07, score: 85 };
    if (abs <= config.sync.goodMs) return { judgement: 'GOOD_SYNC', bonus: 0.03, score: 70 };
    return { judgement: 'NO_SYNC', bonus: 0, score: 45 };
  }
}
