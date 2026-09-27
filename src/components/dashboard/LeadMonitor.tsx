'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Clock3, Loader2, Play, ShieldX } from 'lucide-react';
import type { LogLine, LeadRow } from './useLeadEngine';

const LEVEL: Record<LogLine['level'], { label: string; cls: string }> = {
  info: { label: 'INFO', cls: 'text-ink-3' },
  ok: { label: ' OK ', cls: 'text-good' },
  warn: { label: 'WARN', cls: 'text-warn' },
  error: { label: 'ERR ', cls: 'text-bad' },
};

const ts = (t: number) => {
  const d = new Date(t);
  return `${d.toLocaleTimeString('en-GB')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={clsx(
        'press inline-flex h-9 items-center gap-2 rounded-md border px-3 font-mono text-xs',
        on ? 'border-warn/60 bg-warn/10 text-ink' : 'border-line text-ink-3 hover:text-ink-2',
      )}
    >
      <span className={clsx('size-1.5 rounded-full', on ? 'bg-warn' : 'bg-line')} aria-hidden="true" />
      {children}
    </button>
  );
}

export function LeadControls({ busy, onCapture }: { busy: boolean; onCapture: (o: { spam: boolean; crmFails: boolean }) => void }) {
  const [spam, setSpam] = useState(false);
  const [crmFails, setCrmFails] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        data-magnetic
        disabled={busy}
        onClick={() => onCapture({ spam, crmFails })}
        className="press inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-bg hover:bg-accent-soft disabled:opacity-70"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-3.5 fill-current" aria-hidden="true" />}
        {busy ? 'Capturing…' : 'Simulate lead capture'}
      </button>
      <Toggle on={spam} onChange={setSpam}>Send as spam</Toggle>
      <Toggle on={crmFails} onChange={setCrmFails}>Salesforce down</Toggle>
    </div>
  );
}

export function LogStream({ logs }: { logs: LogLine[] }) {
  return (
    <div
      data-cursor="crosshair"
      data-lenis-prevent
      className="thin-scroll h-[300px] overflow-y-auto lg:h-full rounded-lg border border-line bg-bg font-mono text-[11.5px] leading-[1.7]"
      role="log"
      aria-label="Lead pipeline log, newest first"
      aria-live="off"
    >
      {logs.length === 0 && <p className="p-4 text-ink-3">Listening for payloads…</p>}
      <ol className="px-3 py-2">
        {logs.map((l) => (
          <li key={l.id} className="log-row grid grid-cols-[92px_32px_minmax(0,1fr)] gap-x-3 whitespace-pre sm:grid-cols-[92px_32px_76px_84px_minmax(0,1fr)]">
            <span className="text-ink-3/70 tabular-nums">{ts(l.at)}</span>
            <span className={LEVEL[l.level].cls}>{LEVEL[l.level].label.trim()}</span>
            <span className="hidden text-ink-3 sm:block">{l.lead}</span>
            <span className="hidden text-ink-2 sm:block">{l.stage}</span>
            <span className="truncate text-ink" title={l.detail}>{l.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Kpis({ rows }: { rows: LeadRow[] }) {
  const synced = rows.filter((r) => r.status === 'synced').length;
  const queued = rows.filter((r) => r.status === 'queued').length;
  const rejected = rows.filter((r) => r.status === 'rejected').length;
  const invalid = rows.filter((r) => r.rejectedFor === 'invalid').length;
  const tiles = [
    { label: 'Captured', value: rows.length, icon: null },
    { label: 'Synced to CRM', value: synced, icon: <CheckCircle2 className="size-3.5 text-good" aria-hidden="true" /> },
    { label: 'In outbox', value: queued, icon: <Clock3 className="size-3.5 text-warn" aria-hidden="true" /> },
    { label: invalid ? `Rejected (${invalid} invalid)` : 'Spam blocked', value: rejected, icon: <ShieldX className="size-3.5 text-ink-3" aria-hidden="true" /> },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col bg-surface px-4 py-3">
          <dt className="order-2 flex items-center gap-1.5 text-xs text-ink-3">{t.icon}{t.label}</dt>
          <dd className="font-mono text-2xl tabular-nums">{t.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const STATUS = {
  synced: { label: 'Synced', icon: CheckCircle2, cls: 'text-good' },
  queued: { label: 'Retrying', icon: Clock3, cls: 'text-warn' },
  rejected: { label: 'Spam', icon: ShieldX, cls: 'text-ink-3' },
} as const;
const INVALID = { label: 'Invalid', icon: ShieldX, cls: 'text-bad' } as const;

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const mask = (n: string) => (n === '—' ? n : `${n.split(' ')[0]} ${n.split(' ')[1]?.[0] ?? ''}.`);
  return (
    <div data-lenis-prevent className="thin-scroll max-h-[320px] overflow-auto rounded-lg border border-line">
      <table className="w-full min-w-[560px] border-collapse text-left font-mono text-[12px]">
        <caption className="sr-only">Most recent leads written to the leads table</caption>
        <thead className="sticky top-0 bg-raised text-ink-3">
          <tr>
            {['id', 'name', 'project', 'source', 'status', 'ms'].map((h) => (
              <th key={h} scope="col" className={clsx('px-3 py-2 font-normal', h === 'ms' && 'text-right')}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-3">No rows yet. Simulate a capture to write one.</td></tr>
          )}
          {rows.slice(0, 12).map((r) => {
            const S = r.rejectedFor === 'invalid' ? INVALID : STATUS[r.status];
            return (
              <tr key={r.id} className="log-row border-t border-line-soft">
                <td className="px-3 py-2 text-ink-3">{r.id}</td>
                <td className="px-3 py-2 text-ink">{mask(r.name)}</td>
                <td className="px-3 py-2 text-ink-2">{r.project}</td>
                <td className="px-3 py-2 text-ink-2">{r.source}</td>
                <td className="px-3 py-2">
                  <span className={clsx('inline-flex items-center gap-1.5', S.cls)}>
                    <S.icon className="size-3.5" aria-hidden="true" />
                    <span className="text-ink-2">{S.label}{r.retries ? ' (retried)' : ''}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-2">{r.totalMs}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
