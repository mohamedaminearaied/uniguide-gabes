'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { CATEGORIES, type CategorySlug } from '@/lib/config';
import { useI18n, type I18nKey } from '@/lib/i18n';
import { Button, Field, buttonClass } from '@/components/ui';
import { useToast } from '@/components/Toast';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100 sm:h-[420px]" />,
});

type Form = {
  name: string;
  description: string;
  category: CategorySlug;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
};

const EMPTY: Form = { name: '', description: '', category: 'faculty', latitude: null, longitude: null, sourceUrl: '' };

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-base font-bold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-sm text-white">{n}</span>
      {children}
    </h2>
  );
}

export default function SubmitPage() {
  const { user, role, loading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">{t('common.loading')}</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="ug-fade-in w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">📍</div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">{t('submit.signinTitle')}</h1>
          <p className="mb-6 text-sm text-slate-600">{t('submit.signinBody')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login?next=/submit" className={buttonClass('primary', 'lg')}>{t('nav.login')}</Link>
            <Link href="/signup" className={buttonClass('secondary', 'lg')}>{t('nav.signup')}</Link>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.latitude == null || form.longitude == null) {
      setError(t('submit.needLocation'));
      toast(t('submit.needLocation'), 'error');
      return;
    }

    setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        latitude: form.latitude,
        longitude: form.longitude,
        sourceUrl: form.sourceUrl.trim() || undefined,
        // Only student submissions carry the email: the admin endpoint rejects unknown fields.
        ...(isAdmin ? {} : { submitterEmail: user?.email ?? undefined }),
      };
      const r = await apiFetch(isAdmin ? '/admin/places' : '/places/submissions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(t('submit.failed', { msg: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center bg-linear-to-br from-emerald-50 via-white to-blue-50 px-4">
        <div className="ug-fade-in w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">{isAdmin ? t('submit.successAdmin') : t('submit.success')}</h1>
          <p className="mb-7 text-sm text-slate-500">{form.name}</p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                setForm(EMPTY);
                setPickerKey((k) => k + 1);
                setDone(false);
              }}
            >
              ＋ {t('submit.another')}
            </Button>
            <Link href={isAdmin ? '/' : '/account'} className={buttonClass('secondary', 'lg')}>
              {isAdmin ? t('nav.map') : t('submit.viewMine')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const hasPoint = form.latitude != null && form.longitude != null;

  return (
    <div className="bg-slate-50 px-4 pt-6 pb-2">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">{t('common.back')}</Link>

        <form onSubmit={onSubmit} className="mt-3">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('submit.title')}</h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-500">{isAdmin ? t('submit.introAdmin') : t('submit.intro')}</p>
          </header>

          {/* Step 1 */}
          <section className="card mb-5 p-4 sm:p-6">
            <StepTitle n={1}>{t('submit.step1')}</StepTitle>
            <LocationPicker
              key={pickerKey}
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p
                dir="ltr"
                className={`rounded-lg px-3 py-1.5 font-mono text-xs ${hasPoint ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
              >
                {hasPoint ? `${form.latitude!.toFixed(6)}, ${form.longitude!.toFixed(6)}` : t('submit.clickMap')}
              </p>
              {hasPoint && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, latitude: null, longitude: null }));
                    setPickerKey((k) => k + 1);
                  }}
                >
                  {t('submit.clearPin')}
                </Button>
              )}
            </div>
          </section>

          {/* Step 2 */}
          <section className="card mb-5 space-y-5 p-4 sm:p-6">
            <StepTitle n={2}>{t('submit.step2')}</StepTitle>

            <Field label={t('submit.name')} htmlFor="name" hint={`${form.name.length}/120`}>
              <input id="name" required minLength={2} maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('submit.namePh')} className="field" />
            </Field>

            <div>
              <p id="cat-label" className="mb-1.5 text-sm font-medium text-slate-700">{t('submit.category')}</p>
              <div role="radiogroup" aria-labelledby="cat-label" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const active = form.category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set('category', c.slug)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                        active ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: `${c.color}1f` }} aria-hidden="true">
                        {c.emoji}
                      </span>
                      <span className="leading-tight">{t(`cat.${c.slug}` as I18nKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={t('submit.description')} htmlFor="description" optional hint={`${form.description.length}/1000`}>
              <textarea id="description" rows={3} maxLength={1000} value={form.description} onChange={(e) => set('description', e.target.value)} className="field resize-none" />
            </Field>

            <Field label={t('submit.sourceUrl')} htmlFor="source" optional>
              <input id="source" type="url" inputMode="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder={t('submit.sourcePh')} className="field" dir="ltr" />
            </Field>
          </section>

          {error && <p role="alert" className="alert-error mb-4">{error}</p>}

          {/* Sticky action bar: always reachable, above the phone's bottom bar */}
          <div
            className="sticky z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md"
            style={{ bottom: 'var(--bottom-h)' }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <Link href="/" className={buttonClass('ghost', 'lg', 'hidden sm:inline-flex')}>{t('common.cancel')}</Link>
              <Button type="submit" size="lg" full loading={busy} className="sm:ms-auto sm:!w-auto sm:min-w-56">
                {busy ? t('submit.sending') : isAdmin ? t('submit.publish') : t('submit.send')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
