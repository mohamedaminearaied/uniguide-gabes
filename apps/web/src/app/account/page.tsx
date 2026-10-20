'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { categoryMeta } from '@/lib/config';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { Button, EmptyState, StatusBadge, buttonClass } from '@/components/ui';
import { useToast } from '@/components/Toast';

type Submission = {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  submittedAt: string;
};

export default function AccountPage() {
  const { user, role, loading, signOut } = useAuth();
  const { t, formatDate } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch('/me/submissions')
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
        if (!cancelled) setSubs(data.submissions ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">{t('common.loading')}</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="ug-fade-in w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          <h1 className="mb-6 text-xl font-bold text-slate-900">{t('submit.signinTitle')}</h1>
          <Link href="/login?next=/account" className={buttonClass('primary', 'lg', 'w-full')}>{t('nav.login')}</Link>
        </div>
      </div>
    );
  }

  const initial = (user.user_metadata?.display_name || user.email || '?').toString().trim().charAt(0).toUpperCase();
  const count = (s: Submission['status']) => (subs ?? []).filter((x) => x.status === s).length;

  async function handleSignOut() {
    await signOut();
    toast(t('toast.signedOut'), 'info');
    router.push('/');
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">{t('common.back')}</Link>

        <div className="card ug-fade-in mt-3 flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-xl font-bold text-white shadow-md shadow-blue-900/25">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="truncate">{user.user_metadata?.display_name || t('account.title')}</span>
              {role === 'admin' && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">{t('badge.admin')}</span>}
            </h1>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>{t('nav.logout')}</Button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{t('account.mySubs')}</h2>
          <Link href="/submit" className={buttonClass('primary', 'sm')}>＋ {t('nav.submit')}</Link>
        </div>

        {subs && subs.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(['pending', 'approved', 'rejected'] as const).map((s) => (
              <div key={s} className="card px-2 py-3">
                <p className="text-2xl font-bold text-slate-900">{count(s)}</p>
                <p className="text-xs text-slate-500">{t(`status.${s}` as I18nKey)}</p>
              </div>
            ))}
          </div>
        )}

        {error && <p role="alert" className="alert-error mt-4">{error}</p>}

        {subs === null && !error && (
          <div className="mt-4 space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {subs && subs.length === 0 && (
          <div className="card mt-4">
            <EmptyState
              icon="📍"
              title={t('account.none')}
              action={<Link href="/submit" className={buttonClass('primary', 'lg')}>＋ {t('nav.submit')}</Link>}
            />
          </div>
        )}

        {subs && subs.length > 0 && (
          <ul className="mt-4 space-y-3">
            {subs.map((s) => {
              const meta = categoryMeta(s.category);
              return (
                <li key={s.id} className="card ug-fade-in p-4" style={{ borderInlineStartWidth: 4, borderInlineStartColor: meta.color }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{s.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {meta.emoji} {t(`cat.${meta.slug}` as I18nKey)} · {t('account.submitted', { date: formatDate(s.submittedAt) })}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  {s.status === 'rejected' && s.rejectionReason && (
                    <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                      <strong>{t('account.reason')}:</strong> {s.rejectionReason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
