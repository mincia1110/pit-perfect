import { describe, expect, it, vi } from 'vitest';
import { InputCalibrationService, LocalScoreRepository } from '../../src/core';

describe('storage adapters', () => {
  it('handles missing localStorage', async () => {
    const original = globalThis.localStorage;
    vi.stubGlobal('localStorage', undefined);
    expect(new InputCalibrationService().read()).toEqual({ offsetMs: 0 });
    expect(await new LocalScoreRepository().list()).toEqual([]);
    vi.stubGlobal('localStorage', original);
  });
});
