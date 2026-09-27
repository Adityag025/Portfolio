'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { setScrollLocked } from '@/components/SmoothScroll';

export function Drawer({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { d.showModal(); setScrollLocked(true); }
    if (!open && d.open) { d.close(); }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="drawer thin-scroll overscroll-contain"
      aria-label={label}
      onClose={() => { setScrollLocked(false); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}
    >
      <div className="relative min-h-full p-6 md:p-10">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="press absolute top-5 right-5 grid size-9 place-items-center rounded-md border border-line text-ink-2 hover:text-ink"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
