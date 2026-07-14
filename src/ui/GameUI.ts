import { Container, Text, TextStyle, Graphics, BlurFilter } from 'pixi.js';
import { CONFIG, SkillDef } from '../config';

export interface SkillSlot {
  char: string;
  def: SkillDef;
  count: number;
}

/**
 * 游戏 HUD
 * - 血量条
 * - 波次信息
 * - 技能栏（下方可点击的文字技能）
 */
export class GameUI extends Container {
  private hpBar: Graphics;
  private hpText: Text;
  private waveText: Text;
  private enemyCountText: Text;
  private skillSlots: Map<string, SkillSlotUI> = new Map();
  private skillContainer: Container;
  private onSkillUse: ((char: string) => void) | null = null;
  private strokeCountText: Text;

  constructor() {
    super();

    // 波次信息（顶部）
    this.waveText = new Text({
      text: '第 1 波',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 18,
        fill: '#ffffff',
        fontWeight: 'bold',
      }),
    });
    this.waveText.position.set(CONFIG.WIDTH / 2, 20);
    this.waveText.anchor.set(0.5, 0);
    this.addChild(this.waveText);

    // 敌人数量
    this.enemyCountText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 14,
        fill: '#aaaaaa',
      }),
    });
    this.enemyCountText.position.set(CONFIG.WIDTH / 2, 42);
    this.enemyCountText.anchor.set(0.5, 0);
    this.addChild(this.enemyCountText);

    // 血量条（左上）
    this.hpText = new Text({
      text: 'HP 100/100',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 14,
        fill: '#ffffff',
      }),
    });
    this.hpText.position.set(15, 15);
    this.addChild(this.hpText);

    this.hpBar = new Graphics();
    this.hpBar.position.set(15, 32);
    this.addChild(this.hpBar);

    // 笔画数量（左上角）
    this.strokeCountText = new Text({
      text: '笔画: 0',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 12,
        fill: '#888888',
      }),
    });
    this.strokeCountText.position.set(15, 48);
    this.addChild(this.strokeCountText);

    // 技能栏（底部）
    this.skillContainer = new Container();
    this.skillContainer.position.set(0, CONFIG.HEIGHT - 90);
    this.addChild(this.skillContainer);
  }

  setOnSkillUse(fn: (char: string) => void) {
    this.onSkillUse = fn;
  }

  updateHP(current: number, max: number) {
    this.hpText.text = `HP ${Math.ceil(current)}/${max}`;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const ratio = Math.max(0, current / max);

    this.hpBar.clear();
    this.hpBar.roundRect(0, 0, 140 * ratio, 10, 4);
    const color = ratio > 0.5 ? 0x00ff88 : ratio > 0.25 ? 0xffaa00 : 0xff3300;
    this.hpBar.fill({ color, alpha: 0.8 });
    this.hpBar.roundRect(0, 0, 140, 10, 4);
    this.hpBar.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
  }

  updateWave(wave: number, total: number) {
    this.waveText.text = `第 ${wave} / ${total} 波`;
  }

  updateEnemyCount(count: number) {
    this.enemyCountText.text = `敌人: ${count}`;
  }

  updateStrokeCount(count: number) {
    this.strokeCountText.text = `笔画: ${count}`;
  }

  /** 更新技能栏 */
  updateSkills(slots: SkillSlot[]) {
    // 清除旧的
    this.skillContainer.removeChildren();
    this.skillSlots.clear();

    const maxVisible = 6;
    const visibleSlots = slots.slice(0, maxVisible);
    const slotW = 72;
    const totalW = visibleSlots.length * slotW;
    const startX = (CONFIG.WIDTH - totalW) / 2 + slotW / 2;

    visibleSlots.forEach((slot, i) => {
      const ui = new SkillSlotUI(slot, () => {
        this.onSkillUse?.(slot.char);
      });
      ui.x = startX + i * slotW;
      ui.y = 0;
      this.skillContainer.addChild(ui);
      this.skillSlots.set(slot.char, ui);
    });
  }

  showGameOver(isWin: boolean) {
    const text = new Text({
      text: isWin ? '🎉 胜利！' : '💀 失败',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 60,
        fill: isWin ? '#ffdd00' : '#ff3300',
        fontWeight: 'bold',
        dropShadow: {
          color: '#000000',
          blur: 16,
          distance: 0,
        },
      }),
    });
    text.anchor.set(0.5);
    text.position.set(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 40);
    this.addChild(text);

    const sub = new Text({
      text: '点击重新开始',
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 24,
        fill: '#aaaaaa',
      }),
    });
    sub.anchor.set(0.5);
    sub.position.set(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30);
    this.addChild(sub);
  }
}

/** 单个技能槽 UI */
class SkillSlotUI extends Container {
  private bg: Graphics;
  private charText: Text;
  private countText: Text;
  private descText: Text;

  constructor(slot: SkillSlot, onClick: () => void) {
    super();

    // 背景
    this.bg = new Graphics();
    this.bg.roundRect(-30, -30, 60, 60, 8);
    this.bg.fill({ color: 0x222222, alpha: 0.8 });
    this.bg.roundRect(-30, -30, 60, 60, 8);
    this.bg.stroke({ color: slot.def.color, alpha: 0.8, width: 2 });
    this.addChild(this.bg);

    // 文字
    this.charText = new Text({
      text: slot.char,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 28,
        fill: slot.def.color,
        fontWeight: 'bold',
        dropShadow: {
          color: slot.def.glowColor,
          blur: 8,
          distance: 0,
        },
      }),
    });
    this.charText.anchor.set(0.5);
    this.charText.y = -2;
    this.addChild(this.charText);

    // 数量
    this.countText = new Text({
      text: slot.count > 1 ? `×${slot.count}` : '',
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#ffffff',
        fontWeight: 'bold',
      }),
    });
    this.countText.anchor.set(0, 0.5);
    this.countText.position.set(32, -20);
    this.addChild(this.countText);

    // 描述
    this.descText = new Text({
      text: slot.def.desc,
      style: new TextStyle({
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 9,
        fill: '#999999',
      }),
    });
    this.descText.anchor.set(0.5, 0);
    this.descText.position.set(0, 34);
    this.addChild(this.descText);

    // 交互
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', onClick);
    this.on('pointerover', () => {
      this.bg.alpha = 1;
      this.scale.set(1.1);
    });
    this.on('pointerout', () => {
      this.bg.alpha = 0.8;
      this.scale.set(1);
    });
  }
}
