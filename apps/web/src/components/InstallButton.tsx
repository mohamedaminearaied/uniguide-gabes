'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { buttonClass } from './ui';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** "Install app" button: native prompt on Android/desktop Chrome/Edge, instructions on iPhone. */
export default function InstallButton() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true); // hidden until we know
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const id = setTimeout(() => {
      setIos(isIos);
      setStandalone(isStandalone);
    }, 0);

    return () => {
      clearTimeout(id);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (standalone || (!deferred && !ios)) return null;

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
      setDeferred(null);
    } else {
      setHelp((h) => !h);
    }
  }

  return (
    <div className="relative">
      <button onClick={onClick} className={buttonClass('subtle', 'sm')} aria-expanded={help}>
        ⬇ {t('pwa.install')}
      </button>
      {help && (
        <div
          role="dialog"
          className="absolute end-0 top-full z-[1200] mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl"
        >
          <p className="mb-1 font-semibold text-slate-900">{t('pwa.iosTitle')}</p>
          <p>{t('pwa.iosBody')}</p>
        </div>
      )}
    </div>
  );
}
