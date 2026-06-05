import Phaser from 'phaser';

import { NpcSprite } from '../entities/NpcSprite';
import type { ContentDatabase } from '../systems/ContentDatabase';
import type { NpcContent } from '../types/content';
import type { LessonManager } from '../systems/LessonManager';

export class HaGiangScene extends Phaser.Scene {
  public static readonly key = 'HaGiangScene';

  private static readonly haGiangLocationId = 'ha_giang_loop';
  private static readonly npcPlacements: Readonly<Record<string, Phaser.Math.Vector2>> = {
    npc_may_guide: new Phaser.Math.Vector2(280, 220),
    npc_binh_mechanic: new Phaser.Math.Vector2(520, 260),
    npc_lan_homestay_host: new Phaser.Math.Vector2(430, 430),
  };
  private static readonly player_speed = 220;
  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;

  public constructor() {
    super(HaGiangScene.key);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#3f8f4d');

    this.add.text(24, 24, 'English Vietnam RPG - Web Prototype', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
    });

    this.add.text(24, 60, 'Move with WASD or arrow keys.', {
      color: '#eef7ee',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
    });

    this.createContentDebugText();

    this.player = this.add.rectangle(400, 300, 34, 42, 0x2f5cff);
    this.player.setStrokeStyle(2, 0xffffff, 0.9);

    this.createAuthoredNpcs();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key> | undefined;
  }

  public update(_time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    const direction = new Phaser.Math.Vector2(0, 0);

    if (this.cursors?.left.isDown || this.wasd?.left.isDown) {
      direction.x -= 1;
    }
    if (this.cursors?.right.isDown || this.wasd?.right.isDown) {
      direction.x += 1;
    }
    if (this.cursors?.up.isDown || this.wasd?.up.isDown) {
      direction.y -= 1;
    }
    if (this.cursors?.down.isDown || this.wasd?.down.isDown) {
      direction.y += 1;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(HaGiangScene.player_speed * (delta / 1000));
      this.player.x = Phaser.Math.Clamp(direction.x + this.player.x, 16, this.scale.width - 16);
      this.player.y = Phaser.Math.Clamp(direction.y + this.player.y, 20, this.scale.height - 20);
    }
  }

  private createContentDebugText(): void {
    const contentDatabase = this.registry.get('contentDatabase') as ContentDatabase | undefined;
    const lessonManager = this.registry.get('lessonManager') as LessonManager | undefined;

    if (!contentDatabase || !lessonManager) {
      this.add.text(24, 92, 'Content systems are not available yet.', {
        color: '#ffe8a3',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      });
      return;
    }

    const lessons = contentDatabase.getLessons();
    const firstLesson = lessons[0];
    const sampleResult = firstLesson
      ? lessonManager.checkAnswer(firstLesson.id, firstLesson.correct_choice_index, firstLesson.location_id)
      : undefined;
    const sampleStatus = sampleResult ? sampleResult.status : 'no_lessons';

    this.add.text(24, 92, [
      `Content loaded: ${contentDatabase.getLocations().length} locations, ${contentDatabase.getNpcs().length} NPCs, ${lessons.length} lessons.`,
      `Sample lesson check: ${sampleStatus}.`,
    ], {
      color: '#eef7ee',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
    });
  }

  private createAuthoredNpcs(): void {
    const contentDatabase = this.registry.get('contentDatabase') as ContentDatabase | undefined;

    if (!contentDatabase) {
      this.add.text(24, 146, 'Warning: ContentDatabase unavailable; NPCs were not rendered.', {
        color: '#ffe8a3',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      });
      return;
    }

    const haGiangNpcs = contentDatabase.getNpcsByLocation(HaGiangScene.haGiangLocationId);
    const missingPlacementIds: string[] = [];
    let renderedNpcCount = 0;

    haGiangNpcs.forEach((npc: NpcContent) => {
      const placement = HaGiangScene.npcPlacements[npc.id];

      if (!placement) {
        missingPlacementIds.push(npc.id);
        return;
      }

      new NpcSprite({
        scene: this,
        npc,
        x: placement.x,
        y: placement.y,
      });
      renderedNpcCount += 1;
    });

    const debugLines = [`Ha Giang NPCs rendered: ${renderedNpcCount}/${haGiangNpcs.length}.`];
    if (missingPlacementIds.length > 0) {
      debugLines.push(`Missing NPC placements: ${missingPlacementIds.join(', ')}.`);
    }

    this.add.text(24, 146, debugLines, {
      color: missingPlacementIds.length > 0 ? '#ffe8a3' : '#eef7ee',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
    });
  }
}
