import { defaultGameConfig } from './config/defaultConfig';
import type { GameCommand, GameConfig, PitStopEvent, PitStopSnapshot, ScoreRepository, TimingNote, TimingResult, WheelPosition } from './domain/types';
import { ScoreCalculator } from './scoring/ScoreCalculator';
import { SyncCalculator } from './scoring/SyncCalculator';
import { PenaltyCalculator } from './scoring/PenaltyCalculator';
import { createInitialSnapshot, PitStopStateMachine } from './state/PitStopStateMachine';
import { SeededSequenceGenerator } from './state/SeededSequenceGenerator';
import { TimingEngine } from './timing/TimingEngine';

type Listener = (snapshot: PitStopSnapshot, event?: PitStopEvent) => void;

export class GameController {
  private config: GameConfig = defaultGameConfig;
  private snapshot = createInitialSnapshot(defaultGameConfig.seed, defaultGameConfig.difficulty);
  private listeners = new Set<Listener>();
  private results: TimingResult[] = [];
  private syncBonus = 0;
  private startTime = 0;
  private eventIndex = 0;
  private generator = new SeededSequenceGenerator(defaultGameConfig.seed);

  constructor(
    private readonly scoreRepository?: ScoreRepository,
    private readonly timing = new TimingEngine(),
    private readonly machine = new PitStopStateMachine(),
    private readonly scoreCalculator = new ScoreCalculator(),
    private readonly syncCalculator = new SyncCalculator(),
    private readonly penaltyCalculator = new PenaltyCalculator(),
  ) {}

  async startGame(config: Partial<GameConfig> = {}): Promise<void> {
    this.config = { ...defaultGameConfig, ...config, timing: { ...defaultGameConfig.timing, ...config.timing }, sync: { ...defaultGameConfig.sync, ...config.sync }, penalties: { ...defaultGameConfig.penalties, ...config.penalties }, calibration: { ...defaultGameConfig.calibration, ...config.calibration } };
    this.generator = new SeededSequenceGenerator(this.config.seed);
    this.snapshot = createInitialSnapshot(this.config.seed, this.config.difficulty);
    this.results = [];
    this.syncBonus = 0;
    this.startTime = 0;
    this.snapshot.bestTime = (await this.scoreRepository?.getBest(this.config.difficulty))?.score.finalPitTime;
    this.emit('PHASE_CHANGED', 0, 'Ready');
  }

  dispatch(command: GameCommand, timestamp: number): void {
    if (command === 'PAUSE') {
      this.snapshot.isPaused ? this.resume() : this.pause();
      return;
    }
    if (this.snapshot.isPaused || this.snapshot.phase === 'FINISHED') return;
    if (this.snapshot.phase === 'READY') this.beginRun(timestamp);

    this.update(timestamp);
    if (command === 'CENTRAL_ACTION') this.handleCentral(timestamp);
    if (command === 'OPERATOR_A_PRESS') this.handleOperator('A', timestamp);
    if (command === 'OPERATOR_B_PRESS') this.handleOperator('B', timestamp);
  }

  update(timestamp: number): void {
    if (this.snapshot.phase === 'READY' || this.snapshot.isPaused) return;
    this.snapshot.elapsedTime = Math.max(0, timestamp - this.startTime);
    const nextDue = this.snapshot.notes[0];
    if (nextDue && this.snapshot.phase !== nextDue.phase && timestamp >= nextDue.expectedTime - 0.45) {
      this.setPhase(nextDue.phase, timestamp);
    }
    this.notify();
  }

  pause(): void {
    this.snapshot.isPaused = true;
    this.emit('PAUSED', this.snapshot.elapsedTime, 'Paused');
  }

  resume(): void {
    this.snapshot.isPaused = false;
    this.emit('PAUSED', this.snapshot.elapsedTime, 'Resumed');
  }

  restart(): void {
    void this.startGame(this.config);
  }

  getSnapshot(): PitStopSnapshot {
    return structuredClone(this.snapshot);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private beginRun(timestamp: number): void {
    this.startTime = timestamp;
    this.snapshot.notes = this.generator.buildNotes(this.config, timestamp);
    this.setPhase('ARRIVAL', timestamp);
  }

  private handleCentral(timestamp: number): void {
    const note = this.nextNote('CENTER');
    if (!note) return;
    if (note.phase === 'CROSSOVER' && !this.machine.canCrossover(this.snapshot)) {
      this.addPenalty(this.penaltyCalculator.earlyCrossover(this.config), timestamp, 'Crossover before both first-side wheels are complete');
      return;
    }
    if (note.phase === 'JACK_DOWN' && !this.machine.canJackDown(this.snapshot)) {
      this.addPenalty(this.penaltyCalculator.earlyJackDown(this.config), timestamp, 'Jack-down before all wheels are complete');
      return;
    }
    if (note.phase === 'RELEASE' && !this.machine.canRelease(this.snapshot)) {
      this.addPenalty(this.penaltyCalculator.unsafeRelease(this.config), timestamp, 'Unsafe release');
      return;
    }
    const result = this.consumeNote(note, timestamp);
    if (note.id === 'crossover') {
      this.snapshot.segments.firstSide = timestamp - this.startTime;
      this.snapshot.activeSide = 'RIGHT';
      this.setPhase('SECOND_SIDE_SERVICE', timestamp);
    } else if (note.id === 'jack-down') {
      this.snapshot.segments.secondSide = timestamp - this.startTime - (this.snapshot.segments.firstSide ?? 0);
      this.setPhase('RELEASE', timestamp);
    } else if (note.id === 'release') {
      this.finish(timestamp);
    } else if (result.action === 'JACK') {
      this.setPhase('FIRST_SIDE_SERVICE', timestamp);
    }
  }

  private handleOperator(lane: 'A' | 'B', timestamp: number): void {
    const note = this.nextNote(lane);
    if (!note || note.phase !== this.snapshot.phase) return;
    const result = this.consumeNote(note, timestamp);
    if (!note.wheel) return;
    const wheel = this.snapshot.wheels[note.wheel];
    if (result.action === 'LOOSEN') wheel.step = 'REMOVE';
    if (result.action === 'TIGHTEN') {
      wheel.step = 'DONE';
      wheel.completedAt = timestamp;
      this.emit('WHEEL_DONE', timestamp, `${note.wheel} complete`, { wheel: note.wheel });
      this.checkSync(note.wheel, timestamp);
      if (this.config.autoCrossover && this.machine.canCrossover(this.snapshot)) this.handleCentral(timestamp + 0.05);
    }
  }

  private consumeNote(note: TimingNote, timestamp: number): TimingResult {
    const result = this.timing.judge(note, timestamp, this.config, this.snapshot.combo);
    this.snapshot.notes = this.snapshot.notes.filter((candidate) => candidate.id !== note.id);
    this.results.push(result);
    this.snapshot.combo = result.combo;
    this.emit('JUDGEMENT', timestamp, result.judgement, result);
    return result;
  }

  private nextNote(lane: 'A' | 'B' | 'CENTER'): TimingNote | undefined {
    return this.snapshot.notes.find((note) => note.lane === lane);
  }

  private checkSync(wheel: WheelPosition, timestamp: number): void {
    const pair = wheel.includes('FRONT') ? wheel.replace('FRONT', 'REAR') : wheel.replace('REAR', 'FRONT');
    const other = this.snapshot.wheels[pair as WheelPosition];
    const current = this.snapshot.wheels[wheel];
    if (!other.completedAt || !current.completedAt) return;
    const sync = this.syncCalculator.judge((current.completedAt - other.completedAt) * 1000, this.config);
    this.syncBonus += sync.bonus;
    this.emit('SYNC', timestamp, sync.judgement, sync);
  }

  private setPhase(phase: PitStopSnapshot['phase'], timestamp: number): void {
    if (this.snapshot.phase === phase) return;
    this.snapshot.phase = phase;
    this.emit('PHASE_CHANGED', timestamp, phase);
  }

  private addPenalty(amount: number, timestamp: number, message: string): void {
    this.snapshot.penalties += amount;
    this.emit('PENALTY', timestamp, message, { amount });
  }

  private finish(timestamp: number): void {
    this.snapshot.elapsedTime = timestamp - this.startTime;
    this.snapshot.phase = 'FINISHED';
    this.snapshot.score = this.scoreCalculator.calculate(this.snapshot, this.results, this.syncBonus);
    this.emit('RUN_FINISHED', timestamp, 'Finished', this.snapshot.score);
    void this.scoreRepository?.save({
      id: `${this.config.seed}-${Math.round(timestamp * 1000)}`,
      createdAt: new Date().toISOString(),
      difficulty: this.config.difficulty,
      seed: this.config.seed,
      score: this.snapshot.score,
    });
  }

  private emit(type: PitStopEvent['type'], timestamp: number, message: string, payload?: unknown): void {
    const event: PitStopEvent = { id: `event-${this.eventIndex++}`, type, timestamp, message, payload };
    this.snapshot.events = [event, ...this.snapshot.events].slice(0, 8);
    this.notify(event);
  }

  private notify(event?: PitStopEvent): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot, event));
  }
}
