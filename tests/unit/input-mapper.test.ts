import { describe, expect, it } from 'vitest';
import { InputMapper } from '../../src/game/input/InputMapper';

describe('InputMapper', () => {
  const mapper = new InputMapper();

  it('maps direct timing targets to core commands', () => {
    expect(mapper.mapStart()).toBe('START_RUN');
    expect(mapper.mapNote({ lane: 'A' })).toBe('OPERATOR_A_PRESS');
    expect(mapper.mapNote({ lane: 'B' })).toBe('OPERATOR_B_PRESS');
    expect(mapper.mapNote({ lane: 'CENTER' })).toBe('CENTRAL_ACTION');
  });
});
