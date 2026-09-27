'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import { projects, type Project } from '@/lib/data';
import { SectionHead } from '@/components/ui/SectionHead';
import { SpotCard } from '@/components/ui/SpotCard';
import { Drawer } from '@/components/ui/Drawer';
import { LiveSites } from './LiveSites';

/** FlowBoard's card shows what fractional indexing actually looks like. */
function MiniKanban() {
  const cols = [
    { name: 'Todo', cards: [['a0', 'SSE reconnect'], ['a1', 'Rate-limit invites']] },
    { name: 'Doing', cards: [['a0', 'Summary cache'], ['a0V', 'Moved here'], ['a1', 'Audit log']] },
    { name: 'Done', cards: [['a0', 'Workspace RBAC']] },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 font-mono text-[11px]" aria-hidden="true">
      {cols.map((c) => (
        <div key={c.name} className="rounded-lg border border-line-soft bg-bg/60 p-2">
          <div className="mb-2 flex justify-between px-1 text-ink-3">
            <span>{c.name}</span>
            <span>{c.cards.length}</span>
          </div>
          <div className="space-y-1.5">
            {c.cards.map(([key, title]) => (
              <div
                key={key + title}
                className={clsx(
                  'rounded-md border px-2 py-1.5 transition-transform duration-300 ease-[var(--ease-out)]',
                  key === 'a0V' ? 'border-accent/60 bg-accent/10 text-ink group-hover:-translate-y-0.5' : 'border-line-soft bg-raised text-ink-2',
                )}
              >
                <span className="block truncate">{title}</span>
                <span className={key === 'a0V' ? 'text-accent' : 'text-ink-3'}>pos {key}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <SpotCard tilt={3} className="group relative h-full">
      {/* Stretched button: the whole card opens the case study, while the demo link sits above it. */}
      <button
        type="button"
        onClick={onOpen}
        data-cursor="label"
        data-cursor-label="Explore"
        className="absolute inset-0 z-0 rounded-xl"
        aria-haspopup="dialog"
        aria-label={`${p.name} case study`}
      />
      <div className="pointer-events-none relative flex h-full w-full flex-col p-6 text-left md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-wide text-ink-3 uppercase">{p.kind}</p>
            <h3 className="mt-2 font-display text-2xl font-medium tracking-tight">{p.name}</h3>
          </div>
          <ArrowUpRight className="size-5 shrink-0 text-ink-3 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" aria-hidden="true" />
        </div>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-2">{p.summary}</p>

        {p.featured && <div className="mt-6"><MiniKanban /></div>}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7">
          <div>
            <div className="font-mono text-2xl tracking-tight text-ink tabular-nums">{p.figure.value}</div>
            <div className="text-xs text-ink-3">{p.figure.label}</div>
          </div>
          <ul className="flex max-w-[60%] flex-wrap justify-end gap-1">
            {p.stack.slice(0, p.featured ? 6 : 3).map((s) => (
              <li key={s} className="rounded border border-line-soft px-1.5 py-0.5 font-mono text-[11px] text-ink-3">{s}</li>
            ))}
            {p.stack.length > (p.featured ? 6 : 3) && (
              <li className="px-1 py-0.5 font-mono text-[11px] text-ink-3">+{p.stack.length - (p.featured ? 6 : 3)}</li>
            )}
          </ul>
        </div>
        {p.demo && (
          <a
            href={p.demo.url}
            target="_blank"
            rel="noreferrer"
            data-magnetic
            data-cursor="label"
            data-cursor-label="Open"
            className="press pointer-events-auto relative z-10 mt-6 inline-flex h-10 w-fit items-center gap-2 rounded-md border border-line bg-raised px-4 text-sm hover:border-accent/60"
          >
            <span className="pulse size-1.5 rounded-full bg-good" aria-hidden="true" />
            Live demo
            <ArrowUpRight className="size-4 text-ink-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </SpotCard>
  );
}

const LAYOUT = ['md:col-span-7 md:row-span-2', 'md:col-span-5', 'md:col-span-5', 'md:col-span-6', 'md:col-span-6'];

export function Work() {
  const [open, setOpen] = useState(false);
  // Kept after close so the drawer's content stays put while it slides out.
  const [shownId, setShownId] = useState<string | null>(null);
  const current = projects.find((p) => p.id === shownId) ?? null;

  return (
    <section id="work" aria-labelledby="work-title" className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-28">
      <SectionHead id="work" label="Selected work" title="Five systems, from Kanban sync to lead capture.">
        <p>Each system opens as a short case study. The live client sites I’ve shipped are listed below them.</p>
      </SectionHead>

      <div className="grid gap-3 md:grid-cols-12">
        {projects.map((p, i) => (
          <div key={p.id} className={LAYOUT[i]} data-reveal>
            <ProjectCard p={p} onOpen={() => { setShownId(p.id); setOpen(true); }} />
          </div>
        ))}
      </div>

      <LiveSites />

      <Drawer open={open} onClose={() => setOpen(false)} label={current ? `${current.name} case study` : 'Case study'}>
        {current && (
          <article>
            <p className="font-mono text-[11px] tracking-wide text-ink-3 uppercase">{current.kind}</p>
            <h3 className="mt-2 pr-12 font-display text-3xl font-medium tracking-tight md:text-4xl">{current.name}</h3>
            <p className="mt-4 text-ink-2 leading-relaxed">{current.summary}</p>

            {current.demo && (
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href={current.demo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="press inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-bg hover:bg-accent-soft"
                >
                  Open live demo <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <span className="text-xs text-ink-3">{current.demo.note}</span>
              </div>
            )}

            <div className="mt-8 rounded-lg border border-line bg-bg/50 p-5">
              <div className="font-mono text-3xl tracking-tight tabular-nums">{current.figure.value}</div>
              <div className="mt-1 text-sm text-ink-3">{current.figure.label}</div>
            </div>

            <h4 className="eyebrow mt-10 mb-4">What I built</h4>
            <ul className="space-y-4">
              {current.highlights.map((h) => (
                <li key={h} className="grid grid-cols-[12px_1fr] gap-3 leading-relaxed text-ink-2">
                  <span className="mt-[0.6em] h-px w-3 bg-accent" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>

            <h4 className="eyebrow mt-10 mb-4">Stack</h4>
            <ul className="flex flex-wrap gap-1.5">
              {current.stack.map((s) => (
                <li key={s} className="rounded-md border border-line bg-raised px-2.5 py-1 font-mono text-[12px] text-ink-2">{s}</li>
              ))}
            </ul>
          </article>
        )}
      </Drawer>
    </section>
  );
}
