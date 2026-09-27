'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Activity, ArrowLeft, Copy, FileText, MessageSquare, Phone, Search } from 'lucide-react';
import { profile } from '@/lib/data';
import { copy } from '@/lib/copy';
import { closeContact, openContact, palette, usePalette } from '@/lib/ui-store';
import { GithubIcon, LinkedinIcon } from '@/components/ui/icons';
import { scrollToHash, setScrollLocked } from '@/components/SmoothScroll';

const messageSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters).'),
  email: z.email('Enter an email address I can reply to.'),
  message: z.string().trim().min(20, 'Add a little more detail (at least 20 characters).').max(2000, 'Keep it under 2,000 characters.'),
});
type Errors = Partial<Record<keyof z.infer<typeof messageSchema>, string>>;

type Action = { id: string; label: string; hint: string; icon: React.ReactNode; run: () => void; keep?: boolean };

export function ContactPalette() {
  const state = usePalette();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  // ⌘K / Ctrl+K toggles. Keyboard-opened palettes don't animate: they're used often and should feel instant.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette.get().open) closeContact();
        else openContact('actions', false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const d = ref.current!;
    if (state.open && !d.open) {
      d.showModal();
      setScrollLocked(true);
      setQuery('');
      setSel(0);
      setErrors({});
    }
    if (!state.open && d.open) d.close();
  }, [state.open]);

  useEffect(() => {
    if (state.open && state.view === 'actions') requestAnimationFrame(() => inputRef.current?.focus());
  }, [state.open, state.view]);

  const actions: Action[] = useMemo(
    () => [
      { id: 'message', label: 'Write a message', hint: 'Form', icon: <MessageSquare className="size-4" />, run: () => openContact('message', state.animate), keep: true },
      { id: 'email', label: 'Copy email address', hint: profile.email, icon: <Copy className="size-4" />, run: () => copy(profile.email, 'Email') },
      { id: 'phone', label: 'Copy phone number', hint: profile.phone, icon: <Phone className="size-4" />, run: () => copy(profile.phone, 'Phone') },
      { id: 'github', label: 'Open GitHub', hint: profile.githubLabel, icon: <GithubIcon className="size-4" />, run: () => window.open(profile.github, '_blank', 'noopener') },
      { id: 'linkedin', label: 'Open LinkedIn', hint: profile.linkedinLabel, icon: <LinkedinIcon className="size-4" />, run: () => window.open(profile.linkedin, '_blank', 'noopener') },
      { id: 'resume', label: 'Download résumé', hint: 'PDF', icon: <FileText className="size-4" />, run: () => {
        const a = document.createElement('a');
        a.href = profile.resume;
        a.download = 'Aditya-Gupta-Resume.pdf';
        a.click();
      } },
      { id: 'dashboard', label: 'Go to live dashboard', hint: '#dashboard', icon: <Activity className="size-4" />, run: () => setTimeout(() => scrollToHash('#dashboard'), 50) },
    ],
    [state.animate],
  );
  const filtered = actions.filter((a) => `${a.label} ${a.hint}`.toLowerCase().includes(query.toLowerCase()));

  const runAction = (a: Action) => {
    a.run();
    if (!a.keep) closeContact();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === 'Enter' && filtered[sel]) { e.preventDefault(); runAction(filtered[sel]); }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = messageSchema.safeParse(data);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Errors;
        next[k] ??= issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    const { name, email, message } = parsed.data;
    const subject = encodeURIComponent(`Hello from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    toast.success('Opening your email app', { description: 'Your message is filled in. Press send there.' });
    closeContact();
  };

  const field = 'w-full rounded-md border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-ink-3';

  return (
    <dialog
      ref={ref}
      className="palette"
      data-animate={state.animate}
      aria-label="Contact"
      onClose={() => { setScrollLocked(false); closeContact(); }}
      onClick={(e) => { if (e.target === ref.current) closeContact(); }}
    >
      {state.view === 'actions' ? (
        <div onKeyDown={onListKey}>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 text-ink-3" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSel(0); }}
              placeholder="Search actions…"
              aria-label="Search contact actions"
              aria-controls="palette-list"
              aria-activedescendant={filtered[sel] ? `pa-${filtered[sel].id}` : undefined}
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
            />
            <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-ink-3">esc</kbd>
          </div>
          <ul id="palette-list" role="listbox" aria-label="Contact actions" className="max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">No action matches “{query}”.</li>}
            {filtered.map((a, i) => (
              <li
                key={a.id}
                id={`pa-${a.id}`}
                role="option"
                aria-selected={i === sel}
                onPointerMove={() => setSel(i)}
                onClick={() => runAction(a)}
                className={clsx('flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm', i === sel ? 'bg-raised text-ink' : 'text-ink-2')}
              >
                <span className={i === sel ? 'text-accent' : 'text-ink-3'} aria-hidden="true">{a.icon}</span>
                <span className="flex-1">{a.label}</span>
                <span className="truncate font-mono text-xs text-ink-3">{a.hint}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <button type="button" onClick={() => openContact('actions', state.animate)} className="press grid size-8 place-items-center rounded-md border border-line text-ink-2 hover:text-ink" aria-label="Back to actions">
              <ArrowLeft className="size-4" />
            </button>
            <h2 className="font-display text-lg font-medium">Write a message</h2>
          </div>
          {(['name', 'email', 'message'] as const).map((k) => (
            <div key={k} className="mb-4">
              <label htmlFor={`c-${k}`} className="mb-1.5 block font-mono text-xs text-ink-3 capitalize">{k}</label>
              {k === 'message' ? (
                <textarea id={`c-${k}`} name={k} rows={5} placeholder="What are you working on?" aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} className={clsx(field, 'resize-y', errors[k] ? 'border-bad/70' : 'border-line')} />
              ) : (
                <input id={`c-${k}`} name={k} type={k === 'email' ? 'email' : 'text'} autoComplete={k} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} className={clsx(field, errors[k] ? 'border-bad/70' : 'border-line')} />
              )}
              {errors[k] && <p id={`e-${k}`} className="mt-1.5 text-xs text-bad">{errors[k]}</p>}
            </div>
          ))}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-3">Opens your email app with the message filled in.</p>
            <button type="submit" className="press inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-bg hover:bg-accent-soft">
              Compose email
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
