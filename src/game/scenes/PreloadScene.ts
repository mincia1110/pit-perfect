import Phaser from 'phaser';
import { assetManifest } from '../../assets/manifest';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    Object.values(assetManifest).forEach((asset) => this.load.image(asset.key, asset.path));
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
