import type { GameConfig } from '../domain/types';

export class PenaltyCalculator {
  earlyCrossover(config: GameConfig): number {
    return config.penalties.earlyCrossover;
  }

  earlyJackDown(config: GameConfig): number {
    return config.penalties.earlyJackDown;
  }

  unsafeRelease(config: GameConfig): number {
    return config.penalties.unsafeRelease;
  }
}
