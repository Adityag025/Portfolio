'use client';

import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Database, RotateCcw, Sparkles } from 'lucide-react';

type Line = { text: string; tone: 'muted' | 'ok' | 'warn' };
// A cold LLM call really takes ~13s; the demo plays it 10× faster and says so.
const COLD_MS = 13_000;
const SPEEDUP = 10;

export function CacheDemo() {
  const [cached, setCached] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [last, setLast] = useState<{ ms: number; hit: boolean } | null>(null);
  const raf = useRef(0);

  const run = () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    const key = 'summary:ws_42:issue_142:v7';
    if (cached) {
      const ms = 70 + Math.round(Math.random() * 25);
      setLines([
        { text: `GET ${key}`, tone: 'muted' },
        { text: `HIT · 2.1KB · ${ms}ms end to end`, tone: 'ok' },
      ]);
      setProgress(1);
      setTimeout(() => { setLast({ ms, hit: true }); setRunning(false); }, 120);
      return;
    }
    setLines([
      { text: `GET ${key}`, tone: 'muted' },
      { text: 'MISS · calling model…', tone: 'warn' },
    ]);
    const start = performance.now();
    const dur = COLD_MS / SPEEDUP;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setProgress(p);
      if (p < 1) { raf.current = requestAnimationFrame(tick); return; }
      setLines((l) => [...l, { text: 'model responded · 13.0s', tone: 'muted' }, { text: `SET ${key} EX 86400`, tone: 'ok' }]);
      setCached(true);
      setLast({ ms: COLD_MS, hit: false });
      setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const invalidate = () => {
    cancelAnimationFrame(raf.current);
    setCached(false);
    setRunning(false);
    setProgress(0);
    setLast(null);
    setLines([{ text: 'issue edited → DEL summary:ws_42:issue_142:*', tone: 'warn' }]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="press inline-flex h-9 items-center gap-2 rounded-md border border-line bg-raised px-3 text-sm hover:border-ink-3 disabled:opacity-60"
        >
          <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
          {cached ? 'Request summary again' : 'Request issue summary'}
        </button>
        <button type="button" onClick={invalidate} className="press inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-ink-3 hover:text-ink">
          <RotateCcw className="size-3.5" aria-hidden="true" /> Edit issue
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-ink-3">
          <Database className="size-3.5" aria-hidden="true" />
          redis: {cached ? <span className="text-good">warm</span> : 'cold'}
        </span>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-line-soft" aria-hidden="true">
        <div className={clsx('h-full rounded-full', last?.hit ? 'bg-good' : 'bg-accent')} style={{ width: `${progress * 100}%` }} />
      </div>

      <ol className="mt-3 min-h-[76px] font-mono text-[11.5px] leading-relaxed" aria-live="polite">
        {lines.map((l, i) => (
          <li key={i} className={clsx('log-row', l.tone === 'ok' ? 'text-good' : l.tone === 'warn' ? 'text-warn' : 'text-ink-3')}>
            {l.text}
          </li>
        ))}
        {lines.length === 0 && <li className="text-ink-3">Cold cache. The first request pays for the model call.</li>}
      </ol>
      <p className="mt-2 text-xs text-ink-3">
        {last ? (last.hit ? `Served from cache in ${last.ms}ms.` : 'First call took 13s (played back 10× faster). Try it again.') : 'The first call is played back 10× faster than real time.'}
      </p>
    </div>
  );
}
