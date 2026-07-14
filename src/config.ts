/** 游戏全局配置 */
export const CONFIG = {
  /** 逻辑分辨率（竖屏 9:16） */
  WIDTH: 540,
  HEIGHT: 960,

  /** 玩家 */
  PLAYER: {
    CHAR: '我',
    SIZE: 48,
    SPEED: 200,
    MAX_HP: 100,
    COLOR: '#00ff88',
    GLOW_COLOR: '#00ff88',
  },

  /** 虚拟摇杆 */
  JOYSTICK: {
    BASE_RADIUS: 60,
    KNOB_RADIUS: 25,
    ALPHA: 0.4,
    POS_X: 540 / 2,
    POS_Y: 960 - 120,
  },

  /** 敌人 */
  ENEMY: {
    BASE_SPEED: 60,
    BASE_HP: 3,
    SPAWN_INTERVAL: 1.5,       // 初始生成间隔(秒)
    SPAWN_INTERVAL_MIN: 0.3,
    DAMAGE: 5,                  // 碰撞伤害
    /** 普通敌人生成权重 */
    POOL_SINGLE: [
      { char: '僵', color: '#66aa66', hp: 3, speed: 50 },
      { char: '尸', color: '#88aa88', hp: 2, speed: 60 },
      { char: '魔', color: '#9966cc', hp: 4, speed: 55 },
      { char: '鬼', color: '#aa66aa', hp: 3, speed: 70 },
      { char: '狼', color: '#cc8844', hp: 3, speed: 80 },
      { char: '虎', color: '#cc6600', hp: 5, speed: 65 },
      { char: '豺', color: '#aa7744', hp: 3, speed: 75 },
      { char: '豹', color: '#cc8822', hp: 4, speed: 85 },
      { char: '蛇', color: '#44aa44', hp: 2, speed: 90 },
      { char: '蝎', color: '#8844aa', hp: 3, speed: 70 },
      { char: '妖', color: '#ff66aa', hp: 4, speed: 60 },
      { char: '怪', color: '#66aa44', hp: 5, speed: 50 },
      { char: '骷', color: '#888888', hp: 3, speed: 40 },
      { char: '髅', color: '#999999', hp: 3, speed: 45 },
    ],
    /** 精英双字敌人（自带合体效果） */
    POOL_ELITE: [
      { chars: ['僵', '尸'], color: '#44cc44', hp: 15, speed: 55 },
      { chars: ['魔', '鬼'], color: '#8844cc', hp: 18, speed: 60 },
      { chars: ['豺', '狼'], color: '#dd9933', hp: 16, speed: 70 },
      { chars: ['虎', '豹'], color: '#ee7711', hp: 20, speed: 65 },
      { chars: ['妖', '怪'], color: '#ff55aa', hp: 17, speed: 55 },
      { chars: ['骷', '髅'], color: '#777777', hp: 22, speed: 45 },
    ],
    /** BOSS 四字敌人 */
    POOL_BOSS: [
      { chars: ['豺', '狼', '虎', '豹'], color: '#ff4400', hp: 80, speed: 40 },
      { chars: ['魑', '魅', '魍', '魉'], color: '#cc00ff', hp: 100, speed: 35 },
    ],
  },

  /** 子弹 */
  PROJECTILE: {
    SPEED: 400,
    SIZE: 28,
    LIFETIME: 2.0,  // 秒
  },

  /** 笔画掉落 */
  STROKE: {
    SIZE: 20,
    LIFETIME: 8.0,  // 秒
    SPEED: 30,       // 飘散速度
  },

  /** 可合成的技能文字 */
  SKILLS: {
    '十': {
      strokes: ['一', '丨'],
      damage: 10,
      speed: 500,
      size: 32,
      color: '#ffdd00',
      glowColor: '#ffdd00',
      type: 'pierce',  // 穿透
      cooldown: 0.5,
      desc: '十字镖',
    },
    '卍': {
      strokes: ['一', '一', '丨', '丨', '十'],
      damage: 15,
      speed: 0,     // 不移动
      size: 48,
      color: '#ffaa00',
      glowColor: '#ffaa00',
      type: 'boomerang',
      cooldown: 0.3,
      desc: '卍回旋镖',
    },
    '小': {
      strokes: ['亅', '丿', '丶'],
      damage: 8,
      speed: 350,
      size: 24,
      color: '#ff6644',
      glowColor: '#ff6644',
      type: 'pierce',
      cooldown: 0.8,
      desc: '小火花',
    },
    '火': {
      strokes: ['小', '人'],
      damage: 15,
      speed: 300,
      size: 36,
      color: '#ff3300',
      glowColor: '#ff4400',
      type: 'explode',  // 爆炸
      cooldown: 0.6,
      desc: '火球',
    },
    '炎': {
      strokes: ['火', '火'],
      damage: 20,
      speed: 320,
      size: 40,
      color: '#ff2200',
      glowColor: '#ff6600',
      type: 'dual',
      cooldown: 0.5,
      desc: '双重火球',
    },
    '焱': {
      strokes: ['炎', '火'],
      damage: 25,
      speed: 340,
      size: 44,
      color: '#ff1100',
      glowColor: '#ff8800',
      type: 'triple',
      cooldown: 0.4,
      desc: '三重火球',
    },
    '燚': {
      strokes: ['焱', '火'],
      damage: 35,
      speed: 360,
      size: 52,
      color: '#ff0000',
      glowColor: '#ffaa00',
      type: 'quad',
      cooldown: 0.3,
      desc: '四火大爆炸',
    },
  },

  /** 波次 */
  WAVES: {
    TOTAL: 20,
    /** 每波敌人数量 */
    ENEMIES_PER_WAVE: (wave: number) => Math.floor(8 + wave * 2.5),
    /** 精英出现波次（从第5波开始） */
    ELITE_WAVE_START: 5,
    /** BOSS 出现波次 */
    BOSS_WAVES: [10, 20],
    /** 波次间隔(秒) */
    WAVE_INTERVAL: 3,
    /** 每波内生成间隔 */
    SPAWN_INTERVAL: (wave: number) => Math.max(0.3, 1.5 - wave * 0.06),
  },
};

export interface EnemyConfig {
  chars: string[];
  color: string;
  hp: number;
  speed: number;
}

export interface SkillDef {
  strokes: readonly string[];
  damage: number;
  speed: number;
  size: number;
  color: string;
  glowColor: string;
  type: string;
  cooldown: number;
  desc: string;
}
