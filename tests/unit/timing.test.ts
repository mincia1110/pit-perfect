import { describe, expect, it } from 'vitest';
import { defaultGameConfig, TimingEngine, type TimingNote } from '../../src/core';

const note: TimingNote = {
  id: 'n1',
  lane: 'A',
  action: 'LOOSEN',
  expectedTime: 10,
  wheel: 'FRONT_LEFT',
  phase: 'FIRST_SIDE_SERVICE',
};

describe('TimingEngine', () => {
  it('judges configured boundary values', () => {
    const engine = new TimingEngine();
    expect(engine.judge(note, 10.035, defaultGameConfig, 0).judgement).toBe('PERFECT');
    expect(engine.judge(note, 10.07, defaultGameConfig, 0).judgement).toBe('GREAT');
    expect(engine.judge(note, 10.12, defaultGameConfig, 0).judgement).toBe('GOOD');
    expect(engine.judge(note, 10.121, defaultGameConfig, 0).judgement).toBe('MISS');
  });

  it('applies input calibration before judgement', () => {
    const engine = new TimingEngine();
    const config = { ...defaultGameConfig, calibration: { offsetMs: -50 } };
    expect(engine.judge(note, 10.085, config, 0).judgement).toBe('PERFECT');
  });
});
