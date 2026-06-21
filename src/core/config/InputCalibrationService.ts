import type { InputCalibration } from '../domain/types';

export class InputCalibrationService {
  constructor(private readonly storageKey = 'pit-perfect:calibration') {}

  read(): InputCalibration {
    if (typeof localStorage === 'undefined') return { offsetMs: 0 };
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return { offsetMs: 0 };
    try {
      const parsed = JSON.parse(raw) as Partial<InputCalibration>;
      return { offsetMs: Number(parsed.offsetMs) || 0 };
    } catch {
      return { offsetMs: 0 };
    }
  }

  write(calibration: InputCalibration): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(calibration));
  }
}
