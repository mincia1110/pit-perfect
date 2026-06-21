import type { Difficulty, GameConfig } from '../domain/types';

export const defaultGameConfig: GameConfig = {
  seed: 1307,
  difficulty: 'PRO',
  timing: { perfectMs: 35, greatMs: 70, goodMs: 120 },
  sync: { perfectMs: 40, greatMs: 80, goodMs: 150 },
  penalties: {
    miss: 0.4,
    earlyCrossover: 0.7,
    earlyJackDown: 0.8,
    unsafeRelease: 0.9,
  },
  calibration: { offsetMs: 0 },
  autoCrossover: false,
};

export function configForDifficulty(difficulty: Difficulty, seed = defaultGameConfig.seed): GameConfig {
  const base: GameConfig = { ...defaultGameConfig, difficulty, seed };
  if (difficulty === 'ROOKIE') {
    return {
      ...base,
      timing: { perfectMs: 55, greatMs: 100, goodMs: 165 },
      autoCrossover: true,
    };
  }
  if (difficulty === 'ENDURANCE') {
    return {
      ...base,
      timing: { perfectMs: 24, greatMs: 52, goodMs: 92 },
      penalties: { ...base.penalties, miss: 0.55 },
    };
  }
  return base;
}

export function createDefaultConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    ...defaultGameConfig,
    ...overrides,
    timing: { ...defaultGameConfig.timing, ...overrides.timing },
    sync: { ...defaultGameConfig.sync, ...overrides.sync },
    penalties: { ...defaultGameConfig.penalties, ...overrides.penalties },
    calibration: { ...defaultGameConfig.calibration, ...overrides.calibration },
  };
}
