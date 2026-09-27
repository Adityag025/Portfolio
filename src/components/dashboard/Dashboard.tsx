'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { SectionHead } from '@/components/ui/SectionHead';
import { useLeadEngine } from './useLeadEngine';
import { LeadControls, LogStream, Kpis, LeadsTable } from './LeadMonitor';
import { ThroughputChart, SourceBars } from './Charts';
import { PerfWidget } from './PerfWidget';
import { CacheDemo } from './CacheDemo';
import { HealthMonitor, useHealthStream } from './HealthMonitor';

function Panel({ title, meta, className, children }: { title: string; meta?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={clsx('min-w-0 rounded-xl border border-line bg-surface p-5 md:p-6', className)} data-reveal>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-mono text-xs tracking-wide text-ink-2 uppercase">{title}</h3>
        {meta}
      </header>
      {children}
    </section>
  );
}

function useInView<T extends HTMLElement>(margin = '200px') {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

export function Dashboard() {
  const [ref, inView] = useInView<HTMLElement>();
  const [started, setStarted] = useState(false);
  useEffect(() => { if (inView) setStarted(true); }, [inView]);

  const engine = useLeadEngine(inView);
  const { health, conn } = useHealthStream(started);
  const sources = engine.rows.filter((r) => r.status !== 'rejected').map((r) => r.source);

  const connLabel = { connecting: 'connecting', live: 'SSE live', reconnecting: 'reconnecting', local: 'local sim' }[conn];

  return (
    <section ref={ref} id="dashboard" aria-labelledby="dashboard-title" className="border-y border-line bg-[#0c0c0f]">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <SectionHead id="dashboard" label="Live dashboard" title="System Performance & Lead Engine Dashboard">
          <p>
            A working model of the lead pipelines I run in production. <strong className="font-medium text-ink">Simulate lead capture</strong> sends
            a synthetic lead through a real Next.js route handler that validates it with Zod, scores it for spam, maps 33 Salesforce fields and
            falls back to an outbox when the CRM is down. Nothing is stored, and nothing reaches a real CRM.
          </p>
        </SectionHead>

        <div className="grid gap-3 lg:grid-cols-12">
          <Panel
            title="CRM lead integration monitor"
            className="flex flex-col lg:col-span-7"
            meta={
              <span className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
                <span className={clsx('size-1.5 rounded-full', conn === 'live' ? 'pulse bg-good' : conn === 'local' ? 'bg-ink-3' : 'bg-warn')} aria-hidden="true" />
                {connLabel}
              </span>
            }
          >
            <LeadControls busy={engine.busy} onCapture={engine.capture} />
            <div className="mt-4 lg:min-h-[300px] lg:flex-1 lg:basis-0"><LogStream logs={engine.logs} /></div>
          </Panel>

          <Panel title="Throughput" className="lg:col-span-5">
            <Kpis rows={engine.rows} />
            <div className="mt-6"><ThroughputChart series={engine.series} end={engine.seriesEnd} /></div>
            <div className="mt-6"><SourceBars sources={sources} /></div>
          </Panel>

          <Panel title="leads · latest rows" className="lg:col-span-7" meta={<span className="font-mono text-[11px] text-ink-3">mysql › leads</span>}>
            <LeadsTable rows={engine.rows} />
          </Panel>

          <Panel title="API health & auth" className="lg:col-span-5" meta={<span className="font-mono text-[11px] text-ink-3">every 1.5s</span>}>
            <HealthMonitor health={health} conn={conn} />
          </Panel>

          <Panel title="Performance: before → after" className="lg:col-span-7">
            <PerfWidget />
          </Panel>

          <Panel title="LLM summary · Redis cache" className="lg:col-span-5">
            <CacheDemo />
          </Panel>
        </div>
      </div>
    </section>
  );
}
