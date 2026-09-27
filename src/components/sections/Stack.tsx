import clsx from 'clsx';
import { stack } from '@/lib/data';
import { SectionHead } from '@/components/ui/SectionHead';
import { SpotCard } from '@/components/ui/SpotCard';

const LAYOUT: Record<string, string> = {
  frontend: 'md:col-span-8',
  backend: 'md:col-span-4 md:row-span-2',
  languages: 'md:col-span-4',
  data: 'md:col-span-4',
  devops: 'md:col-span-5',
  integrations: 'md:col-span-7',
};

function IntegrationFlow() {
  const nodes = ['form', 'zod', 'spam', 'map ×33'];
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-3" aria-hidden="true">
      {nodes.map((n) => (
        <span key={n} className="flex items-center gap-2">
          <span className="rounded border border-line px-2 py-1">{n}</span>
          <span className="text-line">→</span>
        </span>
      ))}
      <span className="flex flex-col gap-1">
        <span className="rounded border border-accent/50 px-2 py-1 text-ink-2">Salesforce</span>
        <span className="rounded border border-line px-2 py-1">TeleCRM</span>
      </span>
    </div>
  );
}

export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-28">
      <SectionHead id="stack" label="Technical stack" title="Tools I reach for, and why.">
        <p>Grouped by where they sit in a request, from browser to database to deploy.</p>
      </SectionHead>

      <div className="grid gap-3 md:grid-cols-12 md:auto-rows-[minmax(190px,auto)]">
        {stack.map((g) => (
          <div key={g.id} className={LAYOUT[g.id]} data-reveal>
          <SpotCard className="flex h-full flex-col p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-xl font-medium tracking-tight">{g.title}</h3>
              <span className="font-mono text-[11px] text-ink-3 tabular-nums">{String(g.items.length).padStart(2, '0')}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-3">{g.note}</p>
            <ul className={clsx('mt-auto flex flex-wrap gap-1.5 pt-6', g.id === 'backend' && 'md:flex-col md:items-start')}>
              {g.items.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-line-soft bg-raised px-2.5 py-1 font-mono text-[12px] text-ink-2 transition-colors duration-150 hover:border-line hover:text-ink"
                >
                  {s}
                </li>
              ))}
            </ul>
            {g.id === 'integrations' && <IntegrationFlow />}
          </SpotCard>
          </div>
        ))}
      </div>
    </section>
  );
}
