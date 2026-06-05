import Phaser from 'phaser';

import lessonsUrl from '../../../data/lessons.json?url';
import locationsUrl from '../../../data/locations.json?url';
import npcsUrl from '../../../data/npcs.json?url';
import questsUrl from '../../../data/quests.json?url';
import type { AuthoredContent } from '../types/content';

export class BootScene extends Phaser.Scene {
  public static readonly key = 'BootScene';

  public constructor() {
    super(BootScene.key);
  }

  public preload(): void {
    this.load.json('locations', locationsUrl);
    this.load.json('npcs', npcsUrl);
    this.load.json('quests', questsUrl);
    this.load.json('lessons', lessonsUrl);
  }

  public create(): void {
    const content: AuthoredContent = {
      locations: this.cache.json.get('locations'),
      npcs: this.cache.json.get('npcs'),
      quests: this.cache.json.get('quests'),
      lessons: this.cache.json.get('lessons'),
    };

    this.registry.set('content', content);
    this.scene.start('HaGiangScene');
  }
}
