'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, CircleMarker, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { API_URL, CATEGORIES, GABES_CENTER, categoryMeta, safeUrl } from '@/lib/config';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { useFavorites } from '@/lib/favorites';
import { Button, EmptyState, buttonClass, iconButtonClass } from './ui';
import { useToast } from './Toast';

type Place = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  sourceUrl: string | null;
  reviewedAt: string | null;
};

type Target = { lat: number; lng: number; zoom: number };

/* ---------------------------- helpers ---------------------------- */

const iconCache = new Map<string, L.DivIcon>();
function pinIcon(color: string, emoji: string, selected: boolean) {
  const key = `${color}|${emoji}|${selected}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const size = selected ? 50 : 36;
    icon = L.divIcon({
      className: 'ug-pin',
      html:
        `<div class="ug-pin-dot${selected ? ' ug-pin-selected' : ''}" ` +
        `style="width:${size}px;height:${size}px;background:${color};font-size:${selected ? 24 : 17}px">${emoji}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`;
}

function MapController({
  target,
  fitPoints,
  fitSignal,
  invalidateKey,
}: {
  target: Target | null;
  fitPoints: [number, number][];
  fitSignal: number;
  invalidateKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
  }, [target, map]);

  useEffect(() => {
    if (fitSignal === 0 || fitPoints.length === 0) return;
    map.fitBounds(L.latLngBounds(fitPoints), { padding: [70, 70], maxZoom: 16, duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal, map]);

  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(id);
  }, [invalidateKey, map]);
  return null;
}

const Icon = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  map: <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Zm0 0v13m6-10v13" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  share: <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />,
  nav: <path d="M3 11l18-8-8 18-2-8-8-2Z" />,
};

function Svg({ children, size = 20, fill = 'none' }: { children: React.ReactNode; size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const heartPath = 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z';

function Chip({
  active,
  onClick,
  children,
  floating,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  floating?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
        active
          ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/25'
          : `border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 ${floating ? 'shadow-md shadow-slate-900/10' : ''}`
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ main ------------------------------ */

export default function MapView() {
  const { t, formatDate } = useI18n();
  const { toast } = useToast();

  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [onlySaved, setOnlySaved] = useState(false);
  const [slow, setSlow] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const favorites = useFavorites();
  const deepLinkDone = useRef(false);

  // Load the approved places
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/places`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rows: Place[] = (data.places ?? []).map((p: Place) => ({
          ...p,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
        }));
        const valid = rows.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
        setPlaces(valid);
        setStatus('ready');

        // Shared links look like /?place=<id>: open that place once, on first load.
        if (!deepLinkDone.current) {
          deepLinkDone.current = true;
          const id = new URLSearchParams(window.location.search).get('place');
          const p = id ? valid.find((x) => x.id === id) : undefined;
          if (p) {
            setSelectedId(p.id);
            setTarget({ lat: p.latitude, lng: p.longitude, zoom: 16 });
            setMobileView('map');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Free hosting can put the API to sleep: tell people why the first load is slow.
  useEffect(() => {
    if (status !== 'loading') return;
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, [status, reloadKey]);

  // Escape closes the place card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of places) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [places]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = places.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!onlySaved || favorites.ids.includes(p.id)) &&
        (!q || p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q))
    );
    if (userPos) {
      rows = [...rows].sort(
        (a, b) =>
          distanceMeters(userPos.lat, userPos.lng, a.latitude, a.longitude) -
          distanceMeters(userPos.lat, userPos.lng, b.latitude, b.longitude)
      );
    }
    return rows;
  }, [places, query, category, userPos, onlySaved, favorites.ids]);

  const fitPoints = useMemo<[number, number][]>(() => visible.map((p) => [p.latitude, p.longitude]), [visible]);
  const selected = useMemo(() => places.find((p) => p.id === selectedId) ?? null, [places, selectedId]);
  const filtersActive = query.trim() !== '' || category !== 'all' || onlySaved;

  function select(p: Place) {
    setSelectedId(p.id);
    setTarget({ lat: p.latitude, lng: p.longitude, zoom: 16 });
    setMobileView('map');
  }

  function clearFilters() {
    setQuery('');
    setCategory('all');
    setOnlySaved(false);
  }

  function toggleFavorite(p: Place) {
    const was = favorites.has(p.id);
    favorites.toggle(p.id);
    toast(was ? t('toast.unsaved') : t('toast.saved'), was ? 'info' : 'success');
  }

  function locate() {
    if (!('geolocation' in navigator)) {
      toast(t('map.locationDenied'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setLocating(false);
        setTarget({ ...p, zoom: 15 });
        setMobileView('map');
        toast(t('map.located'), 'success');
      },
      () => {
        setLocating(false);
        toast(t('map.locationDenied'), 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const distanceOf = (p: Place) =>
    userPos ? formatDistance(distanceMeters(userPos.lat, userPos.lng, p.latitude, p.longitude)) : null;

  const chips = (floating: boolean) => (
    <>
      <Chip floating={floating} active={category === 'all' && !onlySaved} onClick={() => { setCategory('all'); setOnlySaved(false); }}>
        {t('map.all')}
      </Chip>
      <Chip floating={floating} active={onlySaved} onClick={() => setOnlySaved((v) => !v)}>
        <span className={onlySaved ? '' : 'text-rose-500'}>♥</span> {t('map.saved')}
        <span className="text-xs opacity-70">{favorites.ids.length}</span>
      </Chip>
      {CATEGORIES.filter((c) => counts[c.slug]).map((c) => (
        <Chip floating={floating} key={c.slug} active={category === c.slug} onClick={() => setCategory(category === c.slug ? 'all' : c.slug)}>
          <span>{c.emoji}</span> {t(`cat.${c.slug}` as I18nKey)}
          <span className="text-xs opacity-70">{counts[c.slug]}</span>
        </Chip>
      ))}
    </>
  );

  return (
    <div
      className="relative flex w-full overflow-hidden"
      style={{ height: 'calc(100dvh - var(--header-h) - var(--bottom-h) - env(safe-area-inset-top, 0px))' }}
    >
      {/* ---------------- Side panel (list) ---------------- */}
      <aside
        className={`${mobileView === 'list' ? 'flex' : 'hidden'} absolute inset-0 z-[500] flex-col bg-white md:relative md:z-10 md:flex md:w-[410px] md:shrink-0 md:border-e md:border-slate-200`}
      >
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="relative">
            <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Svg size={18}>{Icon.search}</Svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('map.search')}
              className="field !ps-11 !pe-11"
              aria-label={t('map.search')}
              type="search"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label={t('map.clear')}
                className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Svg size={16}>{Icon.close}</Svg>
              </button>
            )}
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">{chips(false)}</div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500" aria-live="polite">
              {status === 'ready' && (visible.length === 1 ? t('map.count1') : t('map.count', { n: visible.length }))}
              {status === 'ready' && userPos && <span className="text-slate-400"> · {t('map.sortedNear')}</span>}
            </p>
            <Button variant="subtle" size="sm" onClick={locate} loading={locating}>
              {!locating && <Svg size={16}>{Icon.locate}</Svg>}
              {locating ? t('map.locating') : t('map.locate')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {status === 'loading' && slow && (
            <p className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t('map.waking')}</p>
          )}
          {status === 'loading' && (
            <ul className="space-y-3 p-4" aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex animate-pulse items-center gap-3">
                  <span className="h-11 w-11 rounded-full bg-slate-100" />
                  <span className="flex-1 space-y-2">
                    <span className="block h-3.5 w-2/3 rounded bg-slate-100" />
                    <span className="block h-3 w-1/3 rounded bg-slate-100" />
                  </span>
                </li>
              ))}
            </ul>
          )}

          {status === 'error' && (
            <EmptyState
              icon="📡"
              title={t('map.loadError')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSlow(false);
                    setStatus('loading');
                    setReloadKey((k) => k + 1);
                  }}
                >
                  {t('common.retry')}
                </Button>
              }
            />
          )}

          {status === 'ready' && visible.length === 0 && (
            places.length === 0 ? (
              <EmptyState
                icon="🗺️"
                title={t('map.emptyDb')}
                action={<Link href="/submit" className={buttonClass('primary')}>＋ {t('map.suggestFirst')}</Link>}
              />
            ) : (
              <EmptyState
                icon={onlySaved && favorites.ids.length === 0 ? '♡' : '🔍'}
                title={onlySaved && favorites.ids.length === 0 ? t('map.noSaved') : t('map.empty')}
                action={filtersActive ? <Button variant="secondary" onClick={clearFilters}>{t('map.clearFilters')}</Button> : undefined}
              />
            )
          )}

          {status === 'ready' && visible.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {visible.map((p) => {
                const meta = categoryMeta(p.category);
                const dist = distanceOf(p);
                const fav = favorites.ids.includes(p.id);
                return (
                  <li key={p.id} className={`flex items-center ${selectedId === p.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <button
                      onClick={() => select(p)}
                      className="flex min-w-0 flex-1 items-center gap-3 p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                        style={{ background: `${meta.color}1a` }}
                        aria-hidden="true"
                      >
                        {meta.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-slate-900">{p.name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {t(`cat.${meta.slug}` as I18nKey)}
                          {dist && ` · ${t('map.away', { d: dist })}`}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => toggleFavorite(p)}
                      aria-pressed={fav}
                      aria-label={fav ? t('map.unsave') : t('map.save')}
                      className={`${iconButtonClass('plain', 'me-2')} ${fav ? '!text-rose-500' : ''}`}
                    >
                      <Svg fill={fav ? 'currentColor' : 'none'}><path d={heartPath} /></Svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 p-3 pb-4 md:pb-3">
          <Link href="/submit" className={buttonClass('subtle', 'md', 'w-full')}>
            <span aria-hidden="true" className="text-lg leading-none">＋</span> {t('map.addCta')}
          </Link>
        </div>
      </aside>

      {/* ---------------- Map ---------------- */}
      <div className="relative min-w-0 flex-1">
        <MapContainer center={GABES_CENTER} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ZoomControl position="topright" />
          <MapController target={target} fitPoints={fitPoints} fitSignal={fitSignal} invalidateKey={mobileView} />

          {visible.map((p) => {
            const meta = categoryMeta(p.category);
            return (
              <Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={pinIcon(meta.color, meta.emoji, p.id === selectedId)}
                zIndexOffset={p.id === selectedId ? 1000 : 0}
                eventHandlers={{ click: () => select(p) }}
                keyboard={false}
              />
            );
          })}

          {userPos && (
            <>
              <CircleMarker center={[userPos.lat, userPos.lng]} radius={22} pathOptions={{ stroke: false, fillColor: '#2563eb', fillOpacity: 0.15 }} />
              <CircleMarker center={[userPos.lat, userPos.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />
            </>
          )}
        </MapContainer>

        {/* Phone: filter chips float over the map */}
        {mobileView === 'map' && (
          <div className="no-scrollbar absolute inset-x-0 top-0 z-[500] flex gap-2 overflow-x-auto px-3 pt-3 pb-2 md:hidden">
            {chips(true)}
          </div>
        )}

        {/* Floating map controls */}
        <div
          className={`absolute end-3 z-[500] flex flex-col gap-3 transition-all md:bottom-6 ${
            selected ? 'bottom-[19.5rem]' : 'bottom-24'
          }`}
        >
          <button onClick={() => setFitSignal((n) => n + 1)} aria-label={t('map.fitAll')} title={t('map.fitAll')} className={iconButtonClass('floating')}>
            <Svg>{Icon.fit}</Svg>
          </button>
          <button
            onClick={locate}
            disabled={locating}
            aria-label={t('map.locate')}
            title={t('map.locate')}
            className={iconButtonClass('floating', userPos ? '!text-blue-700' : '')}
          >
            {locating ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" /> : <Svg>{Icon.locate}</Svg>}
          </button>
        </div>

        {/* Selected place card */}
        {selected && (
          <div className="absolute inset-x-3 bottom-[4.75rem] z-[500] md:inset-x-auto md:bottom-6 md:start-6 md:w-[390px]">
            <PlaceCard
              key={selected.id}
              place={selected}
              distance={distanceOf(selected)}
              onClose={() => setSelectedId(null)}
              formatDate={formatDate}
              favorite={favorites.ids.includes(selected.id)}
              onToggleFavorite={() => toggleFavorite(selected)}
            />
          </div>
        )}

        {/* Phone: switch between list and map */}
        <div className="absolute inset-x-0 bottom-4 z-[600] flex justify-center md:hidden">
          <button
            onClick={() => setMobileView((v) => (v === 'list' ? 'map' : 'list'))}
            className={buttonClass('primary', 'md', '!rounded-full px-6 shadow-xl shadow-slate-900/30')}
          >
            <Svg size={18}>{mobileView === 'list' ? Icon.map : Icon.list}</Svg>
            {mobileView === 'list' ? t('map.mapView') : t('map.list')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- place card --------------------------- */

function PlaceCard({
  place,
  distance,
  onClose,
  formatDate,
  favorite,
  onToggleFavorite,
}: {
  place: Place;
  distance: string | null;
  onClose: () => void;
  formatDate: (iso: string) => string;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const meta = categoryMeta(place.category);
  const { latitude: lat, longitude: lng } = place;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  const source = safeUrl(place.sourceUrl);

  async function share() {
    const url = `${window.location.origin}/?place=${place.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: place.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(t('map.linkCopied'), 'success');
      }
    } catch {
      /* the person closed the share sheet */
    }
  }

  return (
    <div className="ug-sheet overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25">
      <div className="h-1.5" style={{ background: meta.color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: `${meta.color}1a`, color: meta.color }}
            >
              {meta.emoji} {t(`cat.${meta.slug}` as I18nKey)}
            </span>
            <h2 className="mt-2 text-lg font-bold leading-snug text-slate-900">{place.name}</h2>
          </div>
          <button onClick={onClose} aria-label={t('map.close')} className={iconButtonClass('plain', '!h-9 !w-9 -me-1 -mt-1')}>
            <Svg size={18}>{Icon.close}</Svg>
          </button>
        </div>

        {place.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{place.description}</p>}

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <span aria-hidden="true">✓</span>
            {place.reviewedAt ? t('map.reviewedOn', { date: formatDate(place.reviewedAt) }) : t('map.reviewed')}
          </span>
          {distance && <span className="text-slate-500">{t('map.away', { d: distance })}</span>}
        </p>

        <a href={directions} target="_blank" rel="noreferrer" className={buttonClass('primary', 'lg', 'mt-4 w-full')}>
          <Svg size={18}>{Icon.nav}</Svg> {t('map.directions')}
        </a>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant={favorite ? 'subtle' : 'secondary'} size="sm" onClick={onToggleFavorite} aria-pressed={favorite}>
            <Svg size={16} fill={favorite ? 'currentColor' : 'none'}><path d={heartPath} /></Svg>
            {favorite ? t('map.saved') : t('map.save')}
          </Button>
          <Button variant="secondary" size="sm" onClick={share}>
            <Svg size={16}>{Icon.share}</Svg> {t('map.share')}
          </Button>
          <a href={osm} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>OpenStreetMap ↗</a>
          {source && (
            <a href={source} target="_blank" rel="noreferrer noopener" className={buttonClass('secondary', 'sm')}>{t('map.source')} ↗</a>
          )}
        </div>
      </div>
    </div>
  );
}
