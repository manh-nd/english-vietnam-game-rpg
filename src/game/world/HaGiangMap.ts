import Phaser from 'phaser';

export interface HaGiangMapLayout {
  readonly playableBounds: Phaser.Geom.Rectangle;
  readonly obstacles: readonly Phaser.Geom.Rectangle[];
}

interface WorldLabelOptions {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly width?: number;
}

interface SignpostOptions extends WorldLabelOptions {
  readonly direction?: 'left' | 'right';
}

export class HaGiangMap {
  private readonly scene: Phaser.Scene;
  private readonly playableBounds: Phaser.Geom.Rectangle;
  private readonly obstacles: Phaser.Geom.Rectangle[] = [];

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.playableBounds = new Phaser.Geom.Rectangle(48, 104, scene.scale.width - 96, scene.scale.height - 136);
  }

  public draw(): HaGiangMapLayout {
    this.drawGroundWash();
    this.drawMountainBackdrop();
    this.drawRoad();
    this.drawLocationAreas();
    this.drawObstacleVisuals();
    this.drawBoundaryHint();

    return {
      playableBounds: this.playableBounds,
      obstacles: this.obstacles,
    };
  }

  private drawGroundWash(): void {
    this.scene.add.rectangle(400, 328, 720, 448, 0x5dad5b, 0.28).setDepth(0);
    this.scene.add.rectangle(400, 328, 682, 410, 0x74bf66, 0.18).setDepth(0);
  }

  private drawMountainBackdrop(): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(1);

    graphics.fillStyle(0x2f6f47, 0.7);
    graphics.fillTriangle(32, 164, 160, 44, 282, 164);
    graphics.fillTriangle(548, 148, 682, 38, 820, 148);
    graphics.fillTriangle(604, 220, 760, 92, 882, 220);

    graphics.fillStyle(0x386f4c, 0.68);
    graphics.fillTriangle(18, 556, 158, 420, 300, 556);
    graphics.fillTriangle(560, 556, 710, 398, 846, 556);

    graphics.fillStyle(0x8ed6a0, 0.55);
    graphics.fillEllipse(138, 176, 220, 74);
    graphics.fillEllipse(682, 164, 238, 82);
    graphics.fillEllipse(126, 520, 232, 78);
    graphics.fillEllipse(704, 520, 240, 86);
  }

  private drawRoad(): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(2);

    this.strokeRoadPath(graphics, 56, 0xc79a5c, 0.92, [
      new Phaser.Math.Vector2(112, 476),
      new Phaser.Math.Vector2(210, 410),
      new Phaser.Math.Vector2(270, 354),
      new Phaser.Math.Vector2(360, 342),
      new Phaser.Math.Vector2(480, 326),
      new Phaser.Math.Vector2(500, 250),
      new Phaser.Math.Vector2(632, 196),
    ]);

    this.strokeRoadPath(graphics, 34, 0xe3c88c, 0.95, [
      new Phaser.Math.Vector2(112, 476),
      new Phaser.Math.Vector2(210, 410),
      new Phaser.Math.Vector2(270, 354),
      new Phaser.Math.Vector2(360, 342),
      new Phaser.Math.Vector2(480, 326),
      new Phaser.Math.Vector2(500, 250),
      new Phaser.Math.Vector2(632, 196),
    ]);

    this.strokeRoadPath(graphics, 4, 0xf7e6b7, 0.35, [
      new Phaser.Math.Vector2(124, 462),
      new Phaser.Math.Vector2(224, 396),
      new Phaser.Math.Vector2(282, 362),
      new Phaser.Math.Vector2(372, 350),
      new Phaser.Math.Vector2(486, 336),
      new Phaser.Math.Vector2(514, 266),
      new Phaser.Math.Vector2(644, 208),
    ]);
  }

  private strokeRoadPath(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    color: number,
    alpha: number,
    points: readonly Phaser.Math.Vector2[],
  ): void {
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);

    for (let index = 0; index <= 28; index += 1) {
      const t = index / 28;
      const point = this.getRoadPoint(points, t);
      graphics.lineTo(point.x, point.y);
    }

    graphics.strokePath();
  }

  private getRoadPoint(points: readonly Phaser.Math.Vector2[], t: number): Phaser.Math.Vector2 {
    const firstSegmentEnd = 0.52;
    const segmentStart = t <= firstSegmentEnd ? 0 : 3;
    const segmentT = t <= firstSegmentEnd ? t / firstSegmentEnd : (t - firstSegmentEnd) / (1 - firstSegmentEnd);

    return this.getCubicPoint(
      points[segmentStart],
      points[segmentStart + 1],
      points[segmentStart + 2],
      points[segmentStart + 3],
      segmentT,
    );
  }

  private getCubicPoint(
    start: Phaser.Math.Vector2,
    controlOne: Phaser.Math.Vector2,
    controlTwo: Phaser.Math.Vector2,
    end: Phaser.Math.Vector2,
    t: number,
  ): Phaser.Math.Vector2 {
    const inverseT = 1 - t;
    const startWeight = inverseT * inverseT * inverseT;
    const controlOneWeight = 3 * inverseT * inverseT * t;
    const controlTwoWeight = 3 * inverseT * t * t;
    const endWeight = t * t * t;

    return new Phaser.Math.Vector2(
      start.x * startWeight + controlOne.x * controlOneWeight + controlTwo.x * controlTwoWeight + end.x * endWeight,
      start.y * startWeight + controlOne.y * controlOneWeight + controlTwo.y * controlTwoWeight + end.y * endWeight,
    );
  }

  private drawLocationAreas(): void {
    this.drawViewpointArea();
    this.drawMechanicStallArea();
    this.drawHomestayArea();
  }

  private drawViewpointArea(): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(3);
    graphics.fillStyle(0x7dc7a6, 0.86);
    graphics.fillRoundedRect(172, 142, 178, 120, 18);
    graphics.lineStyle(3, 0xdff5dc, 0.55);
    graphics.strokeRoundedRect(172, 142, 178, 120, 18);
    graphics.fillStyle(0x55695a, 0.88);
    graphics.fillCircle(220, 218, 12);
    graphics.fillCircle(306, 186, 10);
    graphics.fillStyle(0xf5f0d6, 0.82);
    graphics.fillRect(258, 156, 54, 8);

    this.drawSignpost({ x: 186, y: 118, text: 'Viewpoint', direction: 'right' });
  }

  private drawMechanicStallArea(): void {
    const stall = new Phaser.Geom.Rectangle(578, 248, 74, 58);
    this.obstacles.push(stall);

    const graphics = this.scene.add.graphics();
    graphics.setDepth(3);
    graphics.fillStyle(0xb9a275, 0.55);
    graphics.fillRoundedRect(506, 210, 176, 124, 16);
    graphics.fillStyle(0x8e5337, 0.94);
    graphics.fillRect(stall.x, stall.y, stall.width, stall.height);
    graphics.fillStyle(0xd9b15c, 0.96);
    graphics.fillRect(stall.x - 8, stall.y - 16, stall.width + 16, 20);
    graphics.fillStyle(0x323c44, 0.85);
    graphics.fillCircle(536, 286, 13);
    graphics.fillCircle(560, 286, 13);
    graphics.lineStyle(3, 0x323c44, 0.7);
    graphics.strokeRect(522, 266, 52, 16);

    this.drawSignpost({ x: 526, y: 186, text: 'Mechanic', direction: 'right' });
  }

  private drawHomestayArea(): void {
    const house = new Phaser.Geom.Rectangle(490, 416, 104, 74);
    this.obstacles.push(house);

    const graphics = this.scene.add.graphics();
    graphics.setDepth(3);
    graphics.fillStyle(0x8bcf76, 0.68);
    graphics.fillRoundedRect(392, 374, 236, 142, 20);
    graphics.fillStyle(0x7c4830, 0.98);
    graphics.fillRect(house.x, house.y, house.width, house.height);
    graphics.fillStyle(0xb65b3f, 1);
    graphics.fillTriangle(476, house.y + 8, 542, 368, 610, house.y + 8);
    graphics.fillStyle(0xf5d28b, 0.95);
    graphics.fillRect(530, 450, 24, 40);
    graphics.fillStyle(0xffefb0, 0.85);
    graphics.fillRect(502, 436, 18, 16);
    graphics.fillRect(566, 436, 18, 16);

    this.drawSignpost({ x: 386, y: 350, text: 'Homestay', direction: 'right' });
  }

  private drawObstacleVisuals(): void {
    const rockRects = [
      new Phaser.Geom.Rectangle(96, 166, 70, 54),
      new Phaser.Geom.Rectangle(654, 112, 58, 50),
      new Phaser.Geom.Rectangle(104, 500, 76, 46),
      new Phaser.Geom.Rectangle(680, 488, 72, 52),
    ];
    this.obstacles.push(...rockRects);

    const graphics = this.scene.add.graphics();
    graphics.setDepth(4);
    graphics.fillStyle(0x5c6a5e, 0.94);
    rockRects.forEach((rock) => {
      graphics.fillRoundedRect(rock.x, rock.y, rock.width, rock.height, 14);
      graphics.lineStyle(2, 0x263b2c, 0.38);
      graphics.strokeRoundedRect(rock.x, rock.y, rock.width, rock.height, 14);
    });
  }

  private drawBoundaryHint(): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(5);
    graphics.lineStyle(2, 0xe5ffd5, 0.18);
    graphics.strokeRoundedRect(
      this.playableBounds.x,
      this.playableBounds.y,
      this.playableBounds.width,
      this.playableBounds.height,
      24,
    );
  }

  private drawSignpost({ x, y, text, direction = 'right' }: SignpostOptions): void {
    const arrowOffset = direction === 'right' ? 76 : -10;

    this.scene.add.rectangle(x, y + 30, 6, 44, 0x67462f, 0.98).setDepth(7);
    this.scene.add
      .rectangle(x + 48, y + 9, 104, 28, 0xf4dfa6, 0.98)
      .setDepth(7)
      .setStrokeStyle(2, 0x6f4f32, 0.85);
    this.scene.add
      .triangle(x + arrowOffset, y + 9, 0, 0, direction === 'right' ? 18 : -18, 14, 0, 28, 0xf4dfa6, 0.98)
      .setDepth(7)
      .setStrokeStyle(2, 0x6f4f32, 0.85);
    this.drawWorldLabel({ x: x + 48, y: y + 9, text, width: 96 });
  }

  private drawWorldLabel({ x, y, text, width = 110 }: WorldLabelOptions): void {
    const label = this.scene.add.text(x, y, text, {
      align: 'center',
      color: '#3f2d21',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      wordWrap: { width },
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(8);
  }
}
