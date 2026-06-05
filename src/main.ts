import Phaser from 'phaser';

import { BootScene } from './game/scenes/BootScene';
import { HaGiangScene } from './game/scenes/HaGiangScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  backgroundColor: '#3f8f4d',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HaGiangScene],
};

new Phaser.Game(config);
