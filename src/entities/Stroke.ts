import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { CONFIG } from '../config';

/** 所有可用笔画 */
const ALL_STROKES = ['一', '丨', '丿', '㇏', '丶', '亅', '人'];

/** 笔画的显示颜色 */
const STROKE_COLORS: Record<string, string> = {
  '一': '#ffcc44',
  '丨': '#44ccff',
  '丿': '#44ff88',
  '㇏': '#ff8844',
  '丶': '#ff4466',
  '亅': '#aa66ff',
  '人': '#66ffcc',
};

/**
 * 笔画掉落物——从敌人身上掉落，玩家拾取
 */
export class Stroke extends Container {
  public char: string;
  public lifetime: number;
  public age: number = 0;
  public collected: boolean = false;

  private text: Text;
  private bg: Graphics;

  constructor(stroke?: string) {
    super();

    this.char = stroke ?? ALL_STROKES[Math.floor(Math.random() * ALL_STROKES.length)];
    this.lifetime = CONFIG.STROKE.LIFETIME;

    // 背景圆（半透明）
    this.bg = new Graphics();
    this.bg.circle(0, 0, 14);
    this.bg.fill({ color: 0x222222, alpha: 0.5 });
    this.addChild(this.bg);

    // 文字
    this.text = new Text({
      text: this.char,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: CONFIG.STROKE.SIZE,
        fill: STROKE_COLORS[this.char] || '#ffffff',
        fontWeight: 'bold',
      }),
    });
    this.text.anchor.set(0.5);
    this.addChild(this.text);
  }

  update(dt: number) {
    this.age += dt;
    // 缓慢闪烁提醒即将消失
    if (this.age > this.lifetime - 2) {
      this.alpha = 0.3 + Math.sin(this.age * 8) * 0.3;
    }
  }

  get expired() {
    return this.age >= this.lifetime;
  }
}

export { ALL_STROKES, STROKE_COLORS };
