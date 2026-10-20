'use client';

import { useEffect } from 'react';

/** Registers the service worker (offline fallback + installable app). Production builds only. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* not critical: the site works without it */
    });
  }, []);
  return null;
}
