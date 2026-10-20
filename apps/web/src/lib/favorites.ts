'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Saved places live on this device (localStorage). No account needed.
const KEY = 'uniguide.favorites';
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

let cacheRaw: string | null = null;
let cacheVal: string[] = EMPTY;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage unavailable */
  }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cacheVal = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : EMPTY;
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb());
  }, []);

  return { ids, has: (id: string) => ids.includes(id), toggle };
}
