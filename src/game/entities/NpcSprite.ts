import Phaser from 'phaser';

import type { NpcContent } from '../types/content';

interface NpcSpriteOptions {
  scene: Phaser.Scene;
  npc: NpcContent;
  x: number;
  y: number;
}

export class NpcSprite extends Phaser.GameObjects.Container {
  public readonly npcId: string;
  public readonly locationId: string;
  public readonly introLessonId?: string;

  private readonly npcBody: Phaser.GameObjects.Arc;
  private readonly interactionRadius: Phaser.GameObjects.Arc;
  private readonly nameLabel: Phaser.GameObjects.Text;

  public constructor({ scene, npc, x, y }: NpcSpriteOptions) {
    super(scene, x, y);

    this.npcId = npc.id;
    this.locationId = npc.location_id;
    this.introLessonId = npc.intro_lesson_id;

    this.interactionRadius = scene.add.circle(0, 0, 34, 0xffffff, 0.08);
    this.interactionRadius.setStrokeStyle(1, 0xffffff, 0.28);

    this.npcBody = scene.add.circle(0, 0, 18, 0xf2d16b);
    this.npcBody.setStrokeStyle(2, 0x4f3b12, 0.9);

    this.nameLabel = scene.add.text(0, 28, npc.name, {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      stroke: '#1f3523',
      strokeThickness: 3,
    });
    this.nameLabel.setOrigin(0.5, 0);

    this.add([this.interactionRadius, this.npcBody, this.nameLabel]);
    this.setSize(68, 78);
    this.setInteractive({ useHandCursor: true });
    this.setDataEnabled();
    this.setData('npcId', this.npcId);
    this.setData('locationId', this.locationId);
    if (this.introLessonId) {
      this.setData('introLessonId', this.introLessonId);
    }

    this.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.setHighlighted(true);
    });
    this.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.setHighlighted(false);
    });

    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  public setHighlighted(isHighlighted: boolean): void {
    this.npcBody.setFillStyle(isHighlighted ? 0xffe08a : 0xf2d16b);
    this.npcBody.setStrokeStyle(isHighlighted ? 3 : 2, isHighlighted ? 0xffffff : 0x4f3b12, 0.95);
    this.interactionRadius.setAlpha(isHighlighted ? 0.9 : 1);
    this.interactionRadius.setStrokeStyle(isHighlighted ? 2 : 1, 0xffffff, isHighlighted ? 0.55 : 0.28);
    this.nameLabel.setColor(isHighlighted ? '#fff6c9' : '#ffffff');
  }

  public override destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
