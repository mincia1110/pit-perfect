import { describe, expect, it } from 'vitest';
import { defaultGameConfig, SeededSequenceGenerator } from '../../src/core';

describe('SeededSequenceGenerator', () => {
  it('is reproducible for the same seed', () => {
    const a = new SeededSequenceGenerator(42).buildNotes(defaultGameConfig, 1);
    const b = new SeededSequenceGenerator(42).buildNotes(defaultGameConfig, 1);
    expect(a).toEqual(b);
  });
});
