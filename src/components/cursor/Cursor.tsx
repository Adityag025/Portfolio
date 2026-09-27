'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cursorData } from '@/lib/ui-store';

const MAGNET_RADIUS = 30;
const MAGNET_STRENGTH = 0.3;

type Magnet = { el: HTMLElement; x: (v: number) => void; y: (v: number) => void; active: boolean };

/**
 * Dot follows the pointer 1:1; the ring trails on a short tween so it reads as
 * weight rather than lag. Context comes from the element under the pointer:
 *   [data-cursor="label"][data-cursor-label="Explore"] → filled badge
 *   [data-cursor="crosshair"]                           → precision +
 *   links / buttons                                     → enlarged ring
 *   cursorData channel (charts)                         → value tooltip
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    const ring = ringRef.current!;
    const shape = shapeRef.current!;
    const dot = dotRef.current!;
    const root = document.documentElement;
    root.classList.add('has-cursor');

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
    const dotX = gsap.quickSetter(dot, 'x', 'px');
    const dotY = gsap.quickSetter(dot, 'y', 'px');

    let magnets: Magnet[] = [];
    const collectMagnets = () => {
      magnets.forEach((m) => { m.x(0); m.y(0); });
      magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]')).map((el) => ({
        el,
        x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' }),
        active: false,
      }));
    };
    collectMagnets();
    const mo = new MutationObserver(() => collectMagnets());
    mo.observe(document.body, { childList: true, subtree: true });

    let label = '';
    let state = 'default';
    const render = (target: Element | null) => {
      const data = cursorData.get();
      let nextState = 'default';
      let nextLabel = '';
      const ctx = target?.closest<HTMLElement>('[data-cursor]');
      if (data) {
        nextState = 'data';
        nextLabel = data;
      } else if (ctx?.dataset.cursor === 'label') {
        nextState = 'label';
        nextLabel = ctx.dataset.cursorLabel ?? 'View';
      } else if (ctx?.dataset.cursor === 'crosshair') {
        nextState = 'crosshair';
      } else if (target?.closest('a, button, [role="button"], label, summary, [role="slider"]')) {
        nextState = 'hover';
      }
      if (nextState !== state) { ring.dataset.state = nextState; state = nextState; }
      if (nextLabel !== label) { shape.textContent = nextLabel; label = nextLabel; }
    };

    let lastTarget: Element | null = null;
    let px = 0;
    let py = 0;
    let frame = 0;

    const updateMagnets = () => {
      frame = 0;
      for (const m of magnets) {
        const r = m.el.getBoundingClientRect();
        // Remove the element's own magnetic offset so it doesn't chase itself.
        const ox = Number(gsap.getProperty(m.el, 'x')) || 0;
        const oy = Number(gsap.getProperty(m.el, 'y')) || 0;
        const left = r.left - ox;
        const top = r.top - oy;
        const dx = Math.max(left - px, 0, px - (left + r.width));
        const dy = Math.max(top - py, 0, py - (top + r.height));
        const near = Math.hypot(dx, dy) <= MAGNET_RADIUS;
        if (near) {
          m.active = true;
          m.x((px - (left + r.width / 2)) * MAGNET_STRENGTH);
          m.y((py - (top + r.height / 2)) * MAGNET_STRENGTH);
        } else if (m.active) {
          m.active = false;
          m.x(0);
          m.y(0);
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      dotX(px);
      dotY(py);
      ringX(px);
      ringY(py);
      ring.dataset.hidden = 'false';
      lastTarget = e.target as Element;
      render(lastTarget);
      if (!frame) frame = requestAnimationFrame(updateMagnets);
    };
    const onLeave = () => { ring.dataset.hidden = 'true'; };
    const onDown = () => gsap.to(shape, { scale: 0.9, duration: 0.12, ease: 'power2.out' });
    const onUp = () => gsap.to(shape, { scale: 1, duration: 0.2, ease: 'power2.out' });
    const unsub = cursorData.subscribe(() => render(lastTarget));

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    const onScroll = () => render(document.elementFromPoint(px, py));
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      root.classList.remove('has-cursor');
      mo.disconnect();
      unsub();
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={ringRef} className="cursor-ring" data-state="default" data-hidden="true">
        <div ref={shapeRef} className="cursor-ring-shape" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
