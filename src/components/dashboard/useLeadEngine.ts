'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fakeLead, processLead, type LeadResult, type TraceLevel } from '@/lib/leads';

export type LogLine = { id: number; at: number; level: TraceLevel; stage: string; detail: string; lead: string };
export type LeadRow = LeadResult & { at: number; retries: number };

export const BUCKET_MS = 5_000;
export const BUCKETS = 24;
const MAX_LOGS = 80;
const RETRY_MS = 6_000;
const STEP_DELAY = 90;

let logSeq = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function viaServer(lead: unknown, crmFails: boolean): Promise<LeadResult> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, crmFails }),
    });
    if (res.status >= 500) throw new Error(String(res.status));
    return (await res.json()) as LeadResult;
  } catch {
    // Static host or offline: run the identical pipeline in the browser.
    return processLead(lead, { runtime: 'browser', crmFails });
  }
}

export function useLeadEngine(active: boolean) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [series, setSeries] = useState<number[]>(() => Array(BUCKETS).fill(0));
  const [seriesEnd, setSeriesEnd] = useState(0);
  const [busy, setBusy] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const pushLog = useCallback((line: Omit<LogLine, 'id' | 'at'>) => {
    setLogs((prev) => [{ ...line, id: ++logSeq, at: Date.now() }, ...prev].slice(0, MAX_LOGS));
  }, []);

  const record = useCallback(async (result: LeadResult, animate: boolean) => {
    for (const step of result.trace) {
      pushLog({ level: step.level, stage: step.stage, detail: step.detail, lead: result.id });
      if (animate) await sleep(STEP_DELAY);
    }
    setRows((prev) => [{ ...result, at: Date.now(), retries: 0 }, ...prev].slice(0, 40));
    setSeries((prev) => {
      const next = [...prev];
      next[next.length - 1] += 1;
      return next;
    });

    if (result.status === 'queued') {
      setTimeout(() => {
        pushLog({ level: 'info', stage: 'retry', detail: `lead_outbox → Salesforce · attempt 2`, lead: result.id });
        pushLog({ level: 'ok', stage: 'crm', detail: `POST /sobjects/Lead → 201 · recovered from outbox`, lead: result.id });
        setRows((prev) => prev.map((r) => (r.id === result.id ? { ...r, status: 'synced', retries: 1 } : r)));
        if (animate) toast.success('Queued lead delivered', { description: `${result.id} synced on retry — nothing lost.` });
      }, RETRY_MS);
    }
  }, [pushLog]);

  /** User-triggered capture — goes through the real /api/leads route. */
  const capture = useCallback(async (opts: { spam: boolean; crmFails: boolean }) => {
    if (busy) return;
    setBusy(true);
    const result = await viaServer(fakeLead({ spam: opts.spam }), opts.crmFails);
    await record(result, true);
    setBusy(false);
    if (result.status === 'synced') {
      toast.success('Lead synced to Salesforce', { description: `${result.name} · ${result.fieldCount} fields · ${result.totalMs}ms (${result.runtime})` });
    } else if (result.status === 'queued') {
      toast.warning('CRM unavailable, lead queued', { description: `${result.id} is in the outbox; retrying in ${RETRY_MS / 1000}s.` });
    } else if (result.rejectedFor === 'invalid') {
      toast.error('Payload failed validation', { description: result.trace.at(-1)?.detail });
    } else {
      toast('Rejected as spam', { description: `${result.id} logged to spam_leads, not sent to the CRM.` });
    }
  }, [busy, record]);

  // Ambient traffic so the monitor is never empty. Runs in the browser only,
  // and only while the dashboard is on screen and the tab is visible.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      if (activeRef.current && !document.hidden) {
        const spam = Math.random() < 0.12;
        const result = await processLead(fakeLead({ spam }), { runtime: 'browser', crmFails: !spam && Math.random() < 0.08 });
        await record(result, false);
      }
      timer = setTimeout(loop, 2600 + Math.random() * 3400);
    };
    timer = setTimeout(loop, 600);
    return () => clearTimeout(timer);
  }, [record]);

  // Seed a short history so the charts have shape on first view.
  useEffect(() => {
    setSeries(Array.from({ length: BUCKETS }, (_, i) => (i === BUCKETS - 1 ? 0 : Math.round(1 + Math.random() * 2 + Math.sin(i / 3) * 1.2))));
    setSeriesEnd(Date.now());
    const t = setInterval(() => {
      setSeries((prev) => [...prev.slice(1), 0]);
      setSeriesEnd(Date.now());
    }, BUCKET_MS);
    return () => clearInterval(t);
  }, []);

  return { logs, rows, series, seriesEnd, busy, capture };
}
