'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { fakeLead, type LeadInput } from '@/lib/leads';

const STAGES = [
  { key: 'ingest', label: 'POST /api/leads', note: 'payload received' },
  { key: 'zod', label: 'leadSchema.parse', note: 'schema ok' },
  { key: 'spam', label: 'spam.score', note: '0.00 · passed' },
  { key: 'attr', label: 'attribution', note: 'utm + gclid kept' },
  { key: 'map', label: 'map → Lead', note: '33 fields' },
  { key: 'crm', label: 'Salesforce', note: '201 Created' },
];
const STEP_MS = 520;
const HOLD_MS = 2200;

/** The hero's live trace: one lead moving through the real pipeline stages, on loop. */
export function PipelinePreview() {
  const [lead, setLead] = useState<LeadInput | null>(null);
  const [step, setStep] = useState(-1);
  const [times, setTimes] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    let timer: ReturnType<typeof setTimeout>;

    const cycle = () => {
      const next = fakeLead();
      setLead(next);
      let t = 0;
      const ts = STAGES.map((_, i) => (t += i === 5 ? 140 + Math.random() * 120 : 1 + Math.random() * 6));
      setTimes(ts.map((n) => Math.round(n)));
      if (reduced) { setStep(STAGES.length - 1); return; }
      let i = -1;
      setStep(i);
      const advance = () => {
        if (!visible) { timer = setTimeout(advance, 400); return; }
        i += 1;
        setStep(i);
        timer = setTimeout(i < STAGES.length - 1 ? advance : cycle, i < STAGES.length - 1 ? STEP_MS : HOLD_MS);
      };
      timer = setTimeout(advance, 300);
    };
    cycle();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; });
    io.observe(ref.current!);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  const done = step === STAGES.length - 1;

  return (
    <div
      ref={ref}
      data-cursor="crosshair"
      className="relative overflow-hidden rounded-xl border border-line bg-surface font-mono text-[12px] leading-relaxed"
      aria-label="Live example: a lead moving through the validation pipeline"
      role="img"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-ink-3">
        <span className="flex items-center gap-2">
          <span className="pulse size-1.5 rounded-full bg-accent" aria-hidden="true" />
          lead-engine · live trace
        </span>
        <span className="tabular-nums">{done ? `${times[5]}ms` : '···'}</span>
      </div>

      <pre className="border-b border-line px-4 py-3 text-ink-2 whitespace-pre-wrap break-all">
        {lead ? (
          <>
            <span className="text-ink-3">{'{ '}</span>
            <span className="text-ink">name</span>: &quot;{lead.name.split(' ')[0]} {lead.name.split(' ')[1]?.[0]}.&quot;,{' '}
            <span className="text-ink">project</span>: &quot;{lead.project}&quot;,{'\n  '}
            <span className="text-ink">utm_source</span>: &quot;{lead.utm.source || '(direct)'}&quot;,{' '}
            <span className="text-ink">gclid</span>: {lead.gclid ? <>&quot;{lead.gclid.slice(0, 12)}…&quot;</> : 'null'}
            <span className="text-ink-3">{' }'}</span>
          </>
        ) : (
          <span className="text-ink-3">waiting for payload…</span>
        )}
      </pre>

      <ol className="px-4 py-3">
        {STAGES.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'idle';
          return (
            <li key={s.key} className="grid grid-cols-[14px_1fr_auto] items-center gap-3 py-[3px]">
              <span
                aria-hidden="true"
                className={clsx(
                  'size-[7px] rounded-[2px] transition-colors duration-200',
                  state === 'idle' ? 'bg-line' : i === 5 ? 'bg-good' : 'bg-accent',
                )}
              />
              <span className={clsx('transition-colors duration-200', state === 'idle' ? 'text-ink-3/60' : 'text-ink')}>
                {s.label}
                <span className={clsx('ml-2 transition-opacity duration-200', state === 'idle' ? 'opacity-0' : 'text-ink-3')}>
                  {s.note}
                </span>
              </span>
              <span className={clsx('tabular-nums text-ink-3 transition-opacity duration-200', state === 'idle' ? 'opacity-0' : 'opacity-100')}>
                +{times[i] ?? 0}ms
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
