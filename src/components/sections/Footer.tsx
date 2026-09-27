import { profile } from '@/lib/data';

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-8 font-mono text-xs text-ink-3 md:px-8">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Next.js 16 · React 19 · GSAP · Motion · Lenis</span>
        <a href="#top" className="hover:text-ink">Back to top ↑</a>
      </div>
    </footer>
  );
}
