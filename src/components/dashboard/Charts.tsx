'use client';

import { useEffect, useRef, useState } from 'react';
import { cursorData } from '@/lib/ui-store';
import { BUCKET_MS } from './useLeadEngine';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const clock = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/* ---------------- throughput: single-series area, crosshair hover ---------------- */

export function ThroughputChart({ series, end }: { series: number[]; end: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 132;
  const PAD = { top: 10, right: 4, bottom: 20, left: 22 };
  const max = Math.max(4, Math.ceil(Math.max(...series) / 2) * 2);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const step = innerW / (series.length - 1);
  const x = (i: number) => PAD.left + i * step;
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(series.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const bucketTime = (i: number) => end - (series.length - 1 - i) * BUCKET_MS;
  const readout = (i: number) => `${clock(bucketTime(i))} · ${series[i]} lead${series[i] === 1 ? '' : 's'}`;

  useEffect(() => {
    if (hover !== null) cursorData.set(readout(hover));
  }, [hover, series]);

  const total = series.reduce((a, b) => a + b, 0);

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-2">Leads per 5s · last 2 min</span>
        <span className="font-mono text-xs text-ink-3 tabular-nums" aria-live="off">
          {hover !== null ? readout(hover) : `${total} total`}
        </span>
      </figcaption>
      <div
        ref={ref}
        className="relative"
        onPointerLeave={() => { setHover(null); cursorData.set(null); }}
      >
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={`Lead throughput over the last two minutes, ${total} leads total`}>
            {[0, max / 2, max].map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line-soft)" strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[10px]">{t}</text>
              </g>
            ))}
            <path d={area} fill="var(--color-accent)" fillOpacity={0.12} />
            <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {[['−2m', 0], ['−1m', Math.floor((series.length - 1) / 2)], ['now', series.length - 1]].map(([label, i]) => (
              <text key={label} x={x(Number(i))} y={H - 4} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'} className="fill-ink-3 font-mono text-[10px]">
                {label}
              </text>
            ))}
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="var(--color-ink-3)" strokeWidth={1} strokeDasharray="2 3" />
                <circle cx={x(hover)} cy={y(series[hover])} r={4.5} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
              </g>
            )}
            {series.map((_, i) => (
              <rect
                key={i}
                x={x(i) - step / 2}
                y={0}
                width={step}
                height={H}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
              />
            ))}
          </svg>
        )}
      </div>
    </figure>
  );
}

/* ---------------- source breakdown: single-hue bars (magnitude, not identity) ---------------- */

const SOURCES = ['google', 'facebook', 'instagram', 'newsletter', 'direct'] as const;

export function SourceBars({ sources }: { sources: string[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const counts = SOURCES.map((s) => ({ s, n: sources.filter((x) => x === s).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  const total = sources.length || 1;
  const readout = (s: string, n: number) => `${s} · ${n} lead${n === 1 ? '' : 's'} (${Math.round((n / total) * 100)}%)`;

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-2">Leads by utm_source</span>
        <span className="font-mono text-xs text-ink-3">{hover ? readout(hover, counts.find((c) => c.s === hover)!.n) : `${sources.length} this session`}</span>
      </figcaption>
      <ul className="space-y-1" onPointerLeave={() => { setHover(null); cursorData.set(null); }}>
        {counts.map(({ s, n }) => (
          <li
            key={s}
            className="grid grid-cols-[84px_1fr_28px] items-center gap-3 rounded py-1.5"
            onPointerEnter={() => { setHover(s); cursorData.set(readout(s, n)); }}
            onPointerDown={() => setHover(s)}
          >
            <span className="font-mono text-xs text-ink-2">{s}</span>
            <span className="relative h-2.5 rounded-r-[4px] bg-line-soft">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px] bg-accent transition-[width,opacity] duration-500 ease-[var(--ease-out)]"
                style={{ width: `${(n / max) * 100}%`, opacity: hover && hover !== s ? 0.45 : 1 }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums text-ink">{n}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
