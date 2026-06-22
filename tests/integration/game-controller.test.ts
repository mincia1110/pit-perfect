import { describe, expect, it } from 'vitest';
import { configForDifficulty, GameController, type GameCommand } from '../../src/core';

describe('GameController integration', () => {
  it('starts a run without consuming the first timing note', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));

    controller.dispatch('START_RUN', 10);

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('ARRIVAL');
    expect(snapshot.notes[0]?.id).toBe('jack-up');
    expect(snapshot.notes[0]?.expectedTime).toBe(11);
  });

  it('plays a normal full pit stop and calculates final score', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    playAllNotes(controller);
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FINISHED');
    expect(snapshot.score?.finalPitTime).toBeGreaterThan(0);
    expect(snapshot.score?.operatorAccuracy.A).toBeGreaterThan(60);
    expect(snapshot.score?.operatorAccuracy.B).toBeGreaterThan(60);
  });

  it('blocks crossover before both first-side wheels complete and adds a penalty', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    run(controller, [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_A_PRESS', 2.26],
      ['CENTRAL_ACTION', 2.65],
    ]);
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FIRST_SIDE_SERVICE');
    expect(snapshot.penalties).toBeGreaterThan(0);
  });

  it('keeps Operator A and B wheel work independent', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    run(controller, [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_A_PRESS', 2.26],
    ]);
    const snapshot = controller.getSnapshot();
    expect(snapshot.wheels.FRONT_LEFT.step).toBe('DONE');
    expect(snapshot.wheels.REAR_LEFT.step).toBe('LOOSEN');
  });

  it('requires both operators before side movement', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    run(controller, [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_B_PRESS', 1.72],
      ['OPERATOR_A_PRESS', 2.26],
      ['CENTRAL_ACTION', 2.65],
    ]);
    expect(controller.getSnapshot().activeSide).toBe('LEFT');
  });

  it('adds early jack-down and unsafe release penalties', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    run(controller, [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_B_PRESS', 1.72],
      ['OPERATOR_A_PRESS', 2.26],
      ['OPERATOR_B_PRESS', 2.38],
      ['CENTRAL_ACTION', 2.65],
      ['CENTRAL_ACTION', 4.15],
      ['CENTRAL_ACTION', 4.52],
    ]);
    expect(controller.getSnapshot().penalties).toBeGreaterThanOrEqual(0.8);
  });

  it('calculates crew sync from operator completion deltas', async () => {
    const controller = new GameController();
    await controller.startGame(configForDifficulty('PRO', 7));
    run(controller, [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_B_PRESS', 1.72],
      ['OPERATOR_A_PRESS', 2.26],
      ['OPERATOR_B_PRESS', 2.28],
    ]);
    expect(controller.getSnapshot().events.some((event) => event.type === 'SYNC')).toBe(true);
  });

  it('is deterministic for same seed and input sequence', async () => {
    const inputs: Array<[GameCommand, number]> = [
      ['CENTRAL_ACTION', 1],
      ['OPERATOR_A_PRESS', 1.6],
      ['OPERATOR_B_PRESS', 1.72],
      ['OPERATOR_A_PRESS', 2.26],
      ['OPERATOR_B_PRESS', 2.38],
    ];
    const a = new GameController();
    const b = new GameController();
    await a.startGame(configForDifficulty('PRO', 9));
    await b.startGame(configForDifficulty('PRO', 9));
    run(a, inputs);
    run(b, inputs);
    expect(a.getSnapshot()).toEqual(b.getSnapshot());
  });
});

function run(controller: GameController, inputs: Array<[GameCommand, number]>): void {
  inputs.forEach(([command, timestamp]) => {
    controller.update(timestamp);
    controller.dispatch(command, timestamp);
  });
}

function playAllNotes(controller: GameController): void {
  controller.dispatch('CENTRAL_ACTION', 0);
  while (controller.getSnapshot().phase !== 'FINISHED') {
    const note = [...controller.getSnapshot().notes].sort((a, b) => a.expectedTime - b.expectedTime)[0];
    if (!note) throw new Error('No note available');
    const command: GameCommand = note.lane === 'A' ? 'OPERATOR_A_PRESS' : note.lane === 'B' ? 'OPERATOR_B_PRESS' : 'CENTRAL_ACTION';
    controller.update(note.expectedTime);
    controller.dispatch(command, note.expectedTime);
  }
}
