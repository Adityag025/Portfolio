/* ============================================================
   Desert Dash — endless runner for the Lab section
   Applied patterns: data-driven config (no magic numbers in
   logic), object pooling (no allocation in the loop), state
   machine (ready/playing/over), delta-time physics, rAF loop
   paused when the tab or section is not visible.
   ============================================================ */

import anime from 'animejs/lib/anime.es.js';

const CONFIG = {
  gravity: 2600,          // px/s²
  jumpVelocity: -860,     // px/s
  baseSpeed: 330,         // px/s
  speedRamp: 9,           // +px/s per second survived
  maxSpeed: 760,
  spawnGapMin: 0.75,      // seconds between obstacles at max speed
  spawnGapMax: 1.5,
  groundRatio: 0.8,       // ground y as fraction of canvas height
  playerXRatio: 0.11,
  playerSize: 34,
  hitboxMargin: 5,        // collision forgiveness, px
  poolSize: 6,
  canvasHeight: 260,
  scoreRate: 0.055,       // score points per px travelled
  colors: {
    sky: '#fdf8f4',
    dune: '#f4e0d2',
    duneFar: '#f8eadd',
    ground: '#d7c2b5',
    player: '#c2652a',
    playerFace: '#fdf8f4',
    cactus: '#221a14',
    dot: 'rgba(194, 101, 42, 0.18)',
  },
  storageKey: 'ag-desert-dash-hi',
};

const canvas = document.getElementById('gameCanvas');

if (canvas) {
  const ctx = canvas.getContext('2d');
  const frame = document.getElementById('gameFrame');
  const overlay = document.getElementById('gameOverlay');
  const overlayTitle = document.getElementById('gameOverlayTitle');
  const overlaySub = document.getElementById('gameOverlaySub');
  const scoreEl = document.getElementById('gameScore');
  const hiScoreEl = document.getElementById('gameHiScore');

  let width = 0;
  let height = CONFIG.canvasHeight;
  let groundY = 0;

  /* ---------- state ---------- */
  let state = 'ready'; // ready | playing | over
  let speed = CONFIG.baseSpeed;
  let score = 0;
  let shownScore = -1;
  let hiScore = Number(localStorage.getItem(CONFIG.storageKey)) || 0;
  hiScoreEl.textContent = Math.floor(hiScore);

  /* ---------- player ---------- */
  const player = { y: 0, vy: 0, grounded: true, squash: 0 };

  /* ---------- obstacle pool (fixed size, reused) ---------- */
  const obstacles = Array.from({ length: CONFIG.poolSize }, () => ({
    active: false, x: 0, w: 0, h: 0, arms: false,
  }));
  let spawnTimer = 0;

  /* ---------- parallax scroll offsets ---------- */
  let duneOffset = 0;
  let dotOffset = 0;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = CONFIG.canvasHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = height * CONFIG.groundRatio;
  }
  resize();
  window.addEventListener('resize', resize);

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
    overlay.classList.add('hidden');
  }

  function gameOver() {
    state = 'over';
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem(CONFIG.storageKey, String(Math.floor(hiScore)));
      hiScoreEl.textContent = Math.floor(hiScore);
      overlayTitle.textContent = 'New High Score!';
    } else {
      overlayTitle.textContent = 'Game Over';
    }
    overlaySub.textContent = `Score ${Math.floor(score)} — Space or tap to retry`;
    overlay.classList.remove('hidden');
    anime({
      targets: frame,
      translateX: [0, -8, 8, -5, 5, 0],
      duration: 420,
      easing: 'easeOutQuad',
    });
    anime({
      targets: overlay,
      opacity: [0, 1],
      scale: [0.94, 1],
      duration: 450,
      easing: 'easeOutBack',
    });
  }

  function jump() {
    if (!player.grounded) return;
    player.vy = CONFIG.jumpVelocity;
    player.grounded = false;
    player.squash = -0.25; // stretch upward on takeoff
  }

  function onAction() {
    if (state === 'playing') jump();
    else start();
  }

  /* ---------- input ---------- */
  let inView = false;
  window.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      onAction();
    }
  });
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    onAction();
  });

  /* ---------- update ---------- */
  function update(dt) {
    speed = Math.min(speed + CONFIG.speedRamp * dt, CONFIG.maxSpeed);
    score += speed * dt * CONFIG.scoreRate;

    duneOffset = (duneOffset + speed * 0.35 * dt) % 160;
    dotOffset = (dotOffset + speed * 0.15 * dt) % 40;

    // player physics
    player.vy += CONFIG.gravity * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY) {
      if (!player.grounded) player.squash = 0.3; // squash on landing
      player.y = groundY;
      player.vy = 0;
      player.grounded = true;
    }
    player.squash *= Math.max(0, 1 - dt * 10); // decay to neutral

    // spawn obstacles from the pool
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
      const speedFactor = speed / CONFIG.maxSpeed;
      const gap = CONFIG.spawnGapMax - (CONFIG.spawnGapMax - CONFIG.spawnGapMin) * speedFactor;
      spawnTimer = gap * (0.85 + Math.random() * 0.5);
    }

    // move + collide
    const m = CONFIG.hitboxMargin;
    const px = width * CONFIG.playerXRatio;
    const ps = CONFIG.playerSize;
    for (const o of obstacles) {
      if (!o.active) continue;
      o.x -= speed * dt;
      if (o.x + o.w < 0) { o.active = false; continue; }
      const hit =
        px + m < o.x + o.w - m &&
        px + ps - m > o.x + m &&
        player.y - m > groundY - o.h;
      if (hit) { gameOver(); return; }
    }

    const flooredScore = Math.floor(score);
    if (flooredScore !== shownScore) {
      shownScore = flooredScore;
      scoreEl.textContent = flooredScore;
    }
  }

  /* ---------- draw ---------- */
  function drawDunes(offset, baseY, amp, period, color) {
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
    ctx.fillStyle = CONFIG.colors.sky;
    ctx.fillRect(0, 0, width, height);

    // drifting dot grid (matches the site background)
    ctx.fillStyle = CONFIG.colors.dot;
    for (let x = -dotOffset; x < width; x += 40) {
      for (let y = 20; y < groundY - 30; y += 40) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    drawDunes(duneOffset * 0.5, groundY - 8, 26, 220, CONFIG.colors.duneFar);
    drawDunes(duneOffset, groundY - 2, 16, 160, CONFIG.colors.dune);

    // ground line
    ctx.strokeStyle = CONFIG.colors.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + CONFIG.playerSize + 1);
    ctx.lineTo(width, groundY + CONFIG.playerSize + 1);
    ctx.stroke();

    // cacti
    ctx.fillStyle = CONFIG.colors.cactus;
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

    // player block with squash & stretch
    const px = width * CONFIG.playerXRatio;
    const ps = CONFIG.playerSize;
    const sq = player.squash;
    const w = ps * (1 + sq);
    const h = ps * (1 - sq);
    const x = px - (w - ps) / 2;
    const y = player.y + (ps - h);
    ctx.fillStyle = CONFIG.colors.player;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    // face: two eyes looking forward
    ctx.fillStyle = CONFIG.colors.playerFace;
    ctx.fillRect(x + w * 0.55, y + h * 0.25, 4, 8);
    ctx.fillRect(x + w * 0.78, y + h * 0.25, 4, 8);
  }

  /* ---------- loop (paused when hidden or out of view) ---------- */
  let rafId = null;
  let lastTime = 0;

  function loop(t) {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (state === 'playing') update(dt);
    draw();
  }

  function setRunning(run) {
    if (run && rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    } else if (!run && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    setRunning(inView && !document.hidden);
  }, { threshold: 0.2 });
  viewObserver.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    setRunning(inView && !document.hidden);
  });

  reset();
  draw();
}
