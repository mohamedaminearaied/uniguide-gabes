'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { buttonClass } from '@/components/ui';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="ug-fade-in max-w-md text-center">
        <p className="text-7xl font-black tracking-tight text-blue-700/90">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{t('notfound.title')}</h1>
        <p className="mt-2 text-slate-500">{t('notfound.body')}</p>
        <Link href="/" className={buttonClass('primary', 'lg', 'mt-8')}>🗺️ {t('common.back').replace('← ', '')}</Link>
      </div>
    </div>
  );
}
