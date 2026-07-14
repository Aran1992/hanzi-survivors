import { Application } from 'pixi.js';
import { CONFIG } from './config';
import { Game } from './Game';

async function init() {
  const app = new Application();

  await app.init({
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    backgroundColor: 0x0a0a12,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas as HTMLCanvasElement);

  // 自适应缩放
  function resize() {
    const canvas = app.canvas as HTMLCanvasElement;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scaleX = winW / CONFIG.WIDTH;
    const scaleY = winH / CONFIG.HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    canvas.style.width = `${CONFIG.WIDTH * scale}px`;
    canvas.style.height = `${CONFIG.HEIGHT * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(winW - CONFIG.WIDTH * scale) / 2}px`;
    canvas.style.top = `${(winH - CONFIG.HEIGHT * scale) / 2}px`;
  }

  window.addEventListener('resize', resize);
  resize();

  // 启动游戏
  const game = new Game(app);

  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime / 60; // 归一化 dt（秒）
    game.update(Math.min(dt, 0.05)); // cap dt
  });
}

init().catch(console.error);
