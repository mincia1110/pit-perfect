import type { GameCommand, TimingNote } from '../../core';

export class InputMapper {
  mapStart(): GameCommand {
    return 'START_RUN';
  }

  mapNote(note: Pick<TimingNote, 'lane'>): GameCommand {
    if (note.lane === 'A') return 'OPERATOR_A_PRESS';
    if (note.lane === 'B') return 'OPERATOR_B_PRESS';
    return 'CENTRAL_ACTION';
  }
}
