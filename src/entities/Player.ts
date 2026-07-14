import { Container, Text, TextStyle, BlurFilter } from 'pixi.js';
import { CONFIG } from '../config';

/**
 * 玩家——「我」字
 * 带呼吸动画和外发光
 */
export class Player extends Container {
  public charText: Text;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public invincibleUntil: number = 0;

  private breathTime: number = 0;

  constructor() {
    super();

    this.maxHp = CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.speed = CONFIG.PLAYER.SPEED;

    // 文字渲染
    this.charText = new Text({
      text: CONFIG.PLAYER.CHAR,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: CONFIG.PLAYER.SIZE,
        fill: CONFIG.PLAYER.COLOR,
        fontWeight: 'bold',
        dropShadow: {
          color: '#000000',
          blur: 8,
          distance: 0,
        },
      }),
    });
    this.charText.anchor.set(0.5);
    this.addChild(this.charText);

    // 外发光
    this.filters = [
      new BlurFilter({ strength: 0 }),
    ];

    // 基础尺寸
    this.hitArea = { contains: () => false } as any;
  }

  update(dt: number) {
    // 呼吸动画：上下浮动，周期约 1.5s
    this.breathTime += dt;
    const breathOffset = Math.sin(this.breathTime * 3.5) * 3;
    this.charText.y = breathOffset;

    // 发光呼吸
    const glowIntensity = 0.5 + Math.sin(this.breathTime * 2.5) * 0.3;
    (this.filters![0] as BlurFilter).strength = glowIntensity * 4;
  }

  /** 受伤 */
  takeDamage(amount: number, now: number) {
    if (now < this.invincibleUntil) return false;
    this.hp -= amount;
    this.invincibleUntil = now + 0.3; // 0.3秒无敌
    // 闪白
    this.charText.style.fill = '#ffffff';
    setTimeout(() => {
      this.charText.style.fill = CONFIG.PLAYER.COLOR;
    }, 100);
    return true;
  }

  get isAlive() {
    return this.hp > 0;
  }
}
