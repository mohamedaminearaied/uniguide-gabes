'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { Button, buttonClass } from '@/components/ui';

// In this Next.js version the recovery callback is called "retry" (not "reset").
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-linear-to-br from-red-50 via-white to-blue-50 px-4">
      <div className="ug-fade-in max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900">{t('error.title')}</h1>
        <p className="mt-2 text-slate-500">{t('error.body')}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>{t('common.retry')}</Button>
          <Link href="/" className={buttonClass('secondary', 'lg')}>{t('common.back')}</Link>
        </div>
      </div>
    </div>
  );
}
