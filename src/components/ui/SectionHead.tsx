import type { ReactNode } from 'react';

export function SectionHead({ id, label, title, children }: { id: string; label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-10 grid gap-4 md:mb-14 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <p className="eyebrow mb-3 flex items-center gap-2" data-reveal>
          <span className="inline-block h-px w-6 bg-accent" aria-hidden="true" />
          <span>{label}</span>
        </p>
        <h2 id={`${id}-title`} className="font-display text-3xl font-medium tracking-[-0.03em] text-balance md:text-5xl" data-reveal>
          {title}
        </h2>
      </div>
      {children && (
        <div className="text-ink-2 md:col-span-5 md:pb-2 text-pretty" data-reveal>
          {children}
        </div>
      )}
    </header>
  );
}
