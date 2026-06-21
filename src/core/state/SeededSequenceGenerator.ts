import type { GameConfig, TimingNote } from '../domain/types';

export class SeededSequenceGenerator {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  buildNotes(config: GameConfig, startTime: number): TimingNote[] {
    const tempo = config.difficulty === 'ROOKIE' ? 0.72 : config.difficulty === 'ENDURANCE' ? 0.48 : 0.6;
    const stagger = 0.08 + this.next() * 0.08;
    return [
      { id: 'jack-up', lane: 'CENTER', action: 'JACK', expectedTime: startTime + 1.0, phase: 'JACK_UP' },
      { id: 'left-front-loosen', lane: 'A', action: 'LOOSEN', expectedTime: startTime + 1.0 + tempo, wheel: 'FRONT_LEFT', phase: 'FIRST_SIDE_SERVICE' },
      { id: 'left-rear-loosen', lane: 'B', action: 'LOOSEN', expectedTime: startTime + 1.0 + tempo + stagger, wheel: 'REAR_LEFT', phase: 'FIRST_SIDE_SERVICE' },
      { id: 'left-front-tighten', lane: 'A', action: 'TIGHTEN', expectedTime: startTime + 1.0 + tempo * 2.1, wheel: 'FRONT_LEFT', phase: 'FIRST_SIDE_SERVICE' },
      { id: 'left-rear-tighten', lane: 'B', action: 'TIGHTEN', expectedTime: startTime + 1.0 + tempo * 2.1 + stagger, wheel: 'REAR_LEFT', phase: 'FIRST_SIDE_SERVICE' },
      { id: 'crossover', lane: 'CENTER', action: 'CROSSOVER', expectedTime: startTime + 1.0 + tempo * 2.75, phase: 'CROSSOVER' },
      { id: 'right-front-loosen', lane: 'A', action: 'LOOSEN', expectedTime: startTime + 1.0 + tempo * 3.55, wheel: 'FRONT_RIGHT', phase: 'SECOND_SIDE_SERVICE' },
      { id: 'right-rear-loosen', lane: 'B', action: 'LOOSEN', expectedTime: startTime + 1.0 + tempo * 3.55 + stagger * 1.2, wheel: 'REAR_RIGHT', phase: 'SECOND_SIDE_SERVICE' },
      { id: 'right-front-tighten', lane: 'A', action: 'TIGHTEN', expectedTime: startTime + 1.0 + tempo * 4.62, wheel: 'FRONT_RIGHT', phase: 'SECOND_SIDE_SERVICE' },
      { id: 'right-rear-tighten', lane: 'B', action: 'TIGHTEN', expectedTime: startTime + 1.0 + tempo * 4.62 + stagger * 1.2, wheel: 'REAR_RIGHT', phase: 'SECOND_SIDE_SERVICE' },
      { id: 'jack-down', lane: 'CENTER', action: 'JACK', expectedTime: startTime + 1.0 + tempo * 5.25, phase: 'JACK_DOWN' },
      { id: 'release', lane: 'CENTER', action: 'RELEASE', expectedTime: startTime + 1.0 + tempo * 5.86, phase: 'RELEASE' },
    ];
  }
}
