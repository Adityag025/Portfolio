'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { experience, education, honors } from '@/lib/data';
import { SectionHead } from '@/components/ui/SectionHead';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Experience() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        '[data-progress]',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: scope.current, start: 'top 70%', end: 'bottom 60%', scrub: 0.4 } },
      );
    },
    { scope },
  );

  const entries = [
    ...experience.map((e) => ({ period: e.period, title: e.role, org: `${e.org} · ${e.place}`, points: e.points })),
    { period: '2021', title: education.degree, org: `${education.school} · ${education.detail}`, points: [] as string[] },
  ];

  return (
    <section id="experience" aria-labelledby="experience-title" className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-28">
      <SectionHead id="experience" label="Experience" title="Two years shipping client work to production." />

      <div ref={scope} className="relative">
        <div className="absolute top-2 bottom-2 left-[5px] w-px bg-line md:left-[calc(25%+5px)]" aria-hidden="true">
          <div data-progress className="h-full w-full origin-top bg-accent" />
        </div>
        <ol className="space-y-16">
          {entries.map((e, i) => (
            <li key={e.title} className="relative grid gap-3 pl-8 md:grid-cols-4 md:gap-10 md:pl-0" data-reveal>
              <span
                className={`absolute top-[7px] left-0 size-[11px] rounded-full border-2 border-bg md:left-[25%] ${i === 0 ? 'bg-accent' : 'bg-ink-3'}`}
                aria-hidden="true"
              />
              <p className="font-mono text-sm text-ink-3 md:pr-10 md:text-right">{e.period}</p>
              <div className="md:col-span-3 md:pl-10">
                <h3 className="font-display text-2xl font-medium tracking-tight">{e.title}</h3>
                <p className="mt-1 text-ink-3">{e.org}</p>
                {e.points.length > 0 && (
                  <ul className="mt-6 max-w-2xl space-y-3">
                    {e.points.map((p) => (
                      <li key={p} className="grid grid-cols-[12px_1fr] gap-3 leading-relaxed text-ink-2">
                        <span className="mt-[0.7em] h-px w-3 bg-ink-3" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-24 grid gap-3 md:grid-cols-4" aria-label="Honors and certifications">
        <p className="eyebrow md:pt-5 md:pr-10 md:text-right" data-reveal>Honors</p>
        {honors.map((h) => (
          <div key={h.title} className="rounded-xl border border-line bg-surface p-5" data-reveal>
            <p className="font-mono text-xs text-accent">{h.year}</p>
            <p className="mt-3 text-ink">{h.title}</p>
            <p className="mt-1 text-sm text-ink-3">{h.org}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
