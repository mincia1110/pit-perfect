export interface Clock {
  now(): number;
}

export class AudioClock implements Clock {
  private readonly context: AudioContext | undefined;
  private readonly fallbackStart = performance.now() / 1000;

  constructor(context?: AudioContext) {
    this.context = context;
  }

  now(): number {
    return this.context?.currentTime ?? performance.now() / 1000 - this.fallbackStart;
  }
}

export class ManualClock implements Clock {
  private value = 0;

  now(): number {
    return this.value;
  }

  set(value: number): void {
    this.value = value;
  }

  advance(delta: number): void {
    this.value += delta;
  }
}
