import Phaser from 'phaser';

const toastWidth = 330;
const padding = 14;
const minToastHeight = 74;
const lineHeight = 21;
const autoHideDelayMs = 4000;

export class RewardToast extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly messageText: Phaser.GameObjects.Text;
  private hideEvent?: Phaser.Time.TimerEvent;

  public constructor(scene: Phaser.Scene) {
    const x = scene.scale.width - toastWidth - 24;
    const y = 96;

    super(scene, x, y);

    this.background = scene.add.rectangle(
      0,
      0,
      toastWidth,
      minToastHeight,
      0x173324,
      0.94,
    );
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0xf4d17a, 0.95);

    this.messageText = scene.add.text(padding, padding, '', {
      color: '#f4fff6',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
      wordWrap: { width: toastWidth - padding * 2 },
    });

    this.add([this.background, this.messageText]);
    this.setScrollFactor(0);
    this.setDepth(950);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this as Phaser.GameObjects.GameObject);
  }

  public show(lines: readonly string[]): void {
    if (lines.length === 0) {
      this.hide();
      return;
    }

    const text = lines.join('\n');
    const height = Math.max(
      minToastHeight,
      padding * 2 + lines.length * lineHeight,
    );

    this.messageText.setText(text);
    this.background.setSize(toastWidth, height);
    this.setVisible(true);
    this.setActive(true);

    this.hideEvent?.remove(false);
    this.hideEvent = this.scene.time.delayedCall(autoHideDelayMs, () => {
      this.hide();
    });
  }

  public hide(): void {
    this.hideEvent?.remove(false);
    this.hideEvent = undefined;
    this.messageText.setText('');
    this.setVisible(false);
    this.setActive(false);
  }

  public isVisible(): boolean {
    return this.visible;
  }
}
