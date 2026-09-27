'use client';

import { Copy, MessageSquare } from 'lucide-react';
import { profile } from '@/lib/data';
import { copy } from '@/lib/copy';
import { openContact } from '@/lib/ui-store';

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-24 md:grid-cols-12 md:px-8 md:py-32">
        <div className="md:col-span-7">
          <p className="eyebrow mb-4 flex items-center gap-2" data-reveal>
            <span className="inline-block h-px w-6 bg-accent" aria-hidden="true" /> Contact
          </p>
          <h2 id="contact-title" className="font-display text-4xl font-medium tracking-[-0.035em] text-balance md:text-6xl" data-reveal>
            Need a backend that never drops a lead?
          </h2>
          <p className="mt-6 max-w-md text-ink-2" data-reveal>
            Hiring for a full-stack or backend role, or need a CRM integration that holds up under real traffic? Send a note.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" data-reveal>
            <button type="button" data-magnetic onClick={() => openContact('message')} className="press inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-bg hover:bg-accent-soft">
              <MessageSquare className="size-4" aria-hidden="true" /> Write a message
            </button>
            <button type="button" onClick={() => openContact()} className="press inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-sm text-ink-2 hover:text-ink">
              More options <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-ink-3">⌘K</kbd>
            </button>
          </div>
        </div>

        <dl className="self-end md:col-span-5">
          {[
            { k: 'Email', v: profile.email, copyable: true },
            { k: 'Phone', v: profile.phone, copyable: true },
            { k: 'GitHub', v: profile.githubLabel, href: profile.github },
            { k: 'LinkedIn', v: profile.linkedinLabel, href: profile.linkedin },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between gap-4 border-b border-line py-4 first:border-t" data-reveal>
              <dt className="font-mono text-xs text-ink-3">{row.k}</dt>
              <dd className="min-w-0">
                {row.copyable ? (
                  <button type="button" onClick={() => copy(row.v, row.k)} className="group inline-flex items-center gap-2 truncate font-mono text-sm text-ink hover:text-accent" aria-label={`Copy ${row.k.toLowerCase()} ${row.v}`}>
                    {row.v}
                    <Copy className="size-3.5 text-ink-3 transition-colors group-hover:text-accent" aria-hidden="true" />
                  </button>
                ) : (
                  <a href={row.href} target="_blank" rel="noreferrer" className="truncate font-mono text-sm text-ink hover:text-accent">{row.v}</a>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
