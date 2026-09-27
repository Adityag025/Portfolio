/* Desert Dash — endless runner for the Lab section.
   Data-driven config, object pooling (no allocation in the loop), a
   ready/playing/over state machine, delta-time physics, and a rAF loop
   that pauses when the tab or the section isn't visible. */

const CONFIG = {
  gravity: 2600,
  jumpVelocity: -860,
  baseSpeed: 330,
  speedRamp: 9,
  maxSpeed: 760,
  spawnGapMin: 0.75,
  spawnGapMax: 1.5,
  groundRatio: 0.8,
  playerXRatio: 0.11,
  playerSize: 34,
  hitboxMargin: 5,
  poolSize: 6,
  canvasHeight: 260,
  scoreRate: 0.055,
  colors: {
    sky: '#0d0d10',
    dune: '#16161b',
    duneFar: '#121216',
    ground: '#1e293b',
    player: '#f97316',
    playerFace: '#0a0a0c',
    cactus: '#71717a',
    dot: 'rgba(244, 244, 245, 0.07)',
  },
  storageKey: 'ag-desert-dash-hi',
};

export type GameEls = {
  canvas: HTMLCanvasElement;
  frame: HTMLElement;
  overlay: HTMLElement;
  title: HTMLElement;
  sub: HTMLElement;
  score: HTMLElement;
  hi: HTMLElement;
};

const readHi = () => {
  try { return Number(localStorage.getItem(CONFIG.storageKey)) || 0; } catch { return 0; }
};
const writeHi = (v: number) => {
  try { localStorage.setItem(CONFIG.storageKey, String(Math.floor(v))); } catch { /* storage blocked */ }
};

export function initGame(els: GameEls): () => void {
  const { canvas, frame, overlay, title, sub } = els;
  const ctx = canvas.getContext('2d')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  const height = CONFIG.canvasHeight;
  let groundY = 0;
  let state: 'ready' | 'playing' | 'over' = 'ready';
  let speed = CONFIG.baseSpeed;
  let score = 0;
  let shownScore = -1;
  let hiScore = readHi();
  els.hi.textContent = String(Math.floor(hiScore));

  const player = { y: 0, vy: 0, grounded: true, squash: 0 };
  const obstacles = Array.from({ length: CONFIG.poolSize }, () => ({ active: false, x: 0, w: 0, h: 0, arms: false }));
  let spawnTimer = 0;
  let duneOffset = 0;
  let dotOffset = 0;

  function resize() {
    width = canvas.parentElement!.getBoundingClientRect().width;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = height * CONFIG.groundRatio;
    if (state !== 'playing') { player.y = groundY; draw(); }
  }

  function reset() {
    speed = CONFIG.baseSpeed;
    score = 0;
    shownScore = -1;
    spawnTimer = 0.4;
    player.y = groundY;
    player.vy = 0;
    player.grounded = true;
    obstacles.forEach((o) => (o.active = false));
  }

  function start() {
    reset();
    state = 'playing';
    overlay.dataset.hidden = 'true';
  }

  function gameOver() {
    state = 'over';
    if (score > hiScore) {
      hiScore = score;
      writeHi(hiScore);
      els.hi.textContent = String(Math.floor(hiScore));
      title.textContent = 'New high score';
    } else {
      title.textContent = 'Game over';
    }
    sub.textContent = `Score ${Math.floor(score)}. Press Space or tap to retry.`;
    overlay.dataset.hidden = 'false';
    if (!reduced) {
      frame.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
        { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    }
  }

  function jump() {
    if (!player.grounded) return;
    player.vy = CONFIG.jumpVelocity;
    player.grounded = false;
    player.squash = -0.25;
  }

  const onAction = () => (state === 'playing' ? jump() : start());

  let inView = false;
  const onKey = (e: KeyboardEvent) => {
    if (!inView) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.querySelector('dialog[open]')) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      onAction();
    }
  };
  const onPointer = (e: PointerEvent) => { e.preventDefault(); onAction(); };

  function update(dt: number) {
    speed = Math.min(speed + CONFIG.speedRamp * dt, CONFIG.maxSpeed);
    score += speed * dt * CONFIG.scoreRate;
    duneOffset = (duneOffset + speed * 0.35 * dt) % 160;
    dotOffset = (dotOffset + speed * 0.15 * dt) % 40;

    player.vy += CONFIG.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY) {
      if (!player.grounded) player.squash = 0.3;
      player.y = groundY;
      player.vy = 0;
      player.grounded = true;
    }
    player.squash *= Math.max(0, 1 - dt * 10);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const slot = obstacles.find((o) => !o.active);
      if (slot) {
        slot.active = true;
        slot.w = 16 + Math.random() * 12;
        slot.h = 28 + Math.random() * 30;
        slot.arms = slot.h > 42;
        slot.x = width + slot.w;
      }
      const f = speed / CONFIG.maxSpeed;
      const gap = CONFIG.spawnGapMax - (CONFIG.spawnGapMax - CONFIG.spawnGapMin) * f;
      spawnTimer = gap * (0.85 + Math.random() * 0.5);
    }

    const m = CONFIG.hitboxMargin;
    const px = width * CONFIG.playerXRatio;
    const ps = CONFIG.playerSize;
    for (const o of obstacles) {
      if (!o.active) continue;
      o.x -= speed * dt;
      if (o.x + o.w < 0) { o.active = false; continue; }
      const hit = px + m < o.x + o.w - m && px + ps - m > o.x + m && player.y - m > groundY - o.h;
      if (hit) { gameOver(); return; }
    }

    const floored = Math.floor(score);
    if (floored !== shownScore) {
      shownScore = floored;
      els.score.textContent = String(floored);
    }
  }

  function drawDunes(offset: number, baseY: number, amp: number, period: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-period, height);
    for (let x = -period - offset; x < width + period; x += period) {
      ctx.quadraticCurveTo(x + period / 2, baseY - amp, x + period, baseY);
    }
    ctx.lineTo(width + period, height);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    const c = CONFIG.colors;
    ctx.fillStyle = c.sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = c.dot;
    for (let x = -dotOffset; x < width; x += 40) {
      for (let y = 20; y < groundY - 30; y += 40) ctx.fillRect(x, y, 2, 2);
    }
    drawDunes(duneOffset * 0.5, groundY - 8, 26, 220, c.duneFar);
    drawDunes(duneOffset, groundY - 2, 16, 160, c.dune);

    ctx.strokeStyle = c.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + CONFIG.playerSize + 1);
    ctx.lineTo(width, groundY + CONFIG.playerSize + 1);
    ctx.stroke();

    ctx.fillStyle = c.cactus;
    for (const o of obstacles) {
      if (!o.active) continue;
      const top = groundY + CONFIG.playerSize - o.h;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 4);
      ctx.fill();
      if (o.arms) {
        ctx.beginPath();
        ctx.roundRect(o.x - 6, top + 10, 6, o.h * 0.3, 3);
        ctx.roundRect(o.x + o.w, top + 16, 6, o.h * 0.25, 3);
        ctx.fill();
      }
    }

    const px = width * CONFIG.playerXRatio;
    const ps = CONFIG.playerSize;
    const sq = player.squash;
    const w = ps * (1 + sq);
    const h = ps * (1 - sq);
    const x = px - (w - ps) / 2;
    const y = player.y + (ps - h);
    ctx.fillStyle = c.player;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = c.playerFace;
    ctx.fillRect(x + w * 0.55, y + h * 0.25, 4, 8);
    ctx.fillRect(x + w * 0.78, y + h * 0.25, 4, 8);
  }

  let rafId: number | null = null;
  let lastTime = 0;
  function loop(t: number) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (state === 'playing') update(dt);
    draw();
  }
  function setRunning(run: boolean) {
    if (run && rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    } else if (!run && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    setRunning(inView && !document.hidden);
  }, { threshold: 0.2 });
  const onVis = () => setRunning(inView && !document.hidden);

  resize();
  reset();
  draw();
  io.observe(canvas);
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);
  document.addEventListener('visibilitychange', onVis);

  return () => {
    setRunning(false);
    io.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerdown', onPointer);
    document.removeEventListener('visibilitychange', onVis);
  };
}
