import Phaser from 'phaser';

import { NpcSprite } from '../entities/NpcSprite';
import type { ContentDatabase } from '../systems/ContentDatabase';
import { NpcInteractionController } from '../systems/NpcInteractionController';
import type { NpcInteractionResult, NpcInteractionStatus } from '../systems/NpcInteractionController';
import type { LessonAnswerResult, LessonManager } from '../systems/LessonManager';
import type { QuestManager, QuestUpdate } from '../systems/QuestManager';
import type { NpcContent, QuestRewardsContent } from '../types/content';
import { DialogueBox } from '../ui/DialogueBox';
import { RewardToast } from '../ui/RewardToast';

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
  private questStatusText?: Phaser.GameObjects.Text;
  private collectionSummaryText?: Phaser.GameObjects.Text;
  private rewardToast?: RewardToast;
  private questManager?: QuestManager;
  private latestQuestUpdateMessage = 'Quest progress will appear here.';
  private totalXP = 0;
  private readonly collectedVocab = new Set<string>();
  private readonly collectedPassportStamps = new Set<string>();
  private npcSprites: NpcSprite[] = [];
  private nearestNpc?: NpcSprite;
  private interactionInputPausedUntil = 0;

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
    this.initializeQuestProgression();

    this.player = this.add.rectangle(400, 300, 34, 42, 0x2f5cff);
    this.player.setStrokeStyle(2, 0xffffff, 0.9);

    this.createAuthoredNpcs();
    this.createInteractionPrompt();
    this.createQuestStatusHud();
    this.createCollectionSummaryHud();
    this.createRewardToast();
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

    if (
      this.interactKey &&
      this.time.now >= this.interactionInputPausedUntil &&
      Phaser.Input.Keyboard.JustDown(this.interactKey) &&
      this.nearestNpc
    ) {
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

    this.add.text(24, 92, `Content: ${contentDatabase.getLocations().length} locations · ${contentDatabase.getNpcs().length} NPCs · ${lessons.length} lessons`, {
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

    const debugLines = [`NPCs: ${renderedNpcCount}/${haGiangNpcs.length} ready.`];
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

  private initializeQuestProgression(): void {
    this.questManager = this.registry.get('questManager') as QuestManager | undefined;

    if (!this.questManager) {
      this.latestQuestUpdateMessage = 'QuestManager is not available yet.';
      return;
    }

    const startedUpdates = this.questManager
      .getQuests()
      .filter((quest) => quest.location_id === HaGiangScene.haGiangLocationId)
      .map((quest) => this.questManager?.startQuest(quest.id))
      .filter((update): update is QuestUpdate => update !== undefined && update.ok);

    this.latestQuestUpdateMessage =
      startedUpdates.length > 0
        ? `Started ${startedUpdates.length} Ha Giang quest${startedUpdates.length === 1 ? '' : 's'}.`
        : 'Ha Giang quests are already active.';
  }

  private createQuestStatusHud(): void {
    this.questStatusText = this.add.text(this.scale.width - 24, 24, '', {
      align: 'right',
      color: '#f4fff6',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
      stroke: '#1f3523',
      strokeThickness: 3,
      wordWrap: { width: 300 },
    });
    this.questStatusText.setOrigin(1, 0);
    this.questStatusText.setScrollFactor(0);
    this.questStatusText.setDepth(900);
    this.updateQuestStatusHud();
  }

  private handleQuestProgress(result: LessonAnswerResult): void {
    const currentNpcId = this.npcInteractionController?.getCurrentNpcId() ?? '';
    const updates = this.questManager?.handleLessonAnswered(currentNpcId, result.lessonId, result) ?? [];

    this.latestQuestUpdateMessage = this.createQuestUpdateMessage(updates);
    this.collectLessonRewards(result);
    this.collectQuestRewards(updates);
    this.showQuestRewardToast(updates);
    this.updateQuestStatusHud();
    this.updateCollectionSummaryHud();
  }

  private updateQuestStatusHud(): void {
    if (!this.questStatusText) {
      return;
    }

    const activeQuestCount = this.questManager?.getActiveQuests().length ?? 0;
    const completedQuestCount = this.questManager?.getCompletedQuests().length ?? 0;

    this.questStatusText.setText([
      `Active quests: ${activeQuestCount}`,
      `Completed quests: ${completedQuestCount}`,
      this.latestQuestUpdateMessage,
    ]);
  }

  private createCollectionSummaryHud(): void {
    this.collectionSummaryText = this.add.text(this.scale.width - 24, 116, '', {
      align: 'right',
      color: '#fff6c9',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      stroke: '#1f3523',
      strokeThickness: 3,
    });
    this.collectionSummaryText.setOrigin(1, 0);
    this.collectionSummaryText.setScrollFactor(0);
    this.collectionSummaryText.setDepth(900);
    this.updateCollectionSummaryHud();
  }

  private createRewardToast(): void {
    this.rewardToast = new RewardToast(this);
  }

  private updateCollectionSummaryHud(): void {
    this.collectionSummaryText?.setText(
      `XP: ${this.totalXP} · Vocab: ${this.collectedVocab.size} · Stamps: ${this.collectedPassportStamps.size}`,
    );
  }

  private collectLessonRewards(result: LessonAnswerResult): void {
    if (result.status !== 'correct' || !result.isCorrect) {
      return;
    }

    result.rewardVocab?.forEach((vocab) => {
      this.collectedVocab.add(vocab);
    });
  }

  private collectQuestRewards(updates: readonly QuestUpdate[]): void {
    updates
      .filter((update) => update.status === 'quest_completed')
      .forEach((update) => {
        const rewards = update.rewards;
        this.totalXP += rewards?.xp ?? 0;
        rewards?.vocab?.forEach((vocab) => {
          this.collectedVocab.add(vocab);
        });
        rewards?.passport_stamps?.forEach((stamp) => {
          this.collectedPassportStamps.add(stamp);
        });
      });
  }

  private showQuestRewardToast(updates: readonly QuestUpdate[]): void {
    const completedUpdate = updates.find((update) => update.status === 'quest_completed' && update.questId);

    if (!completedUpdate?.questId) {
      return;
    }

    this.rewardToast?.show(this.createQuestRewardLines(completedUpdate));
  }

  private createQuestRewardLines(update: QuestUpdate): readonly string[] {
    const questTitle = update.questId ? this.questManager?.getQuest(update.questId)?.title ?? update.questId : 'Quest';
    return [`Hoàn thành nhiệm vụ: ${questTitle}`, ...this.createRewardLines(update.rewards)];
  }

  private createRewardLines(rewards: QuestRewardsContent | undefined): readonly string[] {
    const lines: string[] = [];

    if (rewards?.xp) {
      lines.push(`+${rewards.xp} XP`);
    }

    if (rewards?.vocab && rewards.vocab.length > 0) {
      lines.push(`Từ vựng: ${rewards.vocab.join(', ')}`);
    }

    if (rewards?.passport_stamps && rewards.passport_stamps.length > 0) {
      lines.push(`Dấu hộ chiếu: ${rewards.passport_stamps.join(', ')}`);
    }

    return lines;
  }

  private createQuestUpdateMessage(updates: readonly QuestUpdate[]): string {
    if (updates.length === 0) {
      return 'No quest update.';
    }

    const completedUpdate = updates.find((update) => update.status === 'quest_completed');
    if (completedUpdate?.questId) {
      const questTitle = this.questManager?.getQuest(completedUpdate.questId)?.title ?? completedUpdate.questId;
      const xp = completedUpdate.rewards?.xp;
      return xp ? `Quest completed: ${questTitle} (+${xp} XP).` : `Quest completed: ${questTitle}.`;
    }

    const progressUpdate = updates.find((update) => update.status === 'ok' && update.progress);
    if (progressUpdate?.progress) {
      const questTitle =
        this.questManager?.getQuest(progressUpdate.progress.questId)?.title ?? progressUpdate.progress.questId;
      const completedLessonCount = progressUpdate.progress.completedLessonIds.length;
      const requiredLessonCount = progressUpdate.progress.requiredLessonIds.length;
      return `Quest progress: ${questTitle} (${completedLessonCount}/${requiredLessonCount}).`;
    }

    const firstUpdate = updates[0];
    if (firstUpdate.status === 'incorrect_answer') {
      return 'Quest unchanged. Try the lesson again.';
    }
    if (firstUpdate.status === 'lesson_not_required') {
      return 'Correct answer. No quest progress for this lesson.';
    }
    if (firstUpdate.status === 'quest_not_found') {
      return 'Quest progress unavailable: quest content was not found.';
    }
    if (firstUpdate.status === 'quest_not_active') {
      return 'Quest progress unchanged: the quest is not active.';
    }

    return 'Quest progress unchanged.';
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
    this.dialogueBox.on(DialogueBox.closedEvent, () => {
      this.npcInteractionController?.clear();
      this.interactionInputPausedUntil = this.time.now + 120;
    });
    this.dialogueBox.on(DialogueBox.choiceSelectedEvent, (choiceIndex: number) => {
      const result = this.npcInteractionController?.answerCurrentLesson(choiceIndex);

      if (!result) {
        return;
      }

      if (!this.isLessonAnswerResult(result)) {
        this.showInteractionFailure(result);
        return;
      }

      this.dialogueBox?.showAnswerResult(result);
      this.handleQuestProgress(result);
    });
  }

  private startNpcInteraction(npcId: string): void {
    if (!this.npcInteractionController || !this.dialogueBox || this.dialogueBox.isOpen()) {
      return;
    }

    const result = this.npcInteractionController.startNpcInteraction(npcId, HaGiangScene.haGiangLocationId);

    if (result.ok && result.npc && result.lesson) {
      this.dialogueBox.showLessonPrompt(result.npc.name, result.lesson);
      return;
    }

    this.showInteractionFailure(result);
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
    const progress = this.npcInteractionController?.getNpcLessonProgress(nearestNpc.npcId);
    const lessonProgressText = progress
      ? `${npc?.name ?? 'NPC'} lessons: ${progress.completedLessonIds.length}/${progress.availableLessonIds.length}`
      : undefined;

    this.interactionPromptText.setText([
      `Press E to talk to ${npc?.name ?? 'NPC'}`,
      ...(lessonProgressText ? [lessonProgressText] : []),
    ]);
    this.interactionPromptText.setVisible(true);
  }

  private showInteractionFailure(result: NpcInteractionResult): void {
    this.dialogueBox?.showSystemMessage('Interaction unavailable', this.getInteractionFailureMessage(result.status));
  }

  private getInteractionFailureMessage(status: NpcInteractionStatus): string {
    const messages: Record<NpcInteractionStatus, string> = {
      ok: 'Interaction is ready.',
      npc_not_found: 'NPC is not available.',
      npc_missing_intro_lesson: 'This NPC does not have a lesson yet.',
      npc_lessons_complete: 'You have finished this NPC’s lessons for now.',
      lesson_not_found: 'Lesson content is missing.',
      wrong_location: 'This lesson belongs to another location.',
    };

    return messages[status];
  }

  private isLessonAnswerResult(result: LessonAnswerResult | NpcInteractionResult): result is LessonAnswerResult {
    return 'choiceIndex' in result && 'isCorrect' in result && 'npcLine' in result;
  }
}
