'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { cursorData } from '@/lib/ui-store';

type Metric = { key: string; label: string; before: number; after: number; format: (v: number) => string; note: string };

const METRICS: Metric[] = [
  { key: 'load', label: 'Page load time', before: 2.4, after: 1.8, format: (v) => `${v.toFixed(2)}s`, note: 'lazy loading, semantic markup, caching' },
  { key: 'bounce', label: 'Bounce rate (indexed)', before: 100, after: 82, format: (v) => v.toFixed(0), note: 'baseline = 100' },
  { key: 'llm', label: 'Repeat LLM summary', before: 13000, after: 85, format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`), note: 'Redis cache hit' },
];

const pct = (m: Metric) => Math.round(((m.before - m.after) / m.before) * 1000) / 10;
// The LLM row spans two orders of magnitude, so interpolate it on a log scale.
const lerp = (m: Metric, t: number) =>
  m.key === 'llm' ? Math.exp(Math.log(m.before) + (Math.log(m.after) - Math.log(m.before)) * t) : m.before + (m.after - m.before) * t;

/** Scrub from "before" to "after"; values and bars interpolate with the handle. */
export function PerfWidget() {
  const [t, setT] = useState(1);
  const anim = useRef(0);

  const animateTo = (target: number) => {
    cancelAnimationFrame(anim.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setT(target); return; }
    const from = t;
    const start = performance.now();
    const D = 600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / D);
      const e = 1 - Math.pow(1 - p, 3);
      setT(from + (target - from) * e);
      if (p < 1) anim.current = requestAnimationFrame(tick);
    };
    anim.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-line p-0.5 font-mono text-xs" role="group" aria-label="Jump to state">
          {[['Before', 0], ['After', 1]].map(([label, v]) => (
            <button
              key={label}
              type="button"
              onClick={() => animateTo(Number(v))}
              aria-pressed={t === v}
              className={clsx('press rounded px-3 py-1.5', t === v ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2')}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-ink-3 tabular-nums">{Math.round(t * 100)}% optimized</span>
      </div>

      <label className="sr-only" htmlFor="perf-scrub">Before to after comparison</label>
      <input
        id="perf-scrub"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={t}
        onChange={(e) => { cancelAnimationFrame(anim.current); setT(Number(e.target.value)); }}
        className="perf-range w-full"
        aria-valuetext={`${Math.round(t * 100)}% of the way to optimized`}
      />

      <ul className="mt-6 space-y-5">
        {METRICS.map((m) => {
          const v = lerp(m, t);
          const ratio = m.key === 'llm' ? Math.log(v) / Math.log(m.before) : v / m.before;
          return (
            <li
              key={m.key}
              onPointerEnter={() => cursorData.set(`${m.format(m.before)} → ${m.format(m.after)} · −${pct(m)}%`)}
              onPointerLeave={() => cursorData.set(null)}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink">{m.label}</span>
                <span className="font-mono text-sm tabular-nums">
                  {m.format(v)}
                  <span className={clsx('ml-2 text-xs', t > 0.98 ? 'text-accent' : 'text-ink-3')}>−{pct(m)}%</span>
                </span>
              </div>
              <div className="relative h-2 rounded-r-[4px] bg-line-soft">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-[4px]"
                  style={{
                    width: `${Math.max(0.6, ratio * 100)}%`,
                    background: `color-mix(in oklab, var(--color-accent) ${Math.round(t * 100)}%, var(--color-ink-3))`,
                  }}
                />
              </div>
              <p className="mt-1 font-mono text-[11px] text-ink-3">{m.note}{m.key === 'llm' ? ' · bar on log scale' : ''}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
