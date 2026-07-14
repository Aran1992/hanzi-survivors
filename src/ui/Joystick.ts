import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { CONFIG } from '../config';

/**
 * 虚拟摇杆
 * 固定位置，触摸/鼠标拖拽控制方向
 */
export class Joystick extends Container {
  public dx: number = 0;
  public dy: number = 0;
  public active: boolean = false;

  private base: Graphics;
  private knob: Graphics;
  private isDragging: boolean = false;
  private baseRadius: number;
  private knobRadius: number;
  private centerX: number;
  private centerY: number;

  constructor() {
    super();

    this.centerX = CONFIG.JOYSTICK.POS_X;
    this.centerY = CONFIG.JOYSTICK.POS_Y;
    this.baseRadius = CONFIG.JOYSTICK.BASE_RADIUS;
    this.knobRadius = CONFIG.JOYSTICK.KNOB_RADIUS;

    // 底座（半透明圆环）
    this.base = new Graphics();
    this.base.circle(this.centerX, this.centerY, this.baseRadius);
    this.base.fill({ color: 0xffffff, alpha: 0.1 });
    this.base.circle(this.centerX, this.centerY, this.baseRadius);
    this.base.stroke({ color: 0xffffff, alpha: 0.2, width: 2 });
    this.addChild(this.base);

    // 摇杆头
    this.knob = new Graphics();
    this.knob.circle(this.centerX, this.centerY, this.knobRadius);
    this.knob.fill({ color: 0xffffff, alpha: 0.3 });
    this.addChild(this.knob);

    // 交互
    this.eventMode = 'static';
    this.hitArea = {
      contains: (x: number, y: number) => {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return dx * dx + dy * dy <= (this.baseRadius * 2) * (this.baseRadius * 2);
      },
    };

    this.on('pointerdown', this.onDown, this);
    this.on('pointermove', this.onMove, this);
    this.on('pointerup', this.onUp, this);
    this.on('pointerupoutside', this.onUp, this);
  }

  private onDown(e: FederatedPointerEvent) {
    this.isDragging = true;
    this.active = true;
    this.updateKnob(e);
  }

  private onMove(e: FederatedPointerEvent) {
    if (this.isDragging) {
      this.updateKnob(e);
    }
  }

  private onUp() {
    this.isDragging = false;
    this.active = false;
    this.dx = 0;
    this.dy = 0;
    this.knob.x = this.centerX;
    this.knob.y = this.centerY;
  }

  private updateKnob(e: FederatedPointerEvent) {
    const globalPos = e.getLocalPosition(this.parent!);
    let dx = globalPos.x - this.centerX;
    let dy = globalPos.y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.baseRadius) {
      dx = (dx / dist) * this.baseRadius;
      dy = (dy / dist) * this.baseRadius;
    }

    this.knob.x = this.centerX + dx;
    this.knob.y = this.centerY + dy;

    // 归一化方向向量 (-1 ~ 1)
    if (dist > 5) {
      this.dx = dx / this.baseRadius;
      this.dy = dy / this.baseRadius;
    } else {
      this.dx = 0;
      this.dy = 0;
    }
  }
}
