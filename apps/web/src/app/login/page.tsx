'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { AuthShell, Button, Field, PasswordInput } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(
        /invalid login/i.test(error.message)
          ? t('auth.invalidCredentials')
          : /not confirmed/i.test(error.message)
            ? t('auth.emailNotConfirmed')
            : error.message
      );
      return;
    }
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
  }

  return (
    <AuthShell
      icon="🎓"
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      footer={
        <>
          <p className="text-slate-600">
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-blue-700 hover:underline">{t('nav.signup')}</Link>
          </p>
          <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
            {t('auth.isAdmin')}{' '}
            <Link href="/admin/login" className="font-semibold text-slate-700 hover:underline">{t('auth.adminLink')}</Link>
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.email')} htmlFor="email">
          <input id="email" required autoFocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </Field>
        <Field label={t('auth.password')} htmlFor="password">
          <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="-mt-1 text-end">
          <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">{t('auth.forgot')}</Link>
        </div>
        {error && <p role="alert" className="alert-error">{error}</p>}
        <Button type="submit" size="lg" full loading={busy}>{busy ? t('auth.loggingIn') : t('auth.loginBtn')}</Button>
      </form>
    </AuthShell>
  );
}
