'use client';

import { ArrowDownRight, Activity, Download } from 'lucide-react';
import { heroMetrics, profile } from '@/lib/data';
import { openContact } from '@/lib/ui-store';
import { GithubIcon, LinkedinIcon } from '@/components/ui/icons';
import { PipelinePreview } from './PipelinePreview';

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative pt-28 md:pt-36">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="eyebrow fade-up mb-6 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ ['--d' as string]: '80ms' }}>
            <span>{profile.location}</span>
            <span className="text-line" aria-hidden="true">/</span>
            <span>SDE · {profile.company.replace(' Limited', '')}</span>
          </p>

          <h1 id="hero-title" className="font-display text-[clamp(2.6rem,7.2vw,5.6rem)] leading-[0.95] font-medium tracking-[-0.045em]">
            <span className="rise-mask"><span className="rise" style={{ ['--d' as string]: '120ms' }}>Aditya Gupta —</span></span>
            <span className="rise-mask"><span className="rise text-ink-3" style={{ ['--d' as string]: '220ms' }}>Full Stack Developer</span></span>
          </h1>

          <p className="fade-up mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-2 text-pretty" style={{ ['--d' as string]: '420ms' }}>
            Specializing in high-throughput backends, resilient CRM integrations, and crisp React/Next.js frontend architectures.
          </p>

          <div className="fade-up mt-9 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '520ms' }}>
            <a href="#work" data-magnetic className="press inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-bg hover:bg-accent-soft">
              View selected work <ArrowDownRight className="size-4" aria-hidden="true" />
            </a>
            <a href="#dashboard" data-magnetic className="press inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-5 text-sm hover:border-ink-3">
              <Activity className="size-4 text-accent" aria-hidden="true" /> Open live dashboard
            </a>
            <a href={profile.resume} download="Aditya-Gupta-Resume.pdf" data-magnetic className="press inline-flex h-11 items-center gap-2 rounded-md border border-line px-5 text-sm hover:border-ink-3">
              <Download className="size-4" aria-hidden="true" /> Download résumé
            </a>
            <button type="button" data-magnetic onClick={() => openContact()} className="press inline-flex h-11 items-center rounded-md px-4 text-sm text-ink-2 hover:text-ink">
              Get in touch
            </button>
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            <a href={profile.github} target="_blank" rel="noreferrer" data-magnetic aria-label="GitHub: Adityag025" className="grid size-11 place-items-center rounded-md text-ink-2 hover:text-ink">
              <GithubIcon className="size-[18px]" />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" data-magnetic aria-label="LinkedIn: devadityagupta" className="grid size-11 place-items-center rounded-md text-ink-2 hover:text-ink">
              <LinkedinIcon className="size-[18px]" />
            </a>
          </div>
        </div>

        <div className="fade-up lg:col-span-5 lg:pt-10" style={{ ['--d' as string]: '640ms' }}>
          <PipelinePreview />
          <p className="mt-3 font-mono text-[11px] text-ink-3">
            The same validation path my production CRM integrations run. <a href="#dashboard" className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink">Send one yourself →</a>
          </p>
        </div>
      </div>

      <dl className="mx-auto mt-20 grid max-w-[1240px] grid-cols-2 border-y border-line md:mt-28 md:grid-cols-4">
        {heroMetrics.map((m, i) => (
          <div
            key={m.label}
            className={`fade-up flex flex-col px-4 py-6 md:px-8 md:py-8 ${i % 2 ? 'border-l border-line' : ''} ${i > 0 ? 'md:border-l md:border-line' : ''} ${i > 1 ? 'border-t border-line md:border-t-0' : ''}`}
            style={{ ['--d' as string]: `${760 + i * 60}ms` }}
          >
            <dt className="order-2 mt-2 text-sm text-ink-3">{m.label}</dt>
            <dd className="font-mono text-3xl font-medium tracking-tight tabular-nums md:text-4xl">
              {m.value}
              <span className="ml-0.5 text-lg text-accent">{m.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
