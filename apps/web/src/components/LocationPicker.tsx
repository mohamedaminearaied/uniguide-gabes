'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { GABES_CENTER } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { Button } from './ui';
import { useToast } from './Toast';

const pickIcon = L.divIcon({
  className: 'ug-pin',
  html: '<div class="ug-pin-dot ug-pin-selected" style="width:44px;height:44px;background:#dc2626;font-size:22px">📍</div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo(point, 17, { duration: 0.8 });
  }, [point, map]);
  return null;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
};

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [fly, setFly] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const hasPoint = latitude != null && longitude != null;

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      toast(t('map.locationDenied'), 'error');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange(pos.coords.latitude, pos.coords.longitude);
        setFly([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setBusy(false);
        toast(t('map.locationDenied'), 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-slate-300 shadow-sm sm:h-[420px]">
      <MapContainer
        center={hasPoint ? [latitude as number, longitude as number] : GABES_CENTER}
        zoom={hasPoint ? 17 : 13}
        zoomControl={false}
        style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl position="topright" />
        {hasPoint && <Marker position={[latitude as number, longitude as number]} icon={pickIcon} keyboard={false} />}
        <ClickHandler onPick={onChange} />
        <FlyTo point={fly} />
      </MapContainer>

      {!hasPoint && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-14">
          <span className="rounded-full bg-slate-900/85 px-4 py-2 text-center text-xs font-medium text-white shadow-lg backdrop-blur">
            👆 {t('submit.tapHint')}
          </span>
        </div>
      )}

      <div className="absolute start-3 bottom-8 z-[500]">
        <Button type="button" variant="secondary" size="sm" onClick={useMyLocation} loading={busy} className="shadow-lg">
          {!busy && <span aria-hidden="true">🧭</span>} {t('submit.useMyLocation')}
        </Button>
      </div>
    </div>
  );
}
