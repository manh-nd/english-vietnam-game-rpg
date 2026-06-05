import Phaser from 'phaser';

import type { LessonAnswerResult } from '../systems/LessonManager';
import type { LessonContent } from '../types/content';

interface ChoiceRow {
  readonly background: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;
}

type ChoiceResultState = 'none' | 'retry' | 'correct';

const choiceRowHeight = 42;
const choiceRowGap = 8;
const choiceStartY = 94;
const choiceSubmitDebounceMs = 150;

export class DialogueBox extends Phaser.GameObjects.Container {
  public static readonly choiceSelectedEvent = 'choiceSelected';
  public static readonly closedEvent = 'closed';

  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly npcNameText: Phaser.GameObjects.Text;
  private readonly npcLineText: Phaser.GameObjects.Text;
  private readonly feedbackText: Phaser.GameObjects.Text;
  private readonly closeInstructionText: Phaser.GameObjects.Text;
  private readonly keyboardKeys?: {
    readonly up: Phaser.Input.Keyboard.Key;
    readonly down: Phaser.Input.Keyboard.Key;
    readonly enter: Phaser.Input.Keyboard.Key;
    readonly space: Phaser.Input.Keyboard.Key;
    readonly escape: Phaser.Input.Keyboard.Key;
  };

  private choiceRows: ChoiceRow[] = [];
  private choiceTexts: string[] = [];
  private selectedChoiceIndex = 0;
  private submittedChoiceIndex: number | undefined;
  private resultState: ChoiceResultState = 'none';
  private nextChoiceSubmitAt = 0;
  private open = false;
  private answeredCorrectly = false;

  public constructor(scene: Phaser.Scene) {
    const width = Math.min(scene.scale.width - 48, 720);
    const height = 330;
    const x = (scene.scale.width - width) / 2;
    const y = scene.scale.height - height - 24;

    super(scene, x, y);

    this.background = scene.add.rectangle(0, 0, width, height, 0x16231c, 0.94);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(3, 0xf4d17a, 0.95);

    this.npcNameText = scene.add.text(18, 14, '', {
      color: '#ffe08a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
    });

    this.npcLineText = scene.add.text(18, 44, '', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      lineSpacing: 4,
      wordWrap: { width: width - 36 },
    });

    this.feedbackText = scene.add.text(18, 242, '', {
      color: '#d9f7df',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
      wordWrap: { width: width - 36 },
    });

    this.closeInstructionText = scene.add.text(width - 18, height - 22, 'Esc để đóng', {
      color: '#b9c8be',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
    });
    this.closeInstructionText.setOrigin(1, 0.5);

    this.add([
      this.background,
      this.npcNameText,
      this.npcLineText,
      this.feedbackText,
      this.closeInstructionText,
    ]);

    this.setScrollFactor(0);
    this.setDepth(1000);
    this.setVisible(false);
    this.setActive(false);

    this.keyboardKeys = scene.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as DialogueBox['keyboardKeys'];

    this.registerKeyboardInput();
    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  public showLessonPrompt(npcName: string, lesson: LessonContent): void {
    this.clearChoices();
    this.choiceTexts = [...lesson.choices];
    this.selectedChoiceIndex = 0;
    this.submittedChoiceIndex = undefined;
    this.resultState = 'none';
    this.nextChoiceSubmitAt = 0;
    this.answeredCorrectly = false;

    this.npcNameText.setText(npcName);
    this.npcLineText.setText(lesson.npc_line);
    this.feedbackText.setColor('#d9f7df');
    this.feedbackText.setText(lesson.hint ? `Gợi ý: ${lesson.hint}` : 'Chọn câu trả lời phù hợp nhất.');
    this.closeInstructionText.setText('↑/↓ chọn · Enter/Space trả lời · Esc đóng');

    lesson.choices.forEach((choice, index) => {
      this.createChoiceRow(choice, index);
    });

    this.open = true;
    this.setVisible(true);
    this.setActive(true);
    this.updateChoiceHighlights();
  }

  public showAnswerResult(result: LessonAnswerResult): void {
    const feedbackLines: string[] = [];

    if (this.choiceTexts[result.choiceIndex] !== undefined) {
      this.submittedChoiceIndex = result.choiceIndex;
    }

    if (result.status === 'correct') {
      this.answeredCorrectly = true;
      this.resultState = 'correct';
      feedbackLines.push('✓ Đúng rồi!');
    } else if (result.status === 'incorrect') {
      this.resultState = 'retry';
      feedbackLines.push('↺ Chưa đúng, thử lại nhé.');
    } else if (result.status === 'invalid_choice') {
      this.resultState = 'retry';
      feedbackLines.push('Chưa chọn được câu này, thử lại nhé.');
    } else if (result.status === 'wrong_location') {
      this.resultState = 'retry';
      feedbackLines.push('Bài học này thuộc địa điểm khác.');
    } else {
      this.resultState = 'retry';
      feedbackLines.push('Bài học này chưa sẵn sàng.');
    }

    if (result.selectedChoice) {
      feedbackLines.push(`Bạn đã chọn: ${result.selectedChoice}`);
    }

    if ((result.status === 'incorrect' || result.status === 'invalid_choice') && result.correctChoice) {
      feedbackLines.push(`Đáp án phù hợp: ${result.correctChoice}`);
    }

    if (result.explanationVi) {
      feedbackLines.push(`Giải thích: ${result.explanationVi}`);
    }

    if (result.hint && result.status !== 'correct') {
      feedbackLines.push(`Gợi ý: ${result.hint}`);
    }

    this.feedbackText.setColor(result.status === 'correct' ? '#bff5c7' : '#ffe9a8');
    this.feedbackText.setText(feedbackLines.join('\n'));
    this.updateChoiceHighlights();
  }

  public showSystemMessage(title: string, message: string): void {
    this.clearChoices();
    this.answeredCorrectly = false;
    this.submittedChoiceIndex = undefined;
    this.resultState = 'none';
    this.nextChoiceSubmitAt = 0;
    this.selectedChoiceIndex = 0;
    this.npcNameText.setText(title);
    this.npcLineText.setText(message);
    this.feedbackText.setColor('#d9f7df');
    this.feedbackText.setText('Esc để đóng');
    this.closeInstructionText.setText('Esc để đóng');
    this.open = true;
    this.setVisible(true);
    this.setActive(true);
  }

  public close(): void {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.answeredCorrectly = false;
    this.submittedChoiceIndex = undefined;
    this.resultState = 'none';
    this.nextChoiceSubmitAt = 0;
    this.setVisible(false);
    this.setActive(false);
    this.emit(DialogueBox.closedEvent);
  }

  public isOpen(): boolean {
    return this.open;
  }

  private registerKeyboardInput(): void {
    if (!this.keyboardKeys) {
      return;
    }

    this.keyboardKeys.up.on('down', () => {
      this.moveSelectedChoice(-1);
    });
    this.keyboardKeys.down.on('down', () => {
      this.moveSelectedChoice(1);
    });
    this.keyboardKeys.enter.on('down', () => {
      this.confirmSelectedChoice();
    });
    this.keyboardKeys.space.on('down', () => {
      this.confirmSelectedChoice();
    });
    this.keyboardKeys.escape.on('down', () => {
      if (this.isOpen()) {
        this.close();
      }
    });
  }

  private createChoiceRow(choice: string, index: number): void {
    const rowY = choiceStartY + index * (choiceRowHeight + choiceRowGap);
    const rowWidth = this.background.width - 36;
    const background = this.scene.add.rectangle(18, rowY, rowWidth, choiceRowHeight, 0x263b30, 0.95);
    background.setOrigin(0, 0);
    background.setStrokeStyle(1, 0x8da894, 0.8);
    background.setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(28, rowY + 7, `${index + 1}. ${choice}`, {
      color: '#f4fff6',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      lineSpacing: 2,
      wordWrap: { width: rowWidth - 20 },
    });

    background.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.selectedChoiceIndex = index;
      this.updateChoiceHighlights();
    });
    background.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.selectChoice(index);
    });
    text.setInteractive({ useHandCursor: true });
    text.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.selectedChoiceIndex = index;
      this.updateChoiceHighlights();
    });
    text.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.selectChoice(index);
    });

    this.choiceRows.push({ background, text });
    this.add([background, text]);
  }

  private clearChoices(): void {
    this.choiceRows.forEach((row) => {
      row.background.destroy();
      row.text.destroy();
    });
    this.choiceRows = [];
    this.choiceTexts = [];
    this.submittedChoiceIndex = undefined;
    this.resultState = 'none';
  }

  private moveSelectedChoice(direction: number): void {
    if (!this.isOpen() || this.answeredCorrectly || this.choiceRows.length === 0) {
      return;
    }

    this.selectedChoiceIndex = Phaser.Math.Wrap(this.selectedChoiceIndex + direction, 0, this.choiceRows.length);
    this.updateChoiceHighlights();
  }

  private confirmSelectedChoice(): void {
    if (!this.isOpen() || this.answeredCorrectly || this.choiceRows.length === 0) {
      return;
    }

    this.selectChoice(this.selectedChoiceIndex);
  }

  private selectChoice(choiceIndex: number): void {
    const choiceText = this.choiceTexts[choiceIndex];

    if (!this.isOpen() || this.answeredCorrectly || choiceText === undefined || this.scene.time.now < this.nextChoiceSubmitAt) {
      return;
    }

    this.selectedChoiceIndex = choiceIndex;
    this.submittedChoiceIndex = choiceIndex;
    this.resultState = 'none';
    this.nextChoiceSubmitAt = this.scene.time.now + choiceSubmitDebounceMs;
    this.updateChoiceHighlights();
    this.emit(DialogueBox.choiceSelectedEvent, choiceIndex, choiceText);
  }

  private updateChoiceHighlights(): void {
    this.choiceRows.forEach((row, index) => {
      const isSelected = index === this.selectedChoiceIndex;
      const isSubmitted = index === this.submittedChoiceIndex;
      const isCorrectResult = isSubmitted && this.resultState === 'correct';
      const isRetryResult = isSubmitted && this.resultState === 'retry';
      const isLocked = this.answeredCorrectly;

      if (isCorrectResult) {
        row.background.setFillStyle(0x1f5d35, 0.98);
        row.background.setStrokeStyle(2, 0xa7f3b5, 0.95);
        row.text.setColor('#e9ffed');
        return;
      }

      if (isRetryResult) {
        row.background.setFillStyle(0x5a3f23, 0.98);
        row.background.setStrokeStyle(2, 0xffd38a, 0.95);
        row.text.setColor('#fff0c7');
        return;
      }

      row.background.setFillStyle(isLocked ? 0x223027 : isSelected ? 0x3b5f47 : 0x263b30, 0.95);
      row.background.setStrokeStyle(isSelected ? 2 : 1, isLocked ? 0x6f8275 : isSelected ? 0xffe08a : 0x8da894, 0.9);
      row.text.setColor(isLocked ? '#8fa096' : isSelected ? '#fff3a8' : '#f4fff6');
    });
  }
}
