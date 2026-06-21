import type { Difficulty, InputCalibration, ScoreRepository, StoredScore } from '../domain/types';

export class LocalScoreRepository implements ScoreRepository {
  constructor(
    private readonly storageKey = 'pit-perfect:scores',
    private readonly calibrationKey = 'pit-perfect:calibration',
  ) {}

  async getBest(difficulty: Difficulty): Promise<StoredScore | undefined> {
    return (await this.list())
      .filter((score) => score.difficulty === difficulty)
      .sort((a, b) => a.score.finalPitTime - b.score.finalPitTime)[0];
  }

  async save(score: StoredScore): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    const scores = await this.list();
    scores.push(score);
    localStorage.setItem(this.storageKey, JSON.stringify(scores.slice(-25)));
  }

  async list(): Promise<StoredScore[]> {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as StoredScore[]) : [];
    } catch {
      return [];
    }
  }

  async getCalibration(): Promise<InputCalibration> {
    if (typeof localStorage === 'undefined') return { offsetMs: 0 };
    const raw = localStorage.getItem(this.calibrationKey);
    if (!raw) return { offsetMs: 0 };
    try {
      return JSON.parse(raw) as InputCalibration;
    } catch {
      return { offsetMs: 0 };
    }
  }

  async saveCalibration(calibration: InputCalibration): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.calibrationKey, JSON.stringify(calibration));
  }
}

export interface RemoteScoreRepositoryContract extends ScoreRepository {
  readonly endpoint: string;
}
