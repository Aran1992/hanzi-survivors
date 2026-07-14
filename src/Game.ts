import { Application, Container, Graphics } from 'pixi.js';
import { CONFIG } from './config';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { Projectile } from './entities/Projectile';
import { Stroke } from './entities/Stroke';
import { Joystick } from './ui/Joystick';
import { GameUI } from './ui/GameUI';
import { StrokeSystem } from './systems/StrokeSystem';
import { WaveManager } from './systems/WaveManager';

export class Game {
  private app: Application;
  private gameLayer: Container;
  private enemyLayer: Container;
  private projectileLayer: Container;
  private strokeLayer: Container;
  private uiLayer: Container;

  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private strokes: Stroke[] = [];

  private joystick!: Joystick;
  private gameUI!: GameUI;
  private strokeSystem!: StrokeSystem;
  private waveManager!: WaveManager;

  private gameTime: number = 0;
  private autoFireTimer: number = 0;
  private autoFireInterval: number = 0.5;
  private gameOver: boolean = false;
  private gameStarted: boolean = false;

  /** 键盘模拟摇杆（PC 调试） */
  private keys: Set<string> = new Set();

  constructor(app: Application) {
    this.app = app;

    // 层级
    this.gameLayer = new Container();
    this.enemyLayer = new Container();
    this.projectileLayer = new Container();
    this.strokeLayer = new Container();
    this.uiLayer = new Container();

    app.stage.addChild(this.gameLayer);
    app.stage.addChild(this.enemyLayer);
    app.stage.addChild(this.projectileLayer);
    app.stage.addChild(this.strokeLayer);
    app.stage.addChild(this.uiLayer);

    // 背景
    const bg = new Graphics();
    bg.rect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.fill({ color: 0x0a0a12 });
    this.gameLayer.addChild(bg);

    // 网格背景装饰
    const grid = new Graphics();
    grid.stroke({ color: 0xffffff, alpha: 0.03, width: 1 });
    for (let x = 0; x <= CONFIG.WIDTH; x += 60) {
      grid.moveTo(x, 0);
      grid.lineTo(x, CONFIG.HEIGHT);
    }
    for (let y = 0; y <= CONFIG.HEIGHT; y += 60) {
      grid.moveTo(0, y);
      grid.lineTo(CONFIG.WIDTH, y);
    }
    this.gameLayer.addChild(grid);

    this.init();
  }

  private init() {
    this.player = new Player();
    this.player.position.set(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 100);
    this.gameLayer.addChild(this.player);

    this.joystick = new Joystick();
    this.uiLayer.addChild(this.joystick);

    this.gameUI = new GameUI();
    this.uiLayer.addChild(this.gameUI);

    this.strokeSystem = new StrokeSystem();
    this.waveManager = new WaveManager();

    // 技能点击回调
    this.gameUI.setOnSkillUse((char) => this.useSkill(char));

    // 键盘事件（PC 调试）
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));

    // 开始
    this.gameStarted = true;

    // 点击重新开始
    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointerdown', () => {
      if (this.gameOver) {
        this.restart();
      }
    });
  }

  restart() {
    // 清除所有实体
    this.enemies.forEach(e => this.enemyLayer.removeChild(e));
    this.enemies = [];
    this.projectiles.forEach(p => this.projectileLayer.removeChild(p));
    this.projectiles = [];
    this.strokes.forEach(s => this.strokeLayer.removeChild(s));
    this.strokes = [];

    // 重置玩家
    this.gameLayer.removeChild(this.player);
    this.player.destroy({ children: true });
    this.player = new Player();
    this.player.position.set(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 100);
    this.gameLayer.addChild(this.player);

    // 重置系统
    this.strokeSystem = new StrokeSystem();
    this.waveManager = new WaveManager();
    this.gameTime = 0;
    this.autoFireTimer = 0;
    this.gameOver = false;

    // 清除旧 UI
    // (simplest: rebuild gameUI)
    this.uiLayer.removeChildren();
    this.joystick = new Joystick();
    this.uiLayer.addChild(this.joystick);
    this.gameUI = new GameUI();
    this.uiLayer.addChild(this.gameUI);
    this.gameUI.setOnSkillUse((char) => this.useSkill(char));

    this.gameUI.updateHP(this.player.hp, this.player.maxHp);
  }

  update(dt: number) {
    if (!this.gameStarted || this.gameOver) return;

    this.gameTime += dt;

    // 1. 玩家移动
    this.updatePlayerMovement(dt);
    this.player.update(dt);

    // 2. 波次管理
    this.waveManager.update(dt);

    // 3. 生成敌人
    this.spawnEnemies(dt);

    // 4. 自动攻击
    this.updateAutoFire(dt);

    // 5. 投射物
    this.updateProjectiles(dt);

    // 6. 敌人行为
    this.updateEnemies(dt);

    // 7. 笔画更新
    this.updateStrokes(dt);

    // 8. 碰撞检测
    this.checkCollisions();

    // 9. 波次完成检查
    this.checkWave();

    // 10. UI 更新
    this.updateUI();

    // 11. 游戏结束检查
    this.checkGameOver();
  }

  private updatePlayerMovement(dt: number) {
    let dx = 0, dy = 0;

    // 摇杆
    if (this.joystick.active) {
      dx = this.joystick.dx;
      dy = this.joystick.dy;
    }

    // 键盘（调试用）
    if (this.keys.has('w') || this.keys.has('ArrowUp')) dy = -1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) dy = 1;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) dx = -1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) dx = 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const normDx = dx / len;
      const normDy = dy / len;
      this.player.x += normDx * this.player.speed * dt;
      this.player.y += normDy * this.player.speed * dt;
    }

    // 边界限制
    this.player.x = Math.max(30, Math.min(CONFIG.WIDTH - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(CONFIG.HEIGHT - 120, this.player.y));
  }

  private spawnEnemies(dt: number) {
    if (!this.waveManager.canSpawn()) return;

    const enemyData = this.waveManager.getNextEnemy();
    this.waveManager.consumeSpawn();

    const enemy = new Enemy({
      chars: [...enemyData.chars],
      color: enemyData.color,
      hp: enemyData.hp,
      speed: enemyData.speed,
    }, enemyData.type);

    // 从屏幕边缘生成
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // 上
        enemy.x = Math.random() * CONFIG.WIDTH;
        enemy.y = -40;
        break;
      case 1: // 下
        enemy.x = Math.random() * CONFIG.WIDTH;
        enemy.y = CONFIG.HEIGHT + 40;
        break;
      case 2: // 左
        enemy.x = -40;
        enemy.y = Math.random() * CONFIG.HEIGHT;
        break;
      case 3: // 右
        enemy.x = CONFIG.WIDTH + 40;
        enemy.y = Math.random() * CONFIG.HEIGHT;
        break;
    }

    this.enemyLayer.addChild(enemy);
    this.enemies.push(enemy);
  }

  private updateAutoFire(dt: number) {
    this.autoFireTimer -= dt;
    if (this.autoFireTimer > 0) return;
    this.autoFireTimer = this.autoFireInterval;

    // 朝最近敌人方向射击
    const target = this.findClosestEnemy();
    if (!target) return;

    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const angle = Math.atan2(dy, dx);

    // 基础子弹——「一」字形
    const proj = new Projectile('一', {
      damage: 5,
      speed: 400,
      size: 24,
      color: '#00ff88',
      glowColor: '#00ff88',
      type: 'basic',
      angle,
    });
    proj.position.set(this.player.x, this.player.y);
    this.projectileLayer.addChild(proj);
    this.projectiles.push(proj);
  }

  private useSkill(char: string) {
    if (!this.strokeSystem.useSkill(char)) return;
    const def = this.strokeSystem.getSkillDef(char);
    if (!def) return;

    const target = this.findClosestEnemy();
    if (!target) return;

    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const angle = Math.atan2(dy, dx);

    if (char === '卍') {
      // 回旋镖 - 围绕玩家旋转
      const proj = new Projectile(char, {
        damage: def.damage,
        speed: 0,
        size: def.size,
        color: def.color,
        glowColor: def.glowColor,
        type: 'boomerang',
      });
      proj.position.set(this.player.x, this.player.y);
      // 存储回旋镖元数据
      (proj as any).boomerangAngle = angle;
      (proj as any).boomerangRadius = 0;
      this.projectileLayer.addChild(proj);
      this.projectiles.push(proj);
    } else if (['炎', '焱', '燚'].includes(char)) {
      const countMap: Record<string, number> = { '炎': 2, '焱': 3, '燚': 4 };
      const count = countMap[char] ?? 2;
      const spread = Math.PI / 6;
      for (let i = 0; i < count; i++) {
        const a = angle - spread + (spread * 2 / (count - 1)) * i;
        const proj = new Projectile(char, {
          damage: def.damage,
          speed: def.speed,
          size: def.size,
          color: def.color,
          glowColor: def.glowColor,
          type: 'pierce',
          angle: a,
        });
        proj.position.set(this.player.x, this.player.y);
        this.projectileLayer.addChild(proj);
        this.projectiles.push(proj);
      }
    } else if (char === '火' || char === '小') {
      // 爆炸/穿透
      const proj = new Projectile(char, {
        damage: def.damage,
        speed: def.speed,
        size: def.size,
        color: def.color,
        glowColor: def.glowColor,
        type: def.type,
        angle,
      });
      proj.position.set(this.player.x, this.player.y);
      this.projectileLayer.addChild(proj);
      this.projectiles.push(proj);
    } else {
      // 默认：穿透型
      const proj = new Projectile(char, {
        damage: def.damage,
        speed: def.speed,
        size: def.size,
        color: def.color,
        glowColor: def.glowColor,
        type: def.type || 'pierce',
        angle,
      });
      proj.position.set(this.player.x, this.player.y);
      this.projectileLayer.addChild(proj);
      this.projectiles.push(proj);
    }

    // 更新技能栏
    this.gameUI.updateSkills(this.strokeSystem.getSkillSlots());
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // 回旋镖特殊处理：绕玩家旋转
      if (p.skillType === 'boomerang') {
        const bData = p as any;
        bData.boomerangRadius += dt * 60;
        bData.boomerangAngle += dt * 3;
        p.x = this.player.x + Math.cos(bData.boomerangAngle) * bData.boomerangRadius;
        p.y = this.player.y + Math.sin(bData.boomerangAngle) * bData.boomerangRadius;

        if (bData.boomerangRadius > 200) {
          p.lifetime = 0; // 超时
        }
      }

      // 边界/生命周期移除
      if (p.expired || p.x < -100 || p.x > CONFIG.WIDTH + 100 ||
          p.y < -100 || p.y > CONFIG.HEIGHT + 100) {
        this.projectileLayer.removeChild(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (!enemy.destroyed) {
        // 向玩家移动
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          enemy.x += (dx / len) * enemy.speed * dt;
          enemy.y += (dy / len) * enemy.speed * dt;
        }
        enemy.update(dt);
      }
    }

    // 移除已死亡的
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].destroyed) {
        this.enemyLayer.removeChild(this.enemies[i]);
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateStrokes(dt: number) {
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      s.update(dt);

      if (s.expired && !s.collected) {
        this.strokeLayer.removeChild(s);
        this.strokes.splice(i, 1);
        continue;
      }

      // 拾取检测（玩家靠近）
      if (!s.collected) {
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          s.collected = true;
          this.strokeSystem.addStroke(s.char);
          this.strokeLayer.removeChild(s);
          this.strokes.splice(i, 1);
        }
      }
    }
  }

  private checkCollisions() {
    // 投射物 vs 敌人
    for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
      const proj = this.projectiles[pi];
      if (proj.destroyed) continue;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (enemy.destroyed) continue;

        // 投射物已经穿透过的敌人
        if (proj.pierced.has(ei)) continue;

        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitDist = proj.skillType === 'basic' ? 25 : 30;

        if (dist < hitDist) {
          const killed = enemy.takeDamage(proj.damage);

          if (proj.skillType === 'pierce' || proj.skillType === 'basic') {
            proj.pierced.add(ei);
          } else {
            // 非穿透型：销毁
            this.projectileLayer.removeChild(proj);
            proj.destroy();
            this.projectiles.splice(pi, 1);
            break;
          }

          if (killed) {
            this.onEnemyKilled(enemy);
          }
        }
      }
    }

    // 敌人 vs 玩家
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.destroyed) continue;

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30) {
        this.player.takeDamage(enemy.damage, this.gameTime);
      }
    }
  }

  private onEnemyKilled(enemy: Enemy) {
    this.waveManager.onEnemyKilled();

    // 掉落笔画
    const dropCount = enemy.enemyType === 'boss' ? 6 : enemy.enemyType === 'elite' ? 3 : 1;
    for (let i = 0; i < dropCount; i++) {
      const stroke = new Stroke();
      stroke.position.set(
        enemy.x + (Math.random() - 0.5) * 30,
        enemy.y + (Math.random() - 0.5) * 30
      );
      this.strokeLayer.addChild(stroke);
      this.strokes.push(stroke);
    }

    enemy.destroy();
  }

  private checkWave() {
    if (this.waveManager.checkWaveComplete()) {
      if (this.waveManager.isFinished) {
        // 胜利！
        this.gameOver = true;
        this.gameUI.showGameOver(true);
      }
    }
  }

  private checkGameOver() {
    if (!this.player.isAlive && !this.gameOver) {
      this.gameOver = true;
      this.gameUI.showGameOver(false);
    }
  }

  private updateUI() {
    this.gameUI.updateHP(this.player.hp, this.player.maxHp);
    this.gameUI.updateWave(this.waveManager.currentWave, this.waveManager.totalWaves);
    this.gameUI.updateEnemyCount(this.enemies.length);
    this.gameUI.updateStrokeCount(this.strokeSystem.getStrokeCount());
    this.gameUI.updateSkills(this.strokeSystem.getSkillSlots());
  }

  private findClosestEnemy(): Enemy | null {
    let closest: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }
}
