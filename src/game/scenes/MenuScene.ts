import Phaser from 'phaser';
import { assetManifest } from '../../assets/manifest';

const HOLD_MS = 1200;

export class MenuScene extends Phaser.Scene {
  private advance?: () => void;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const asset = assetManifest.keyart;
    const scale = Math.max(width / asset.width, height / asset.height);
    this.add.image(width / 2, height / 2, asset.key)
      .setDisplaySize(asset.width * scale, asset.height * scale)
      .setAlpha(0.9);

 // Scrim so the title reads over the key art.
    this.add.rectangle(width / 2, height / 2, width, height, 0x050607, 0.45).setDepth(1);

    const title = this.add.text(width / 2, height * 0.42, 'PIT//PERFECT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(Math.min(width, height) * 0.09)}px`,
      color: '#ffd23f',
      fontStyle: 'bold',
      stroke: '#090a0c',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 3, color: '#000', blur: 10, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    const subtitle = this.add.text(width / 2, height * 0.42 + title.height * 0.7, 'Hit each target on the beat', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(Math.min(width, height) * 0.032)}px`,
      color: '#f6f1df',
      fontStyle: 'bold',
      stroke: '#090a0c',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 450, ease: 'Power2' });
    this.tweens.add({ targets: subtitle, alpha: 0.9, duration: 450, delay: 180, ease: 'Power2' });
    this.tweens.add({ targets: [title, subtitle], alpha: { from: 1, to: 0 }, duration: 350, delay: HOLD_MS, ease: 'Power2' });

    let started = false;
    this.advance = () => {
      if (started) return;
      started = true;
      this.time.delayedCall(0, () => this.scene.start('PitStopScene'));
    };

    // Pointer skips the hold so the interactive target appears immediately.
    this.input.once('pointerdown', this.advance);
    this.time.delayedCall(HOLD_MS + 400, this.advance);
  }
}
