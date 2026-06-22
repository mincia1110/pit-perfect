export type GamePhase =
  | 'READY'
  | 'ARRIVAL'
  | 'BRAKING'
  | 'JACK_UP'
  | 'FIRST_SIDE_SERVICE'
  | 'CROSSOVER'
  | 'SECOND_SIDE_SERVICE'
  | 'JACK_DOWN'
  | 'RELEASE'
  | 'FINISHED';

export type GameCommand =
  | 'START_RUN'
  | 'OPERATOR_A_PRESS'
  | 'OPERATOR_A_RELEASE'
  | 'OPERATOR_B_PRESS'
  | 'OPERATOR_B_RELEASE'
  | 'CENTRAL_ACTION'
  | 'PAUSE';

export type OperatorLane = 'A' | 'B' | 'CENTER';
export type WheelPosition = 'FRONT_LEFT' | 'REAR_LEFT' | 'FRONT_RIGHT' | 'REAR_RIGHT';
export type PitSide = 'LEFT' | 'RIGHT';
export type WheelStep = 'LOOSEN' | 'REMOVE' | 'INSTALL' | 'TIGHTEN' | 'DONE';
export type TimingAction = 'LOOSEN' | 'TIGHTEN' | 'JACK' | 'CROSSOVER' | 'RELEASE';
export type TimingJudgement = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
export type SyncJudgement = 'PERFECT_SYNC' | 'GREAT_SYNC' | 'GOOD_SYNC' | 'NO_SYNC';
export type Difficulty = 'ROOKIE' | 'PRO' | 'ENDURANCE';

export interface TimingNote {
  id: string;
  lane: OperatorLane;
  action: TimingAction;
  expectedTime: number;
  wheel?: WheelPosition;
  phase: GamePhase;
}

export interface TimingResult {
  noteId: string;
  lane: OperatorLane;
  action: TimingAction;
  expectedTime: number;
  actualTime: number;
  offsetMs: number;
  judgement: TimingJudgement;
  timePenalty: number;
  combo: number;
  wheel?: WheelPosition;
}

export interface PitStopEvent {
  id: string;
  type:
    | 'PHASE_CHANGED'
    | 'JUDGEMENT'
    | 'PENALTY'
    | 'SYNC'
    | 'WHEEL_DONE'
    | 'RUN_FINISHED'
    | 'PAUSED';
  timestamp: number;
  message: string;
  payload?: unknown;
}

export interface WheelState {
  position: WheelPosition;
  side: PitSide;
  lane: Exclude<OperatorLane, 'CENTER'>;
  step: WheelStep;
  loosenResult?: TimingResult;
  tightenResult?: TimingResult;
  completedAt?: number;
}

export interface ScoreBreakdown {
  baseElapsed: number;
  judgementPenalty: number;
  mistakePenalty: number;
  syncBonus: number;
  finalPitTime: number;
  operatorAccuracy: Record<Exclude<OperatorLane, 'CENTER'>, number>;
  crewSync: number;
}

export interface RunSegments {
  firstSide?: number;
  crossover?: number;
  secondSide?: number;
}

export interface PitStopSnapshot {
  seed: number;
  phase: GamePhase;
  difficulty: Difficulty;
  elapsedTime: number;
  activeSide: PitSide;
  wheels: Record<WheelPosition, WheelState>;
  notes: TimingNote[];
  events: PitStopEvent[];
  penalties: number;
  combo: number;
  score?: ScoreBreakdown;
  segments: RunSegments;
  isPaused: boolean;
  bestTime?: number;
}

export interface TimingWindows {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
}

export interface SyncWindows {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
}

export interface PenaltyConfig {
  miss: number;
  earlyCrossover: number;
  earlyJackDown: number;
  unsafeRelease: number;
}

export interface InputCalibration {
  offsetMs: number;
}

export interface GameConfig {
  seed: number;
  difficulty: Difficulty;
  timing: TimingWindows;
  sync: SyncWindows;
  penalties: PenaltyConfig;
  calibration: InputCalibration;
  autoCrossover: boolean;
}

export interface StoredScore {
  id: string;
  createdAt: string;
  difficulty: Difficulty;
  seed: number;
  score: ScoreBreakdown;
}

export interface ScoreRepository {
  getBest(difficulty: Difficulty): Promise<StoredScore | undefined>;
  save(score: StoredScore): Promise<void>;
  list(): Promise<StoredScore[]>;
  getCalibration(): Promise<InputCalibration>;
  saveCalibration(calibration: InputCalibration): Promise<void>;
}
