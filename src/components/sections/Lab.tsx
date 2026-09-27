'use client';

import { useEffect, useRef } from 'react';
import { initGame } from '@/lib/game';
import { SectionHead } from '@/components/ui/SectionHead';

export function Lab() {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const score = useRef<HTMLElement>(null);
  const hi = useRef<HTMLElement>(null);

  useEffect(
    () =>
      initGame({
        canvas: canvas.current!, frame: frame.current!, overlay: overlay.current!,
        title: title.current!, sub: sub.current!, score: score.current!, hi: hi.current!,
      }),
    [],
  );

  return (
    <section id="lab" aria-labelledby="lab-title" className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
      <SectionHead id="lab" label="Lab" title="Desert Dash">
        <p>
          An endless runner on a bare canvas: object pooling, delta-time physics and a three-state machine in about 200 lines.
          Press <kbd className="rounded border border-line px-1.5 font-mono text-xs">Space</kbd> or tap to jump.
        </p>
      </SectionHead>

      <div data-reveal>
        <div ref={frame} className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px] text-ink-3">
            <span>desert_dash v2.0</span>
            <div className="flex gap-4 tabular-nums">
              <span>HI <b ref={hi} className="font-medium text-ink-2">0</b></span>
              <span>SCORE <b ref={score} className="font-medium text-ink">0</b></span>
            </div>
          </div>
          <div className="relative" data-cursor="crosshair">
            <canvas ref={canvas} className="block w-full touch-none" aria-label="Desert Dash mini game. Press Space or tap to jump over cacti." />
            <div
              ref={overlay}
              data-hidden="false"
              className="pointer-events-none absolute inset-0 grid place-content-center text-center transition-opacity duration-200 data-[hidden=true]:opacity-0"
            >
              <div ref={title} className="font-display text-2xl font-medium tracking-tight">Desert Dash</div>
              <div ref={sub} className="mt-1 font-mono text-xs text-ink-3">Press Space or tap to start</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
