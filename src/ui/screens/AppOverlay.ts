import type { Difficulty, GameConfig, GameController, PitStopSnapshot } from '../../core';
import { configForDifficulty, InputCalibrationService } from '../../core';

export class AppOverlay {
  private difficulty: Difficulty = 'PRO';
  private calibration = new InputCalibrationService();

  constructor(
    private readonly root: HTMLElement,
    private readonly controller: GameController,
  ) {}

  mount(): void {
    this.root.innerHTML = template();
    this.bind();
    this.controller.subscribe((snapshot) => {
      this.render(snapshot);
    });
    void this.start();
  }

  private bind(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-action="start"]').forEach((el) => el.addEventListener('click', () => void this.start()));
    this.root.querySelectorAll<HTMLButtonElement>('[data-action="pause"]').forEach((el) => el.addEventListener('click', () => this.controller.dispatch('PAUSE', seconds())));
    this.root.querySelectorAll<HTMLButtonElement>('[data-action="restart"]').forEach((el) => el.addEventListener('click', () => void this.start()));
    this.root.querySelector<HTMLSelectElement>('[data-control="difficulty"]')?.addEventListener('change', (event) => {
      this.difficulty = (event.target as HTMLSelectElement).value as Difficulty;
      void this.start();
    });
    this.root.querySelector<HTMLInputElement>('[data-control="offset"]')?.addEventListener('input', (event) => {
      const offsetMs = Number((event.target as HTMLInputElement).value);
      this.calibration.write({ offsetMs });
      this.root.querySelector<HTMLElement>('[data-readout="offset"]')!.textContent = `${offsetMs}ms`;
    });
  }

  private async start(): Promise<void> {
    const calibration = this.calibration.read();
    const config: GameConfig = { ...configForDifficulty(this.difficulty, 1307), calibration };
    this.root.querySelector<HTMLInputElement>('[data-control="offset"]')!.value = String(calibration.offsetMs);
    this.root.querySelector<HTMLElement>('[data-readout="offset"]')!.textContent = `${calibration.offsetMs}ms`;
    await this.controller.startGame(config);
  }

  private render(snapshot: PitStopSnapshot): void {
    this.root.querySelector<HTMLElement>('[data-readout="phase"]')!.textContent = snapshot.phase.replaceAll('_', ' ');
    this.root.querySelector<HTMLElement>('[data-readout="time"]')!.textContent = format(snapshot.score?.finalPitTime ?? snapshot.elapsedTime);
    this.root.querySelector<HTMLElement>('[data-readout="penalty"]')!.textContent = `+${snapshot.penalties.toFixed(2)}s`;
    this.root.querySelector<HTMLElement>('[data-readout="best"]')!.textContent = snapshot.bestTime ? format(snapshot.bestTime) : '--:--.---';
    const result = this.root.querySelector<HTMLElement>('[data-panel="result"]')!;
    result.hidden = snapshot.phase !== 'FINISHED';
    if (snapshot.score) {
      result.querySelector('[data-result="final"]')!.textContent = format(snapshot.score.finalPitTime);
      result.querySelector('[data-result="sync"]')!.textContent = `${snapshot.score.crewSync}`;
      result.querySelector('[data-result="a"]')!.textContent = `${snapshot.score.operatorAccuracy.A}%`;
      result.querySelector('[data-result="b"]')!.textContent = `${snapshot.score.operatorAccuracy.B}%`;
    }
    this.root.querySelector<HTMLElement>('[data-readout="hint"]')!.textContent = hint(snapshot);
  }
}

function template(): string {
  return `
    <div class="hud top">
      <section class="panel compact"><span>PHASE</span><strong data-readout="phase">READY</strong></section>
      <section class="panel timer"><span>PIT TIME</span><strong data-readout="time">00:00.000</strong></section>
      <section class="panel compact"><span>BEST</span><strong data-readout="best">--:--.---</strong></section>
    </div>
    <div class="hud left">
      <button class="brand" data-action="start">PIT//PERFECT</button>
      <label class="field">MODE<select data-control="difficulty"><option>ROOKIE</option><option selected>PRO</option><option>ENDURANCE</option></select></label>
      <label class="field">OFFSET<input data-control="offset" type="range" min="-120" max="120" step="5" value="0" /><b data-readout="offset">0ms</b></label>
      <button data-action="pause">Pause</button>
    </div>
    <button class="pause-fab" data-action="pause" aria-label="Pause"><i></i><i></i></button>
    <div class="toast"><span data-readout="hint">Hit the target as the outer ring closes.</span><span data-readout="penalty">+0.00s</span></div>
    <dialog class="result" data-panel="result" hidden>
      <h2>RESULT</h2>
      <dl><dt>Final</dt><dd data-result="final">00:00.000</dd><dt>Crew Sync</dt><dd data-result="sync">0</dd><dt>Operator A</dt><dd data-result="a">0%</dd><dt>Operator B</dt><dd data-result="b">0%</dd></dl>
      <button data-action="restart">Run Again</button>
    </dialog>
  `;
}

function seconds(): number {
  return performance.now() / 1000;
}

function format(secondsValue: number): string {
  const minutes = Math.floor(secondsValue / 60).toString().padStart(2, '0');
  const rest = (secondsValue % 60).toFixed(3).padStart(6, '0');
  return `${minutes}:${rest}`;
}

function hint(snapshot: PitStopSnapshot): string {
  if (snapshot.phase === 'READY') return 'Tap START.';
  if (snapshot.phase === 'CROSSOVER') return 'Hit MOVE when the ring closes.';
  if (snapshot.phase === 'RELEASE') return 'Hit GO for a safe release.';
  if (snapshot.phase === 'FINISHED') return 'Run complete.';
  return 'Hit each wheel target as the outer ring closes.';
}
