/* ============================================================
   Sahara portfolio motion — anime.js
   Disney principles mapped: anticipation, staging, follow-through,
   slow in/out, arcs, secondary action, timing, exaggeration, appeal.
   Design motion profile: weighted cubic-bezier(0.2, 0, 0, 1) feel
   → easeOutExpo / easeOutQuint in anime.js terms.
   ============================================================ */

import anime from 'animejs/lib/anime.es.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. ONLOAD — choreographed entrance
   preloader pop → curtain lift → nav → badge → masked word
   reveal → paragraph → buttons (overlapping action throughout)
   ============================================================ */
function playIntro() {
  const tl = anime.timeline({ easing: 'easeOutExpo' });

  tl
    .add({
      targets: '.preloader-logo',
      opacity: [0, 1],
      scaleX: [1, 1.15, 1],
      scaleY: [1, 0.85, 1],
      duration: 550,
      easing: 'easeInOutQuad'
    })
    .add({
      targets: '#preloader',
      translateY: '-100%',
      duration: 750,
      easing: 'easeInOutQuint',
      complete: () => document.getElementById('preloader')?.remove()
    }, '+=200')
    .add({
      targets: '#nav',
      translateY: ['-100%', '0%'],
      duration: 800
    }, '-=450')
    .add({
      targets: '.hero-badge',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(130),
      duration: 900
    }, '-=550')
    // Words rise out of clip-path masks, staggered
    .add({
      targets: '.hero-heading-word',
      opacity: [0, 1],
      translateY: [80, 0],
      duration: 1200,
      delay: anime.stagger(110)
    }, '-=650')
    .add({
      targets: '.hero-paragraph',
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 1000
    }, '-=850')
    .add({
      targets: '.hero-actions .btn',
      opacity: [0, 1],
      scale: [0.9, 1],
      delay: anime.stagger(110),
      duration: 800
    }, '-=750');
}

if (reduceMotion) {
  document.getElementById('preloader')?.remove();
  anime.set('#nav', { translateY: '0%' });
} else {
  playIntro();
}

/* ============================================================
   2. INTERACTIVE BODY BACKGROUND
   - cursor glow chases the pointer (weighted follow)
   - dot grid drifts opposite the pointer (depth via parallax)
   - warm shapes float on endless arcs
   ============================================================ */
const glow = document.getElementById('cursorGlow');
const grid = document.getElementById('bgGrid');

if (!reduceMotion && glow && grid && matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    anime({
      targets: glow,
      translateX: e.clientX,
      translateY: e.clientY,
      duration: 900,
      easing: 'easeOutQuint'
    });
    // Grid moves against the cursor — reads as a deeper layer
    const nx = (e.clientX / window.innerWidth - 0.5) * -30;
    const ny = (e.clientY / window.innerHeight - 0.5) * -30;
    anime({
      targets: grid,
      translateX: nx,
      translateY: ny,
      duration: 1400,
      easing: 'easeOutQuint'
    });
  }, { passive: true });
} else if (glow) {
  glow.style.display = 'none';
}

if (!reduceMotion) {
  document.querySelectorAll('.shape').forEach((shape, i) => {
    anime({
      targets: shape,
      translateX: [0, anime.random(-60, 60), 0],
      translateY: [
        { value: anime.random(-80, -25) },
        { value: anime.random(25, 80) },
        { value: 0 }
      ],
      scale: [1, 1.12, 1],
      duration: anime.random(10000, 16000),
      delay: i * 700,
      loop: true,
      direction: 'alternate',
      easing: 'easeInOutSine'
    });
  });

  anime({
    targets: '.hero-scroll .line',
    scaleY: [0.3, 1],
    opacity: [0.3, 1],
    duration: 1200,
    loop: true,
    direction: 'alternate',
    easing: 'easeInOutQuad'
  });
}

/* Hero content parallax — follows the pointer gently */
const heroParallax = document.getElementById('heroParallax');
const heroSection = document.getElementById('hero');

if (!reduceMotion && heroParallax && heroSection && matchMedia('(pointer: fine)').matches) {
  heroSection.addEventListener('mousemove', (e) => {
    const { width, height } = heroSection.getBoundingClientRect();
    anime({
      targets: heroParallax,
      translateX: ((e.clientX - width / 2) / width) * 25,
      translateY: ((e.clientY - height / 2) / height) * 25,
      duration: 1200,
      easing: 'easeOutQuad'
    });
  });
  heroSection.addEventListener('mouseleave', () => {
    anime({
      targets: heroParallax,
      translateX: 0,
      translateY: 0,
      duration: 1800,
      easing: 'easeOutElastic(1, 0.4)'
    });
  });
}

/* ============================================================
   3. INTERACTIVE SECTIONS — scroll reveals + secondary action
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    revealObserver.unobserve(el);

    if (reduceMotion) {
      el.style.opacity = 1;
      return;
    }

    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 1100,
      easing: 'easeOutExpo'
    });

    if (el.classList.contains('skill-group')) {
      anime({
        targets: el.querySelectorAll('.chip'),
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.85, 1],
        delay: anime.stagger(30, { start: 200 }),
        duration: 500,
        easing: 'easeOutBack'
      });
    }

    if (el.classList.contains('timeline-item')) {
      anime({
        targets: el.querySelector('.timeline-marker'),
        scale: [0, 1.4, 1],
        duration: 650,
        delay: 250,
        easing: 'easeOutElastic(1, 0.5)'
      });
    }

    if (el.classList.contains('stat-card')) {
      const num = el.querySelector('.stat-num');
      const target = parseFloat(num.dataset.count);
      const counter = { val: 0 };
      anime({
        targets: counter,
        val: target,
        duration: 1600,
        easing: 'easeOutExpo',
        update: () => {
          num.textContent = Number.isInteger(target)
            ? Math.round(counter.val)
            : counter.val.toFixed(1);
        }
      });
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* Project & service cards: icon squash-stretch wiggle + tag ripple
   on hover (lift/shadow/dim handled by .glass-card CSS) */
document.querySelectorAll('.project-card, .service-card').forEach((card) => {
  const icon = card.querySelector('.project-icon, .service-icon');
  const tags = card.querySelectorAll('.tags span');

  card.addEventListener('mouseenter', () => {
    if (reduceMotion) return;
    anime.remove([icon, ...tags]);
    anime({
      targets: icon,
      scaleX: [1, 1.25, 0.95, 1],
      scaleY: [1, 0.8, 1.1, 1],
      rotate: [0, -8, 5, 0],
      duration: 600,
      easing: 'easeInOutQuad'
    });
    anime({
      targets: tags,
      translateY: [0, -3, 0],
      delay: anime.stagger(40),
      duration: 350,
      easing: 'easeOutQuad'
    });
  });
});

/* Glass card lift via anime (translateY not covered by CSS transition
   since anime owns transform on these elements) */
document.querySelectorAll('.glass-card').forEach((card) => {
  card.addEventListener('mouseenter', () => {
    if (reduceMotion) return;
    anime.remove(card);
    anime({ targets: card, translateY: -6, duration: 450, easing: 'easeOutExpo' });
  });
  card.addEventListener('mouseleave', () => {
    if (reduceMotion) return;
    anime.remove(card);
    anime({ targets: card, translateY: 0, duration: 500, easing: 'easeOutExpo' });
  });
});

/* ============================================================
   4. MAGNETIC BUTTONS — pull toward the cursor, elastic release
   ============================================================ */
document.querySelectorAll('.magnetic').forEach((btn) => {
  if (reduceMotion || !matchMedia('(pointer: fine)').matches) return;

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    anime({
      targets: btn,
      translateX: (e.clientX - rect.left - rect.width / 2) * 0.35,
      translateY: (e.clientY - rect.top - rect.height / 2) * 0.35,
      duration: 400,
      easing: 'easeOutQuad'
    });
  });
  btn.addEventListener('mouseleave', () => {
    anime({
      targets: btn,
      translateX: 0,
      translateY: 0,
      duration: 900,
      easing: 'easeOutElastic(1, 0.3)'
    });
  });
  // Anticipation: compress on press, exaggerated elastic release
  btn.addEventListener('mousedown', () => {
    anime({ targets: btn, scale: 0.94, duration: 110, easing: 'easeInQuad' });
  });
  btn.addEventListener('mouseup', () => {
    anime({ targets: btn, scale: 1, duration: 600, easing: 'easeOutElastic(1, 0.4)' });
  });
});

/* ============================================================
   5. BACK TO TOP — appears after scrolling, elastic entrance
   ============================================================ */
const backToTop = document.getElementById('backToTop');

if (backToTop) {
  let shown = false;
  window.addEventListener('scroll', () => {
    const shouldShow = window.scrollY > 600;
    if (shouldShow === shown) return;
    shown = shouldShow;
    backToTop.classList.toggle('visible', shown);
    if (reduceMotion) {
      backToTop.style.opacity = shown ? 1 : 0;
      return;
    }
    anime.remove(backToTop);
    anime({
      targets: backToTop,
      opacity: shown ? [0, 1] : [1, 0],
      scale: shown ? [0.6, 1] : [1, 0.6],
      duration: 550,
      easing: shown ? 'easeOutElastic(1, 0.5)' : 'easeOutQuad'
    });
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    if (reduceMotion) {
      window.scrollTo(0, 0);
      return;
    }
    const scroll = { y: window.scrollY };
    anime({
      targets: scroll,
      y: 0,
      duration: 900,
      easing: 'easeInOutQuint',
      update: () => window.scrollTo(0, scroll.y)
    });
  });
}

/* ============================================================
   6. NAV SCROLLSPY — highlight the section in view
   ============================================================ */
const navLinks = [...document.querySelectorAll('.nav-links a:not(.nav-cta)')];
const spyTargets = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (spyTargets.length) {
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) =>
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
      );
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  spyTargets.forEach((section) => spyObserver.observe(section));
}

/* Chips: playful pop (appeal) */
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('mouseenter', () => {
    if (reduceMotion) return;
    anime.remove(chip);
    anime({
      targets: chip,
      scale: [1, 1.12],
      rotate: [0, anime.random(-3, 3)],
      duration: 300,
      easing: 'easeOutBack'
    });
  });
  chip.addEventListener('mouseleave', () => {
    if (reduceMotion) return;
    anime.remove(chip);
    anime({ targets: chip, scale: 1, rotate: 0, duration: 300, easing: 'easeOutQuad' });
  });
});
