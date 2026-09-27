'use client';

import { useSyncExternalStore } from 'react';

/* Two tiny global channels, no context required:
   - cursor data: charts push a tooltip string the cursor renders
   - contact palette: anything can open it */

type Listener = () => void;

function channel<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export const cursorData = channel<string | null>(null);

export type PaletteState = { open: boolean; view: 'actions' | 'message'; animate: boolean };
export const palette = channel<PaletteState>({ open: false, view: 'actions', animate: true });

export function openContact(view: PaletteState['view'] = 'actions', animate = true) {
  palette.set({ open: true, view, animate });
}
export function closeContact() {
  palette.set({ ...palette.get(), open: false });
}

export function usePalette() {
  return useSyncExternalStore(palette.subscribe, palette.get, palette.get);
}
