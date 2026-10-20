'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { categoryMeta, safeUrl } from '@/lib/config';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { Button, EmptyState, StatusBadge, buttonClass } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Status = 'pending' | 'approved' | 'rejected';
type Submission = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  sourceUrl: string | null;
  submitterEmail: string | null;
  status: Status;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

type Tab = Status | 'all';

const borderColor: Record<Status, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

export default function AdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { t, formatDate } = useI18n();
  const { toast } = useToast();

  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [query, setQuery] = useState('');
  const [rejecting, setRejecting] = useState<Submission | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isAdmin = !!user && role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    apiFetch('/admin/submissions')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
        if (cancelled) return;
        setError(null);
        setSubs(
          (data.submissions ?? []).map((s: Submission) => ({
            ...s,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
          }))
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setError(t('admin.loadError', { msg: e instanceof Error ? e.message : String(e) }));
        setSubs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, reloadKey, t]);

  // Escape closes the rejection dialog
  useEffect(() => {
    if (!rejecting) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setRejecting(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rejecting]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: 0 };
    for (const s of subs ?? []) {
      c[s.status] += 1;
      c.all += 1;
    }
    return c;
  }, [subs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (subs ?? []).filter((s) => (tab === 'all' || s.status === tab) && (!q || s.name.toLowerCase().includes(q)));
  }, [subs, tab, query]);

  async function act(s: Submission, action: 'approve' | 'reject', rejectReason?: string) {
    setBusyId(s.id);
    setError(null);
    try {
      const r = await apiFetch(`/admin/submissions/${s.id}/${action}`, {
        method: 'PATCH',
        body: action === 'reject' ? JSON.stringify({ reason: rejectReason }) : undefined,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setSubs((prev) =>
        (prev ?? []).map((x) =>
          x.id === s.id
            ? {
                ...x,
                status: action === 'approve' ? 'approved' : 'rejected',
                rejectionReason: action === 'reject' ? (rejectReason ?? null) : null,
                reviewedAt: new Date().toISOString(),
              }
            : x
        )
      );
      toast(action === 'approve' ? t('toast.approved') : t('toast.rejected'), action === 'approve' ? 'success' : 'info');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast(msg, 'error');
    } finally {
      setBusyId(null);
    }
  }

  function openReject(s: Submission) {
    setRejecting(s);
    setReason(t('admin.rejectDefault'));
  }

  async function confirmReject() {
    if (!rejecting) return;
    const s = rejecting;
    setRejecting(null);
    await act(s, 'reject', reason.trim() || undefined);
  }

  if (authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">{t('common.loading')}</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-slate-900 px-4">
        <div className="ug-fade-in w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">🔒</div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">{t('auth.adminOnlyTitle')}</h1>
          <p className="mb-6 text-sm text-slate-600">{t('auth.adminOnlyBody')}</p>
          <Link href="/admin/login" className={buttonClass('primary', 'lg', 'w-full')}>{t('auth.adminLink')}</Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: t('status.pending') },
    { key: 'approved', label: t('status.approved') },
    { key: 'rejected', label: t('status.rejected') },
    { key: 'all', label: t('admin.all') },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">{t('common.back')}</Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('admin.title')}</h1>
            <p className="text-sm text-slate-500">{t('admin.sub')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReloadKey((k) => k + 1)}>↻ {t('admin.refresh')}</Button>
            <Link href="/submit" className={buttonClass('primary', 'sm')}>＋ {t('admin.add')}</Link>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <div className="inline-flex gap-1 rounded-2xl bg-slate-200/70 p-1" role="tablist">
              {tabs.map((x) => (
                <button
                  key={x.key}
                  role="tab"
                  aria-selected={tab === x.key}
                  onClick={() => setTab(x.key)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    tab === x.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {x.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      x.key === 'pending' && counts.pending > 0 ? 'bg-amber-500 text-white' : 'bg-slate-300/70 text-slate-700'
                    }`}
                  >
                    {counts[x.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.search')}
            aria-label={t('admin.search')}
            className="field sm:max-w-xs"
          />
        </div>

        {error && <p role="alert" className="alert-error mb-4">{error}</p>}

        {subs === null && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {subs && visible.length === 0 && (
          <div className="card">
            <EmptyState icon={tab === 'pending' ? '🎉' : '📭'} title={t('admin.empty')} />
          </div>
        )}

        <ul className="space-y-3">
          {visible.map((s) => {
            const meta = categoryMeta(s.category);
            const src = safeUrl(s.sourceUrl);
            const osm = `https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=18/${s.latitude}/${s.longitude}`;
            return (
              <li
                key={s.id}
                className="card ug-fade-in p-4 sm:p-5"
                style={{ borderInlineStartWidth: 4, borderInlineStartColor: borderColor[s.status] }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{s.name}</h2>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {meta.emoji} {t(`cat.${meta.slug}` as I18nKey)} · {formatDate(s.submittedAt)}
                      {s.submitterEmail && ` · ${t('admin.by', { email: s.submitterEmail })}`}
                    </p>
                    {s.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>}
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-mono text-slate-500" dir="ltr">{s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}</span>
                      <a href={osm} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">{t('admin.viewMap')} ↗</a>
                      {src && <a href={src} target="_blank" rel="noreferrer noopener" className="font-medium text-blue-700 hover:underline">{t('map.source')} ↗</a>}
                    </p>
                    {s.status === 'rejected' && s.rejectionReason && (
                      <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{t('account.reason')}: {s.rejectionReason}</p>
                    )}
                  </div>

                  {s.status === 'pending' && (
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button variant="success" loading={busyId === s.id} onClick={() => act(s, 'approve')} className="flex-1 sm:flex-none">
                        ✓ {t('admin.approve')}
                      </Button>
                      <Button variant="secondary" disabled={busyId === s.id} onClick={() => openReject(s)} className="flex-1 !text-red-700 sm:flex-none">
                        ✕ {t('admin.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {rejecting && (
        <div
          className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
          onClick={() => setRejecting(null)}
        >
          <div className="ug-sheet w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="reject-title" className="text-lg font-bold text-slate-900">{t('admin.rejectTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">{rejecting.name}</p>
            <label htmlFor="reason" className="mb-1.5 mt-4 block text-sm font-medium text-slate-700">{t('admin.rejectReason')}</label>
            <textarea id="reason" autoFocus rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className="field resize-none" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" size="lg" onClick={() => setRejecting(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" size="lg" onClick={confirmReject}>{t('admin.confirmReject')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
