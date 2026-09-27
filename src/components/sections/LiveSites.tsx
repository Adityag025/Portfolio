'use client';

import { useEffect, useState, type PointerEvent } from 'react';
import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { liveSites, type LiveSite } from '@/lib/data';

const GROUPS: LiveSite['kind'][] = ['Platform', 'Corporate site', 'Landing page'];
const PREVIEW_W = 384;
const PREVIEW_H = 240;
const OFFSET = 28;

const STATUS_LABEL: Record<LiveSite['status'], string | null> = {
  live: null,
  staging: 'Staging',
  gated: 'Invite-only',
};

const domain = (url: string) => new URL(url).host.replace(/^www\./, '');

/**
 * Index of shipped client sites. On a fine pointer, hovering a row shows a
 * screenshot that trails the cursor on a spring; on touch, rows carry an
 * inline thumbnail instead.
 */
export function LiveSites() {
  const [active, setActive] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  // Preview images are only fetched once someone actually hovers the list.
  const [primed, setPrimed] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 320, damping: 32, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 320, damping: 32, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setEnabled(fine && !reduced);
  }, []);

  const onMove = (e: PointerEvent) => {
    if (!enabled) return;
    // Flip to the cursor's other side near the right/bottom edges.
    const px = e.clientX + OFFSET + PREVIEW_W > window.innerWidth ? e.clientX - OFFSET - PREVIEW_W : e.clientX + OFFSET;
    const py = Math.min(e.clientY + OFFSET, window.innerHeight - PREVIEW_H - 16);
    if (!active) { sx.jump(px); sy.jump(py); }
    x.set(px);
    y.set(py);
  };

  return (
    <div
      className="mt-24 md:mt-32"
      onPointerMove={onMove}
      onPointerEnter={() => enabled && setPrimed(true)}
      onPointerLeave={() => setActive(null)}
    >
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5" data-reveal>
        <div>
          <p className="eyebrow mb-2">Shipped for clients</p>
          <h3 className="font-display text-2xl font-medium tracking-tight md:text-3xl">Live sites & landing pages</h3>
        </div>
        <p className="font-mono text-xs text-ink-3 tabular-nums">{liveSites.length} sites · built and maintained at ODigMa</p>
      </header>

      {GROUPS.map((kind) => {
        const sites = liveSites.filter((s) => s.kind === kind);
        return (
          <section key={kind} aria-label={`${kind}s`} className="mb-10 last:mb-0" data-reveal>
            <h4 className="mb-2 flex items-center gap-2 font-mono text-[11px] tracking-wide text-ink-3 uppercase">
              {kind}s <span className="text-line">/</span> <span className="tabular-nums">{String(sites.length).padStart(2, '0')}</span>
            </h4>
            <ul>
              {sites.map((s) => {
                const status = STATUS_LABEL[s.status];
                return (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel={s.status === 'live' ? 'noreferrer' : 'noreferrer nofollow'}
                      onPointerEnter={() => setActive(s.id)}
                      onFocus={() => setActive(null)}
                      className={clsx(
                        'group grid items-center gap-x-6 gap-y-1 border-b border-line-soft py-4 transition-colors duration-150',
                        'grid-cols-[64px_1fr_auto] md:grid-cols-[minmax(0,3fr)_minmax(0,5fr)_minmax(0,2fr)_minmax(0,2.4fr)]',
                      )}
                    >
                      <img
                        src={`/sites/${s.id}.webp`}
                        alt=""
                        loading="lazy"
                        width={64}
                        height={40}
                        className="row-span-2 h-10 w-16 rounded-[4px] border border-line object-cover md:hidden"
                      />
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-[17px] font-medium tracking-tight text-ink transition-colors group-hover:text-accent">{s.name}</span>
                        {s.client && <span className="hidden truncate text-sm text-ink-3 sm:inline">for {s.client}</span>}
                      </span>
                      <span className="col-start-2 line-clamp-2 text-sm text-ink-2 md:col-start-auto md:line-clamp-none md:truncate">{s.summary}</span>
                      <span className="hidden font-mono text-xs text-ink-3 md:block">{s.built}</span>
                      <span className="col-start-3 row-span-2 row-start-1 flex items-center justify-end gap-3 md:col-start-auto md:row-span-1 md:row-start-auto">
                        {status && (
                          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-3 uppercase">{status}</span>
                        )}
                        <span className="hidden truncate font-mono text-xs text-ink-3 transition-colors group-hover:text-ink lg:inline">{domain(s.url)}</span>
                        <ArrowUpRight className="size-4 shrink-0 text-ink-3 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {enabled && primed && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-40"
          style={{ x: sx, y: sy, width: PREVIEW_W, height: PREVIEW_H }}
        >
          <div
            className={clsx(
              'relative h-full w-full overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/60',
              'origin-top-left transition-[opacity,scale] duration-200 ease-[var(--ease-out)]',
              active ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0',
            )}
          >
            {liveSites.map((s) => (
              <img
                key={s.id}
                src={`/sites/${s.id}.webp`}
                alt=""
                width={PREVIEW_W}
                height={PREVIEW_H}
                className={clsx(
                  'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200',
                  active === s.id ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
