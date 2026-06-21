import type { GamePhase, PitSide, PitStopSnapshot, WheelPosition, WheelState } from '../domain/types';

const leftWheels: WheelPosition[] = ['FRONT_LEFT', 'REAR_LEFT'];
const rightWheels: WheelPosition[] = ['FRONT_RIGHT', 'REAR_RIGHT'];

export function createInitialSnapshot(seed: number, difficulty: PitStopSnapshot['difficulty']): PitStopSnapshot {
  return {
    seed,
    phase: 'READY',
    difficulty,
    elapsedTime: 0,
    activeSide: 'LEFT',
    wheels: {
      FRONT_LEFT: wheel('FRONT_LEFT', 'LEFT', 'A'),
      REAR_LEFT: wheel('REAR_LEFT', 'LEFT', 'B'),
      FRONT_RIGHT: wheel('FRONT_RIGHT', 'RIGHT', 'A'),
      REAR_RIGHT: wheel('REAR_RIGHT', 'RIGHT', 'B'),
    },
    notes: [],
    events: [],
    penalties: 0,
    combo: 0,
    segments: {},
    isPaused: false,
  };
}

export class PitStopStateMachine {
  canCrossover(snapshot: PitStopSnapshot): boolean {
    return leftWheels.every((position) => snapshot.wheels[position].step === 'DONE');
  }

  canJackDown(snapshot: PitStopSnapshot): boolean {
    return rightWheels.every((position) => snapshot.wheels[position].step === 'DONE');
  }

  canRelease(snapshot: PitStopSnapshot): boolean {
    return snapshot.phase === 'RELEASE';
  }

  nextPhase(current: GamePhase): GamePhase {
    const order: GamePhase[] = ['READY', 'ARRIVAL', 'BRAKING', 'JACK_UP', 'FIRST_SIDE_SERVICE', 'CROSSOVER', 'SECOND_SIDE_SERVICE', 'JACK_DOWN', 'RELEASE', 'FINISHED'];
    return order[Math.min(order.indexOf(current) + 1, order.length - 1)];
  }

  activeWheelPositions(side: PitSide): WheelPosition[] {
    return side === 'LEFT' ? leftWheels : rightWheels;
  }
}

function wheel(position: WheelPosition, side: PitSide, lane: 'A' | 'B'): WheelState {
  return { position, side, lane, step: 'LOOSEN' };
}
