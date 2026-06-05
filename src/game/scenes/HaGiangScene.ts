import Phaser from 'phaser';

export class HaGiangScene extends Phaser.Scene {
  public static readonly key = 'HaGiangScene';

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

    this.player = this.add.rectangle(400, 300, 34, 42, 0x2f5cff);
    this.player.setStrokeStyle(2, 0xffffff, 0.9);

    this.createPlaceholderNpc(280, 220, 'Guide');
    this.createPlaceholderNpc(520, 260, 'Vendor');
    this.createPlaceholderNpc(430, 430, 'Traveler');

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

  private createPlaceholderNpc(x: number, y: number, label: string): void {
    this.add.circle(x, y, 18, 0xf2d16b).setStrokeStyle(2, 0x4f3b12, 0.9);
    this.add.text(x, y + 28, label, {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
    }).setOrigin(0.5, 0);
  }
}
