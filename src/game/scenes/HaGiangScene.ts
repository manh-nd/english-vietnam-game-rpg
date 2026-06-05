import Phaser from 'phaser';

import { NpcSprite } from '../entities/NpcSprite';
import type { ContentDatabase } from '../systems/ContentDatabase';
import { NpcInteractionController } from '../systems/NpcInteractionController';
import type { LessonAnswerResult, LessonManager } from '../systems/LessonManager';
import type { NpcContent } from '../types/content';
import { DialogueBox } from '../ui/DialogueBox';

export class HaGiangScene extends Phaser.Scene {
  public static readonly key = 'HaGiangScene';

  private static readonly haGiangLocationId = 'ha_giang_loop';
  private static readonly npcPlacements: Readonly<Record<string, Phaser.Math.Vector2>> = {
    npc_may_guide: new Phaser.Math.Vector2(280, 220),
    npc_binh_mechanic: new Phaser.Math.Vector2(520, 260),
    npc_lan_homestay_host: new Phaser.Math.Vector2(430, 430),
  };
  private static readonly player_speed = 220;
  private static readonly interactionDistance = 82;

  private player?: Phaser.GameObjects.Rectangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private dialogueBox?: DialogueBox;
  private npcInteractionController?: NpcInteractionController;
  private interactionPromptText?: Phaser.GameObjects.Text;
  private npcSprites: NpcSprite[] = [];
  private nearestNpc?: NpcSprite;

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

    this.add.text(24, 60, 'Move with WASD or arrow keys. Click an NPC, or stand nearby and press E.', {
      color: '#eef7ee',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
    });

    this.createContentDebugText();
    this.createInteractionController();

    this.player = this.add.rectangle(400, 300, 34, 42, 0x2f5cff);
    this.player.setStrokeStyle(2, 0xffffff, 0.9);

    this.createAuthoredNpcs();
    this.createInteractionPrompt();
    this.createDialogueBox();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key> | undefined;
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  public update(_time: number, delta: number): void {
    if (!this.player) {
      return;
    }

    this.updateNearestNpcPrompt();

    if (this.dialogueBox?.isOpen()) {
      return;
    }

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearestNpc) {
      this.startNpcInteraction(this.nearestNpc.npcId);
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

  private createInteractionController(): void {
    const contentDatabase = this.registry.get('contentDatabase') as ContentDatabase | undefined;
    const lessonManager = this.registry.get('lessonManager') as LessonManager | undefined;

    if (!contentDatabase || !lessonManager) {
      return;
    }

    this.npcInteractionController = new NpcInteractionController(contentDatabase, lessonManager);
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

      const npcSprite = new NpcSprite({
        scene: this,
        npc,
        x: placement.x,
        y: placement.y,
      });
      npcSprite.on(NpcSprite.selectedEvent, (npcId: string) => {
        this.startNpcInteraction(npcId);
      });
      this.npcSprites.push(npcSprite);
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

  private createInteractionPrompt(): void {
    this.interactionPromptText = this.add.text(this.scale.width / 2, this.scale.height - 292, '', {
      align: 'center',
      color: '#fff6c9',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      stroke: '#1f3523',
      strokeThickness: 4,
    });
    this.interactionPromptText.setOrigin(0.5, 0.5);
    this.interactionPromptText.setScrollFactor(0);
    this.interactionPromptText.setDepth(900);
    this.interactionPromptText.setVisible(false);
  }

  private createDialogueBox(): void {
    this.dialogueBox = new DialogueBox(this);
    this.dialogueBox.on(DialogueBox.choiceSelectedEvent, (choiceIndex: number) => {
      const result = this.npcInteractionController?.answerCurrentLesson(choiceIndex);

      if (!result || !this.isLessonAnswerResult(result)) {
        return;
      }

      this.dialogueBox?.showAnswerResult(result);
    });
  }

  private startNpcInteraction(npcId: string): void {
    if (!this.npcInteractionController || !this.dialogueBox) {
      return;
    }

    const result = this.npcInteractionController.startNpcInteraction(npcId, HaGiangScene.haGiangLocationId);

    if (result.ok && result.npc && result.lesson) {
      this.dialogueBox.showLessonPrompt(result.npc.name, result.lesson);
    }
  }

  private updateNearestNpcPrompt(): void {
    if (!this.player || !this.interactionPromptText) {
      return;
    }

    let nearestNpc: NpcSprite | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.npcSprites.forEach((npcSprite) => {
      const distance = Phaser.Math.Distance.Between(this.player?.x ?? 0, this.player?.y ?? 0, npcSprite.x, npcSprite.y);

      if (distance <= HaGiangScene.interactionDistance && distance < nearestDistance) {
        nearestNpc = npcSprite;
        nearestDistance = distance;
      }
    });

    this.npcSprites.forEach((npcSprite) => {
      npcSprite.setHighlighted(npcSprite === nearestNpc);
    });

    this.nearestNpc = nearestNpc;

    if (!nearestNpc || this.dialogueBox?.isOpen()) {
      this.interactionPromptText.setVisible(false);
      return;
    }

    const contentDatabase = this.registry.get('contentDatabase') as ContentDatabase | undefined;
    const npc = contentDatabase?.getNpc(nearestNpc.npcId);
    this.interactionPromptText.setText(`Press E to talk to ${npc?.name ?? 'NPC'}`);
    this.interactionPromptText.setVisible(true);
  }

  private isLessonAnswerResult(result: LessonAnswerResult | object): result is LessonAnswerResult {
    return 'choiceIndex' in result && 'isCorrect' in result && 'npcLine' in result;
  }
}
