'use client';

import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n';

function MapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center text-slate-500">
      {t('map.loading')}
    </div>
  );
}

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <MapLoading /> });

export default function MapWrapper() {
  return <MapView />;
}
