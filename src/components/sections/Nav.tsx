'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { openContact } from '@/lib/ui-store';
import { GithubIcon, LinkedinIcon } from '@/components/ui/icons';
import { profile } from '@/lib/data';

const LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#stack', label: 'Stack' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#experience', label: 'Experience' },
  { href: '#lab', label: 'Lab' },
];

export function Nav() {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    // #top and #contact have no nav link; observing them clears the highlight there.
    [...LINKS.map((l) => l.href), '#top', '#contact'].forEach((href) => {
      const el = document.querySelector(href);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-200',
        scrolled ? 'border-line bg-bg/85 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 md:px-8">
        <a href="#top" className="font-mono text-sm font-semibold tracking-tight" aria-label="Aditya Gupta, back to top">
          AG<span className="text-accent">_</span>
        </a>
        <ul className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                aria-current={active === l.href ? 'true' : undefined}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm transition-colors duration-150',
                  active === l.href ? 'text-ink' : 'text-ink-3 hover:text-ink',
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-1">
          <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" data-magnetic className="grid size-9 place-items-center rounded-md text-ink-2 transition-colors hover:text-ink">
            <GithubIcon className="size-4" />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" data-magnetic className="grid size-9 place-items-center rounded-md text-ink-2 transition-colors hover:text-ink">
            <LinkedinIcon className="size-4" />
          </a>
          <a
            href={profile.resume}
            download="Aditya-Gupta-Resume.pdf"
            data-magnetic
            className="press ml-1 hidden h-9 items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:text-ink sm:inline-flex"
          >
            <Download className="size-4" aria-hidden="true" /> Résumé
          </a>
          <button
            type="button"
            data-magnetic
            onClick={() => openContact()}
            className="press ml-2 flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm hover:border-ink-3"
          >
            Contact
            <kbd className="hidden rounded border border-line px-1.5 font-mono text-[10px] text-ink-3 sm:inline">⌘K</kbd>
          </button>
        </div>
      </nav>
    </header>
  );
}
