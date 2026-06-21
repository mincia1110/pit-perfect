import type { PitStopSnapshot, ScoreBreakdown, TimingResult } from '../domain/types';

export class ScoreCalculator {
  calculate(snapshot: PitStopSnapshot, results: TimingResult[], syncBonus: number, baseElapsed = snapshot.elapsedTime): ScoreBreakdown {
    const judgementPenalty = results.reduce((sum, result) => sum + result.timePenalty, 0);
    const finalPitTime = Math.max(0, baseElapsed + judgementPenalty + snapshot.penalties - syncBonus);
    const operatorAccuracy = {
      A: this.accuracy(results.filter((result) => result.lane === 'A')),
      B: this.accuracy(results.filter((result) => result.lane === 'B')),
    };
    return {
      baseElapsed,
      judgementPenalty,
      mistakePenalty: snapshot.penalties,
      syncBonus,
      finalPitTime,
      operatorAccuracy,
      crewSync: Math.round(syncBonus * 1000),
    };
  }

  private accuracy(results: TimingResult[]): number {
    if (results.length === 0) return 0;
    const points = results.reduce((sum, result) => {
      if (result.judgement === 'PERFECT') return sum + 100;
      if (result.judgement === 'GREAT') return sum + 85;
      if (result.judgement === 'GOOD') return sum + 65;
      return sum + 25;
    }, 0);
    return Math.round(points / results.length);
  }
}
