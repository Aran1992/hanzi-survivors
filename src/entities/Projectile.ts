import { Container, Text, TextStyle } from 'pixi.js';

/**
 * 技能投射物——文字子弹
 */
export class Projectile extends Container {
  public vx: number;
  public vy: number;
  public damage: number;
  public lifetime: number;
  public age: number = 0;
  public skillType: string;
  public textDisplay: Text;
  public pierced: Set<number> = new Set();

  constructor(
    char: string,
    opts: {
      damage: number;
      speed: number;
      size: number;
      color: string;
      glowColor: string;
      type: string;
      vx?: number;
      vy?: number;
      angle?: number;
    }
  ) {
    super();

    this.damage = opts.damage;
    this.skillType = opts.type;
    this.lifetime = 3.0;

    this.textDisplay = new Text({
      text: char,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: opts.size,
        fill: opts.color,
        fontWeight: 'bold',
        dropShadow: {
          color: opts.glowColor,
          blur: 10,
          distance: 0,
        },
      }),
    });
    this.textDisplay.anchor.set(0.5);
    this.addChild(this.textDisplay);

    // 方向
    if (opts.vx !== undefined && opts.vy !== undefined) {
      this.vx = opts.vx;
      this.vy = opts.vy;
    } else if (opts.angle !== undefined) {
      this.vx = Math.cos(opts.angle) * opts.speed;
      this.vy = Math.sin(opts.angle) * opts.speed;
    } else {
      this.vx = 0;
      this.vy = -opts.speed;
    }
  }

  update(dt: number) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 旋转特效
    this.textDisplay.rotation += dt * 3;
  }

  get expired() {
    return this.age >= this.lifetime;
  }
}
