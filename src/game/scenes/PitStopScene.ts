import Phaser from 'phaser';
import type { GameController, PitStopSnapshot, TimingNote } from '../../core';
import { LayoutService } from '../layout/LayoutService';

export class PitStopScene extends Phaser.Scene {
  private controller!: GameController;
  private layoutService = new LayoutService();
  private snapshot!: PitStopSnapshot;
  private keyartBackdrop?: Phaser.GameObjects.Image;
  private pitBackdrop?: Phaser.GameObjects.Image;
  private pitOverlay?: Phaser.GameObjects.Image;
  private car?: Phaser.GameObjects.Image;
  private carSilhouette?: Phaser.GameObjects.Image;
  private operators: Record<'A' | 'B', Phaser.GameObjects.Image | undefined> = { A: undefined, B: undefined };
  private wheelSprites = new Map<string, Phaser.GameObjects.Image>();
  private rings = new Map<string, Phaser.GameObjects.Arc>();
  private message?: Phaser.GameObjects.Text;
  private timer?: Phaser.GameObjects.Text;

  constructor() {
    super('PitStopScene');
  }

  init(data: { controller: GameController }): void {
    this.controller = data.controller ?? this.registry.get('controller');
  }

  create(): void {
    this.keyartBackdrop = this.add.image(0, 0, 'keyart').setOrigin(0.5).setDepth(-1).setAlpha(0.34);
    this.pitBackdrop = this.add.image(0, 0, 'pitbox-scene').setOrigin(0.5).setDepth(0).setAlpha(0.92);
    this.add.rectangle(0, 0, 1, 1, 0x050607, 0.42).setOrigin(0).setDepth(1).setName('scene-vignette');
    this.pitOverlay = this.add.image(0, 0, 'pit-markings').setOrigin(0.5).setAlpha(0.55).setDepth(2);
    this.car = this.add.image(0, 0, 'hypercar-generated').setDepth(3);
    this.car.setCrop(374, 28, 506, 1200);
    this.carSilhouette = this.add.image(0, 0, 'hypercar-silhouette').setDepth(4).setAlpha(0.32).setTint(0x111418);
    this.operators.A = this.add.image(0, 0, 'operator').setDepth(6);
    this.operators.B = this.add.image(0, 0, 'operator').setDepth(6);
    ['FRONT_LEFT', 'REAR_LEFT', 'FRONT_RIGHT', 'REAR_RIGHT'].forEach((wheel) => {
      this.wheelSprites.set(wheel, this.add.image(0, 0, 'wheel').setDepth(5));
    });
    this.timer = this.add.text(0, 0, '00:00.000', { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(9);
    this.message = this.add.text(0, 0, 'READY', { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#f6f1df', fontStyle: 'bold' }).setOrigin(0.5).setDepth(9);
    this.controller.subscribe((snapshot, event) => {
      this.snapshot = snapshot;
      if (event?.type === 'JUDGEMENT' || event?.type === 'PENALTY' || event?.type === 'SYNC') {
        this.flash(event.message, event.type === 'PENALTY' ? '#ff4545' : event.type === 'SYNC' ? '#61e45e' : '#ffd23f');
      }
      this.renderSnapshot();
    });
    this.scale.on('resize', () => this.renderSnapshot());
  }

  override update(time: number): void {
    this.controller.update(time / 1000);
    this.renderSnapshot();
  }

  private renderSnapshot(): void {
    if (!this.snapshot) return;
    const layout = this.layoutService.calculate(this.scale.width, this.scale.height, this.snapshot);
    this.renderStage();
    this.car
      ?.setPosition(layout.car.x, layout.car.y)
      .setDisplaySize(320 * layout.car.scale, 760 * layout.car.scale)
      .setAngle(layout.car.angle);
    this.carSilhouette?.setPosition(layout.car.x, layout.car.y).setScale(layout.car.scale * 1.02).setAngle(layout.car.angle);
    this.operators.A?.setPosition(layout.operators.A.x, layout.operators.A.y).setScale(layout.car.scale * 0.58).setFlipX(this.snapshot.activeSide === 'RIGHT');
    this.operators.B?.setPosition(layout.operators.B.x, layout.operators.B.y).setScale(layout.car.scale * 0.58).setFlipX(this.snapshot.activeSide === 'RIGHT');
    Object.entries(layout.wheels).forEach(([wheel, point]) => {
      const complete = this.snapshot.wheels[wheel as keyof typeof this.snapshot.wheels].step === 'DONE';
      this.wheelSprites.get(wheel)?.setPosition(point.x, point.y).setScale(layout.car.scale * 0.27).setAlpha(complete ? 0.35 : 1);
    });
    this.timer?.setPosition(layout.timer.x, layout.timer.y).setText(formatTime(this.snapshot.score?.finalPitTime ?? this.snapshot.elapsedTime));
    this.message?.setPosition(layout.message.x, layout.message.y).setText(this.snapshot.phase.replaceAll('_', ' '));
    this.renderRings(layout.wheels);
  }

  private renderStage(): void {
    const { width, height } = this.scale;
    const coverScale = Math.max(width / 1672, height / 941);
    this.keyartBackdrop?.setPosition(width / 2, height / 2).setScale(coverScale);
    this.pitBackdrop?.setPosition(width / 2, height / 2).setScale(coverScale);
    this.pitOverlay?.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    (this.children.getByName('scene-vignette') as Phaser.GameObjects.Rectangle | null)?.setDisplaySize(width, height);
  }

  private renderRings(wheels: Record<string, { x: number; y: number }>): void {
    const activeIds = new Set(this.snapshot.notes.map((note) => note.id));
    this.rings.forEach((ring, id) => {
      if (!activeIds.has(id)) {
        ring.destroy();
        this.rings.delete(id);
      }
    });
    this.snapshot.notes.slice(0, 4).forEach((note) => this.renderRing(note, wheels));
  }

  private renderRing(note: TimingNote, wheels: Record<string, { x: number; y: number }>): void {
    const point = note.wheel ? wheels[note.wheel] : { x: this.scale.width / 2, y: this.scale.height * 0.68 };
    const now = performance.now() / 1000;
    const until = Math.max(0, note.expectedTime - now);
    const radius = 28 + Math.min(54, until * 42);
    const color = note.lane === 'A' ? 0xffd23f : note.lane === 'B' ? 0x5ec7ff : 0xff7a18;
    const ring = this.rings.get(note.id) ?? this.add.circle(point.x, point.y, radius).setDepth(8) as Phaser.GameObjects.Arc;
    ring.setPosition(point.x, point.y).setRadius(radius).setStrokeStyle(5, color, 0.9).setFillStyle(color, 0.04);
    this.rings.set(note.id, ring);
  }

  private flash(text: string, color: string): void {
    const pop = this.add.text(this.scale.width / 2, this.scale.height * 0.22, text, { fontFamily: 'Arial, sans-serif', fontSize: '32px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: pop, y: pop.y - 36, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => pop.destroy() });
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${minutes}:${rest}`;
}
