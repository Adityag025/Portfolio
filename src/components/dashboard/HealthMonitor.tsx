'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export type Health = {
  seq: number;
  at: number;
  postgres: { active: number; idle: number; max: number; waiting: number; queryP95: number };
  redis: { depth: number; perSec: number; latency: number };
  webhook: { lastStatus: number; p95: number; retries: number };
  auth: { verifyMs: number; sessions: number };
};
export type Conn = 'connecting' | 'live' | 'reconnecting' | 'local';

function localTick(seq: number): Health {
  const j = (b: number, s: number) => Math.max(0, b + (Math.random() - 0.5) * 2 * s);
  const active = Math.round(j(7, 4));
  return {
    seq, at: Date.now(),
    postgres: { active, idle: 20 - active, max: 20, waiting: 0, queryP95: Math.round(j(14, 6)) },
    redis: { depth: Math.round(j(3, 3)), perSec: Math.round(j(42, 12)), latency: Number(j(0.6, 0.3).toFixed(2)) },
    webhook: { lastStatus: 200, p95: Math.round(j(180, 60)), retries: 0 },
    auth: { verifyMs: Number(j(1.8, 0.6).toFixed(1)), sessions: Math.round(j(38, 6)) },
  };
}

export function useHealthStream(active: boolean) {
  const [health, setHealth] = useState<Health | null>(null);
  const [conn, setConn] = useState<Conn>('connecting');

  useEffect(() => {
    if (!active) return;
    let failures = 0;
    let local: ReturnType<typeof setInterval> | undefined;
    const es = new EventSource('/api/stream');
    es.addEventListener('health', (e) => {
      failures = 0;
      setConn('live');
      setHealth(JSON.parse((e as MessageEvent).data));
    });
    es.onerror = () => {
      failures += 1;
      if (failures >= 3) {
        es.close();
        setConn('local');
        let seq = 0;
        local = setInterval(() => setHealth(localTick(++seq)), 1500);
      } else {
        setConn('reconnecting');
      }
    };
    return () => { es.close(); clearInterval(local); };
  }, [active]);

  return { health, conn };
}

type Row = { name: string; detail: string; ok: boolean; meter?: number; value: string };

function rowsFor(h: Health, conn: Conn): Row[] {
  const { postgres: pg, redis, webhook, auth } = h;
  return [
    { name: 'PostgreSQL pool', value: `${pg.active}/${pg.max}`, detail: `p95 ${pg.queryP95}ms · ${pg.waiting} waiting`, ok: pg.waiting === 0, meter: pg.active / pg.max },
    { name: 'Redis pub/sub', value: `${redis.perSec}/s`, detail: `queue depth ${redis.depth} · ${redis.latency}ms`, ok: redis.depth < 8 },
    { name: 'Webhooks', value: String(webhook.lastStatus), detail: `p95 ${webhook.p95}ms${webhook.retries ? ' · retrying 1' : ''}`, ok: webhook.lastStatus < 400 },
    { name: 'SSE stream', value: conn === 'live' ? `#${h.seq}` : conn === 'local' ? 'local' : '…', detail: conn === 'live' ? 'GET /api/stream · connected' : conn === 'local' ? 'stream unavailable · local simulation' : 'reconnecting', ok: conn === 'live' },
    { name: 'Auth (JWT)', value: `${auth.verifyMs}ms`, detail: `${auth.sessions} active sessions`, ok: true },
  ];
}

export function HealthMonitor({ health, conn }: { health: Health | null; conn: Conn }) {
  if (!health) {
    return (
      <p className="flex items-center gap-2 font-mono text-xs text-ink-3">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Opening /api/stream…
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line-soft">
      {rowsFor(health, conn).map((r) => (
        <li key={r.name} className="grid grid-cols-[18px_1fr_auto] items-center gap-x-3 py-3">
          {r.ok ? (
            <CheckCircle2 className="size-4 text-good" aria-label="Healthy" />
          ) : (
            <AlertTriangle className="size-4 text-warn" aria-label="Degraded" />
          )}
          <div className="min-w-0">
            <div className="text-sm text-ink">{r.name}</div>
            <div className="truncate font-mono text-[11px] text-ink-3">{r.detail}</div>
            {r.meter !== undefined && (
              <div className="mt-1.5 h-1 w-full max-w-[180px] rounded-r-[4px] bg-line-soft" aria-hidden="true">
                <div className="h-full rounded-r-[4px] bg-ink-2 transition-[width] duration-700 ease-[var(--ease-out)]" style={{ width: `${r.meter * 100}%` }} />
              </div>
            )}
          </div>
          <span className={clsx('font-mono text-sm tabular-nums', r.ok ? 'text-ink' : 'text-warn')}>{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
