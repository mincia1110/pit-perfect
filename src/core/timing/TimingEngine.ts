import type { GameConfig, TimingJudgement, TimingNote, TimingResult } from '../domain/types';

export class TimingEngine {
  judge(note: TimingNote, actualTime: number, config: GameConfig, combo: number): TimingResult {
    const calibratedActual = actualTime + config.calibration.offsetMs / 1000;
    const offsetMs = Math.round((calibratedActual - note.expectedTime) * 1000);
    const abs = Math.abs(offsetMs);
    const judgement: TimingJudgement =
      abs <= config.timing.perfectMs
        ? 'PERFECT'
        : abs <= config.timing.greatMs
          ? 'GREAT'
          : abs <= config.timing.goodMs
            ? 'GOOD'
            : 'MISS';
    return {
      noteId: note.id,
      lane: note.lane,
      action: note.action,
      expectedTime: note.expectedTime,
      actualTime: calibratedActual,
      offsetMs,
      judgement,
      timePenalty: judgement === 'MISS' ? config.penalties.miss : judgement === 'GOOD' ? 0.08 : judgement === 'GREAT' ? 0.03 : 0,
      combo: judgement === 'MISS' ? 0 : combo + 1,
      wheel: note.wheel,
    };
  }
}
