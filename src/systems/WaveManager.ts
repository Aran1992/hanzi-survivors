import { CONFIG, EnemyConfig } from '../config';

export interface WaveState {
  currentWave: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  enemiesThisWave: number;
  eliteThisWave: number;
  bossThisWave: number;
  spawnTimer: number;
  betweenWaves: boolean;
  betweenTimer: number;
  finished: boolean;
}

/**
 * 波次管理
 * 20波，逐步增加难度
 */
export class WaveManager {
  public state: WaveState;

  private waveEnemyPool: EnemyConfig[];

  constructor() {
    this.state = this.createState(1);
    this.waveEnemyPool = [];
    this.generatePool(1);
  }

  private createState(wave: number): WaveState {
    const enemyCount = CONFIG.WAVES.ENEMIES_PER_WAVE(wave);
    return {
      currentWave: wave,
      enemiesSpawned: 0,
      enemiesKilled: 0,
      enemiesThisWave: enemyCount,
      eliteThisWave: wave >= CONFIG.WAVES.ELITE_WAVE_START ? Math.floor(enemyCount * 0.15) : 0,
      bossThisWave: (CONFIG.WAVES.BOSS_WAVES as number[]).includes(wave) ? 1 : 0,
      spawnTimer: 0,
      betweenWaves: false,
      betweenTimer: 0,
      finished: false,
    };
  }

  /** 生成敌人池（决定本波出哪些敌人） */
  private generatePool(wave: number) {
    this.waveEnemyPool = CONFIG.ENEMY.POOL_SINGLE.map(e => ({
      chars: [e.char],
      color: e.color,
      hp: e.hp,
      speed: e.speed,
    }));
  }

  /** 获取下一个要生成的敌人配置 */
  getNextEnemy(): { chars: readonly string[]; color: string; hp: number; speed: number; type: 'single' | 'elite' | 'boss' } {
    // BOSS 优先级最高
    if (this.state.bossThisWave > 0 && this.state.enemiesSpawned >= this.state.enemiesThisWave - 1) {
      this.state.bossThisWave--;
      const boss = CONFIG.ENEMY.POOL_BOSS[
        Math.floor(Math.random() * CONFIG.ENEMY.POOL_BOSS.length)
      ];
      return { ...boss, type: 'boss' };
    }

    // 精英
    if (this.state.eliteThisWave > 0 &&
        this.state.enemiesSpawned > 2 &&
        this.state.enemiesSpawned % 5 === 0) {
      this.state.eliteThisWave--;
      const elite = CONFIG.ENEMY.POOL_ELITE[
        Math.floor(Math.random() * CONFIG.ENEMY.POOL_ELITE.length)
      ];
      return { ...elite, type: 'elite' };
    }

    // 普通敌人
    const single = this.waveEnemyPool[
      Math.floor(Math.random() * this.waveEnemyPool.length)
    ];
    return { ...single, type: 'single' };
  }

  /** 帧更新 */
  update(dt: number) {
    if (this.state.finished) return;

    if (this.state.betweenWaves) {
      this.state.betweenTimer -= dt;
      if (this.state.betweenTimer <= 0) {
        this.advanceWave();
      }
      return;
    }

    // 是否所有敌人生完且杀完了
    if (this.state.enemiesSpawned >= this.state.enemiesThisWave) {
      // 等所有敌人都死了再进下一波
      return;
    }

    // 生成计时器
    this.state.spawnTimer -= dt;
  }

  /** 是否可以生成新的敌人 */
  canSpawn(): boolean {
    return !this.state.betweenWaves &&
           !this.state.finished &&
           this.state.spawnTimer <= 0 &&
           this.state.enemiesSpawned < this.state.enemiesThisWave;
  }

  /** 消费一次生成 */
  consumeSpawn() {
    const interval = CONFIG.WAVES.SPAWN_INTERVAL(this.state.currentWave);
    this.state.spawnTimer = interval;
    this.state.enemiesSpawned++;
  }

  /** 记录敌人被击杀 */
  onEnemyKilled() {
    this.state.enemiesKilled++;
  }

  /** 检查是否该进入下一波 */
  checkWaveComplete(): boolean {
    if (this.state.betweenWaves) return false;
    if (this.state.finished) return false;

    const allSpawned = this.state.enemiesSpawned >= this.state.enemiesThisWave;
    const isLast = this.state.currentWave >= CONFIG.WAVES.TOTAL;

    if (allSpawned) {
      if (isLast && this.state.enemiesKilled >= this.state.enemiesThisWave) {
        this.state.finished = true;
        return true;
      }
      if (this.state.enemiesKilled >= this.state.enemiesThisWave) {
        this.state.betweenWaves = true;
        this.state.betweenTimer = CONFIG.WAVES.WAVE_INTERVAL;
      }
    }

    return false;
  }

  /** 前进到下一波 */
  private advanceWave() {
    const next = this.state.currentWave + 1;
    if (next > CONFIG.WAVES.TOTAL) {
      this.state.finished = true;
      return;
    }
    this.state = this.createState(next);
    this.state.betweenWaves = false;
    this.generatePool(next);
  }

  get currentWave() {
    return this.state.currentWave;
  }

  get totalWaves() {
    return CONFIG.WAVES.TOTAL;
  }

  get isFinished() {
    return this.state.finished;
  }
}
