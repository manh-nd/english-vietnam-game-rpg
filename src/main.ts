import Phaser from 'phaser';

import { BootScene } from './game/scenes/BootScene';
import { HaGiangScene } from './game/scenes/HaGiangScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#173324',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, HaGiangScene],
};

new Phaser.Game(config);
