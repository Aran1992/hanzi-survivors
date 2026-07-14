import { CONFIG, SkillDef } from '../config';
import { SkillSlot } from '../ui/GameUI';

/**
 * 笔画收集与技能合成系统
 *
 * 核心逻辑：
 * 1. 玩家拾取笔画 → 存入库存
 * 2. 每次拾取后尝试匹配合成技能文字
 * 3. 合成的技能显示在技能栏
 * 4. 相同技能自动合并升级（火×2→炎，炎+火→焱…）
 * 5. 使用技能消耗一个技能字
 */
export class StrokeSystem {
  /** 玩家持有的原始笔画库存 */
  private inventory: Map<string, number> = new Map();

  /** 已合成的技能及数量（技能栏） */
  private formedSkills: Map<string, number> = new Map();

  /** 可用的技能定义（来自 config） */
  private skillDefs: Map<string, SkillDef> = new Map();

  /** 火系升级链 */
  private fireChain = ['火', '炎', '焱', '燚'];

  /** 总笔画收集数 */
  private totalStrokesCollected: number = 0;

  constructor() {
    // 加载所有技能定义
    for (const [char, def] of Object.entries(CONFIG.SKILLS)) {
      this.skillDefs.set(char, def);
    }
  }

  /** 添加笔画到库存 */
  addStroke(stroke: string): boolean {
    const current = this.inventory.get(stroke) ?? 0;
    this.inventory.set(stroke, current + 1);
    this.totalStrokesCollected++;

    // 尝试匹配合成
    return this.tryMatch();
  }

  /** 尝试从库存合成所有可能的技能 */
  private tryMatch(): boolean {
    let formed = false;

    // 遍历所有技能定义，尝试合成
    for (const [char, def] of this.skillDefs) {
      if (this.canForm(char, def)) {
        this.consumeFor(char, def);
        this.addFormedSkill(char);
        formed = true;
      }
    }

    // 尝试合并升级
    this.tryMerge();

    return formed;
  }

  /** 检查是否能合成某个技能 */
  private canForm(char: string, def: SkillDef): boolean {
    // 检查所需笔画/素材是否充足
    const needed = this.countNeededStrokes(def.strokes);
    return needed === 0;
  }

  /** 计算还缺多少笔画 */
  private countNeededStrokes(strokes: readonly string[]): number {
    // 临时统计可用库存
    const tempAvail = new Map(this.inventory);

    for (const s of strokes) {
      // 检查是否是已合成技能（用作素材，如十→卍）
      const formedCount = this.formedSkills.get(s) ?? 0;
      if (formedCount > 0) {
        // 使用已合成的技能
        continue;
      }

      const avail = tempAvail.get(s) ?? 0;
      if (avail === 0) return 1; // 缺乏
      tempAvail.set(s, avail - 1);
    }
    return 0;
  }

  /** 消耗笔画/素材来合成 */
  private consumeFor(char: string, def: SkillDef) {
    const tempInventory = new Map(this.inventory);

    for (const s of def.strokes) {
      const avail = tempInventory.get(s) ?? 0;
      if (avail > 0) {
        tempInventory.set(s, avail - 1);
        if (avail - 1 === 0) tempInventory.delete(s);
      }
    }

    this.inventory = tempInventory;
  }

  /** 添加一个已合成的技能到栏位 */
  private addFormedSkill(char: string) {
    const current = this.formedSkills.get(char) ?? 0;
    this.formedSkills.set(char, current + 1);
  }

  /** 尝试自动合并升级技能 */
  private tryMerge() {
    // 火系合并链
    for (let i = this.fireChain.length - 2; i >= 0; i--) {
      const lower = this.fireChain[i];
      const upper = this.fireChain[i + 1];
      const count = this.formedSkills.get(lower) ?? 0;

      if (count >= 2) {
        // 两个低级合成一个高级
        const mergeCount = Math.floor(count / 2);
        this.formedSkills.set(lower, count - mergeCount * 2);
        if (this.formedSkills.get(lower) === 0) {
          this.formedSkills.delete(lower);
        }
        const upperCount = this.formedSkills.get(upper) ?? 0;
        this.formedSkills.set(upper, upperCount + mergeCount);

        // 如果已经是最后一个（燚），多余的转回火
        if (i === this.fireChain.length - 2) {
          // 燚以上的合并没有意义，不用处理
        }
      }
    }

    // 十 → 卍 合并: 需要特殊处理
    // 十 的食谱是 [一, 丨]
    // 卍 的食谱是 [一, 一, 一, 丨, 丨, 丨]
    // 也可以由两个十合并...但食谱里有笔画，先保持原始逻辑
  }

  /** 使用技能（消耗一个） */
  useSkill(char: string): boolean {
    const count = this.formedSkills.get(char) ?? 0;
    if (count <= 0) return false;

    this.formedSkills.set(char, count - 1);
    if (count - 1 === 0) {
      this.formedSkills.delete(char);
    }
    return true;
  }

  /** 获取技能栏数据 */
  getSkillSlots(): SkillSlot[] {
    const slots: SkillSlot[] = [];
    for (const [char, count] of this.formedSkills) {
      if (count <= 0) continue;
      const def = this.skillDefs.get(char);
      if (def) {
        slots.push({ char, def, count });
      }
    }
    // 按等级排序
    slots.sort((a, b) => {
      const aIdx = this.fireChain.indexOf(a.char);
      const bIdx = this.fireChain.indexOf(b.char);
      if (aIdx !== -1 && bIdx !== -1) return bIdx - aIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
    return slots;
  }

  /** 获取原始笔画库存大小 */
  getStrokeCount(): number {
    let total = 0;
    for (const c of this.inventory.values()) total += c;
    return total;
  }

  /** 获取技能定义 */
  getSkillDef(char: string): SkillDef | undefined {
    return this.skillDefs.get(char);
  }
}
