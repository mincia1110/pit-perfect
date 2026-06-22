import Phaser from 'phaser';
import type { GameController, PitStopSnapshot, TimingNote } from '../../core';
import { assetManifest } from '../../assets/manifest';
import { InputMapper } from '../input/InputMapper';
import { LayoutService } from '../layout/LayoutService';

interface HitTarget {
  container: Phaser.GameObjects.Container;
  hitCircle: Phaser.GameObjects.Arc;
  approachCircle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

const HIT_RADIUS = 42;
const APPROACH_SECONDS = 0.9;

export class PitStopScene extends Phaser.Scene {
  private controller!: GameController;
  private layoutService = new LayoutService();
  private inputMapper = new InputMapper();
  private snapshot!: PitStopSnapshot;
  private background?: Phaser.GameObjects.Image;
  private car?: Phaser.GameObjects.Image;
  private operators: Record<'A' | 'B', Phaser.GameObjects.Image | undefined> = { A: undefined, B: undefined };
  private wheelSprites = new Map<string, Phaser.GameObjects.Image>();
  private hitTargets = new Map<string, HitTarget>();

  constructor() {
    super('PitStopScene');
  }

  init(data: { controller: GameController }): void {
    this.controller = data.controller ?? this.registry.get('controller');
  }

  create(): void {
    this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, assetManifest.pit.key).setDepth(0);
    this.fitBackground();

    this.car = this.add.image(0, 0, assetManifest.carCutout.key).setDepth(2);
    this.operators.A = this.add.image(0, 0, 'operator').setDepth(4);
    this.operators.B = this.add.image(0, 0, 'operator').setDepth(4);
    ['FRONT_LEFT', 'REAR_LEFT', 'FRONT_RIGHT', 'REAR_RIGHT'].forEach((wheel) => {
      this.wheelSprites.set(wheel, this.add.image(0, 0, 'wheel').setDepth(3));
    });
    this.controller.subscribe((snapshot, event) => {
      this.snapshot = snapshot;
      if (event?.type === 'JUDGEMENT' || event?.type === 'PENALTY' || event?.type === 'SYNC') {
        this.flash(event.message, event.type === 'PENALTY' ? '#ff4545' : event.type === 'SYNC' ? '#61e45e' : '#ffd23f');
      }
      this.renderSnapshot();
    });
    this.scale.on('resize', () => {
      this.fitBackground();
      this.renderSnapshot();
    });
  }

  override update(time: number): void {
    this.controller.update(time / 1000);
    this.renderSnapshot();
  }

  private fitBackground(): void {
    if (!this.background) return;
    // Cover the canvas while preserving the pit scene's aspect ratio.
    const asset = assetManifest.pit;
    const scale = Math.max(this.scale.width / asset.width, this.scale.height / asset.height);
    const displayWidth = asset.width * scale;
    const displayHeight = asset.height * scale;
    this.background
      .setPosition(this.scale.width / 2, this.scale.height / 2)
      .setDisplaySize(displayWidth, displayHeight)
      .setAlpha(0.85);
  }

  private renderSnapshot(): void {
    if (!this.snapshot) return;
    const layout = this.layoutService.calculate(this.scale.width, this.scale.height, this.snapshot);
    this.car?.setPosition(layout.car.x, layout.car.y).setScale(layout.car.scale).setAngle(layout.car.angle);
    const facingRight = this.snapshot.activeSide === 'RIGHT';
    this.operators.A?.setPosition(layout.operators.A.x, layout.operators.A.y).setScale(this.layoutService.operatorScale).setFlipX(facingRight);
    this.operators.B?.setPosition(layout.operators.B.x, layout.operators.B.y).setScale(this.layoutService.operatorScale).setFlipX(facingRight);
    Object.entries(layout.wheels).forEach(([wheel, point]) => {
      const complete = this.snapshot.wheels[wheel as keyof typeof this.snapshot.wheels].step === 'DONE';
      this.wheelSprites.get(wheel)?.setPosition(point.x, point.y).setScale(this.layoutService.wheelScale).setAlpha(complete ? 0.16 : 0.48);
    });
    this.renderHitTargets(layout);
  }

  private renderHitTargets(layout: ReturnType<LayoutService['calculate']>): void {
    if (this.snapshot.phase === 'READY') {
      this.removeInactiveTargets(new Set(['start']));
      this.renderStartTarget(layout.car.x, layout.car.y);
      return;
    }

    const notes = this.actionableNotes();
    const activeIds = new Set(notes.map((note) => note.id));
    this.removeInactiveTargets(activeIds);
    notes.forEach((note) => this.renderHitTarget(note, this.targetPoint(note, layout)));
  }

  private actionableNotes(): TimingNote[] {
    const lanes = new Set<TimingNote['lane']>();
    return this.snapshot.notes.filter((note) => {
      if (note.phase !== this.snapshot.phase || lanes.has(note.lane)) return false;
      lanes.add(note.lane);
      return true;
    });
  }

  private removeInactiveTargets(activeIds: Set<string>): void {
    this.hitTargets.forEach((target, id) => {
      if (!activeIds.has(id)) {
        target.container.destroy();
        this.hitTargets.delete(id);
      }
    });
  }

  private renderStartTarget(x: number, y: number): void {
    const target = this.getOrCreateTarget('start', 0xffd23f, 'START', () => {
      this.controller.dispatch(this.inputMapper.mapStart(), performance.now() / 1000);
    });
    target.container.setPosition(x, y);
    target.approachCircle.setRadius(HIT_RADIUS + 28);
  }

  private renderHitTarget(note: TimingNote, point: { x: number; y: number }): void {
    const color = note.lane === 'A' ? 0xffd23f : note.lane === 'B' ? 0x5ec7ff : 0xff7a18;
    const target = this.getOrCreateTarget(note.id, color, targetLabel(note), () => {
      this.controller.dispatch(this.inputMapper.mapNote(note), performance.now() / 1000);
    });
    const now = performance.now() / 1000;
    const progress = Phaser.Math.Clamp((note.expectedTime - now) / APPROACH_SECONDS, 0, 1);
    target.container.setPosition(point.x, point.y);
    target.approachCircle.setRadius(HIT_RADIUS + progress * 68);
  }

  private getOrCreateTarget(id: string, color: number, label: string, onHit: () => void): HitTarget {
    const existing = this.hitTargets.get(id);
    if (existing) return existing;

    const shadow = this.add.circle(3, 5, HIT_RADIUS + 4, 0x000000, 0.48);
    const hitCircle = this.add.circle(0, 0, HIT_RADIUS, color, 0.82).setStrokeStyle(5, 0xffffff, 0.9);
    const inner = this.add.circle(0, 0, HIT_RADIUS * 0.62, 0x090a0c, 0.72).setStrokeStyle(2, color, 1);
    const approachCircle = this.add.circle(0, 0, HIT_RADIUS + 68, color, 0).setStrokeStyle(5, color, 0.92);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: label.length > 7 ? '11px' : '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#090a0c',
      strokeThickness: 3,
    }).setOrigin(0.5);
    const container = this.add.container(0, 0, [shadow, hitCircle, inner, approachCircle, text]).setDepth(12);
    container.setSize((HIT_RADIUS + 18) * 2, (HIT_RADIUS + 18) * 2);
    container.setInteractive();
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.preventDefault();
      if ('vibrate' in navigator) navigator.vibrate?.(12);
      this.input.setDefaultCursor('default');
      onHit();
    });
    container.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
      container.setScale(1.06);
    });
    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
      container.setScale(1);
    });

    const target = { container, hitCircle, approachCircle, label: text };
    this.hitTargets.set(id, target);
    return target;
  }

  private targetPoint(note: TimingNote, layout: ReturnType<LayoutService['calculate']>): { x: number; y: number } {
    if (note.wheel) return layout.wheels[note.wheel];
    if (note.action === 'RELEASE') return { x: layout.car.x, y: layout.car.y + 118 * layout.car.scale };
    return { x: layout.car.x, y: layout.car.y };
  }

  private flash(text: string, color: string): void {
    const pop = this.add.text(this.scale.width / 2, this.scale.height * 0.22, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color,
      fontStyle: 'bold',
      stroke: '#090a0c',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 8, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: pop, y: pop.y - 40, alpha: 0, duration: 750, ease: 'Cubic.easeOut', onComplete: () => pop.destroy() });
  }
}

function targetLabel(note: TimingNote): string {
  if (note.action === 'CROSSOVER') return 'MOVE';
  if (note.action === 'RELEASE') return 'GO';
  return note.action;
}
