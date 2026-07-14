import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { CONFIG, EnemyConfig } from '../config';

export type EnemyType = 'single' | 'elite' | 'boss';

/**
 * 敌人——文字实体
 * 单字/双字精英/四字BOSS
 */
export class Enemy extends Container {
  public charDisplays: Text[] = [];
  public hp: number;
  public maxHp: number;
  public speed: number;
  public color: string;
  public enemyType: EnemyType;
  public damage: number;

  private breathTime: number = Math.random() * Math.PI * 2;
  private hpBar: Graphics;
  private enemyCfg: EnemyConfig;

  constructor(cfg: EnemyConfig, type: EnemyType) {
    super();
    this.enemyCfg = cfg;

    this.enemyType = type;
    this.color = cfg.color;
    this.maxHp = cfg.hp;
    this.hp = this.maxHp;
    this.speed = cfg.speed;
    this.damage = CONFIG.ENEMY.DAMAGE * (type === 'boss' ? 3 : type === 'elite' ? 1.5 : 1);

    // 血条
    this.hpBar = new Graphics();
    this.addChild(this.hpBar);

    // 构建文字显示
    this.buildChars(cfg.chars);

    // 外发光由 dropShadow 实现
  }

  private buildChars(chars: string[]) {
    const fontSize = chars.length === 4 ? 24 : chars.length === 2 ? 28 : CONFIG.PLAYER.SIZE * 0.9;
    const spacing = chars.length === 4 ? 24 : chars.length === 2 ? 30 : 0;

    if (chars.length === 4) {
      // BOSS: 2×2 方形排列
      const positions = [
        [-spacing / 2, -spacing / 2],
        [spacing / 2, -spacing / 2],
        [-spacing / 2, spacing / 2],
        [spacing / 2, spacing / 2],
      ];
      chars.forEach((ch, i) => {
        const t = this.makeText(ch, fontSize);
        t.position.set(positions[i][0], positions[i][1]);
        this.addChild(t);
        this.charDisplays.push(t);
      });
    } else if (chars.length === 2) {
      // 精英: 左右并排
      chars.forEach((ch, i) => {
        const t = this.makeText(ch, fontSize);
        t.position.set((i === 0 ? -1 : 1) * spacing / 2, 0);
        this.addChild(t);
        this.charDisplays.push(t);
      });
    } else {
      // 普通: 单个字
      const t = this.makeText(chars[0], fontSize);
      this.addChild(t);
      this.charDisplays.push(t);
    }
  }

  private makeText(ch: string, size: number): Text {
    return new Text({
      text: ch,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: size,
        fill: this.enemyCfg.color,
        fontWeight: 'bold',
        dropShadow: {
          color: '#000000',
          blur: 6,
          distance: 0,
        },
      }),
    });
  }

  update(dt: number) {
    // 呼吸动画
    this.breathTime += dt;
    const breathOffset = Math.sin(this.breathTime * 3) * 2;
    this.charDisplays.forEach(t => {
      t.y = breathOffset;
    });

    // 更新血条
    this.hpBar.clear();
    const barW = 40;
    const barH = 4;
    const barY = -(this.enemyType === 'boss' ? 60 : this.enemyType === 'elite' ? 50 : 30);
    this.hpBar.roundRect(-barW / 2, barY, barW, barH, 2);
    this.hpBar.fill({ color: 0x333333, alpha: 0.6 });
    this.hpBar.roundRect(-barW / 2, barY, barW * (this.hp / this.maxHp), barH, 2);
    this.hpBar.fill({ color: this.enemyCfg.color === '#ff4400' ? 0xff0000 : 0x44ff44 });
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    // 闪白
    this.charDisplays.forEach(t => {
      t.style.fill = '#ffffff';
    });
    setTimeout(() => {
      this.charDisplays.forEach(t => {
        t.style.fill = this.color;
      });
    }, 80);
    return this.hp <= 0;
  }
}
