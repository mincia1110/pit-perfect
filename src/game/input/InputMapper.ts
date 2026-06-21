import type { GameCommand } from '../../core';

export class InputMapper {
  mapKey(code: string): GameCommand | undefined {
    if (code === 'KeyF') return 'OPERATOR_A_PRESS';
    if (code === 'KeyJ') return 'OPERATOR_B_PRESS';
    if (code === 'Space') return 'CENTRAL_ACTION';
    if (code === 'Escape') return 'PAUSE';
    return undefined;
  }

  mapZone(zone: 'left' | 'center' | 'right'): GameCommand {
    if (zone === 'left') return 'OPERATOR_A_PRESS';
    if (zone === 'right') return 'OPERATOR_B_PRESS';
    return 'CENTRAL_ACTION';
  }
}
