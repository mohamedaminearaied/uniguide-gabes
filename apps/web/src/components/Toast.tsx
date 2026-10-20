'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Kind = 'info' | 'success' | 'error';
type ToastItem = { id: number; message: string; kind: Kind };

const Ctx = createContext<{ toast: (message: string, kind?: Kind) => void }>({ toast: () => {} });

const styles: Record<Kind, string> = {
  info: 'bg-slate-900 text-white',
  success: 'bg-emerald-700 text-white',
  error: 'bg-red-700 text-white',
};
const icons: Record<Kind, string> = { info: 'ℹ', success: '✓', error: '!' };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: Kind = 'info') => {
    const id = nextId.current++;
    setItems((cur) => [...cur.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[3000] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'calc(var(--bottom-h) + 1rem)' }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`ug-toast pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${styles[t.kind]}`}
          >
            <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
              {icons[t.kind]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
