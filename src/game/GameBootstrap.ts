import Phaser from 'phaser';
import type { GameController } from '../core';
import { BootScene } from './scenes/BootScene';
import { CalibrationScene } from './scenes/CalibrationScene';
import { MenuScene } from './scenes/MenuScene';
import { PitStopScene } from './scenes/PitStopScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';

export function bootGame(parent: HTMLElement, controller: GameController): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#090a0c',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    scene: [BootScene, PreloadScene, MenuScene, CalibrationScene, new PitStopScene(), ResultScene],
    callbacks: {
      postBoot(game) {
        game.registry.set('controller', controller);
      },
    },
  });
}
