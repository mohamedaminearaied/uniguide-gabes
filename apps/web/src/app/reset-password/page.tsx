'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { passwordIssue } from '@/lib/password';
import { AuthShell, Button, Field, PasswordInput, PasswordStrength, Spinner, buttonClass } from '@/components/ui';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The e-mail link carries a temporary session; Supabase turns it into a PASSWORD_RECOVERY event.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'INITIAL_SESSION')) {
        setState((s) => (s === 'done' ? s : 'ready'));
      }
    });
    const timer = setTimeout(() => setState((s) => (s === 'checking' ? 'invalid' : s)), 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weak = passwordIssue(password);
    if (weak) {
      setError(t(weak));
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else setState('done');
  }

  return (
    <AuthShell icon="🔐" title={t('auth.resetTitle')}>
      {state === 'checking' && (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Spinner /> {t('auth.checking')}
        </p>
      )}

      {state === 'invalid' && (
        <div className="space-y-4">
          <p role="alert" className="alert-error">{t('auth.resetInvalid')}</p>
          <Link href="/forgot-password" className={buttonClass('primary', 'lg', 'w-full')}>{t('auth.sendLink')}</Link>
        </div>
      )}

      {state === 'ready' && (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t('auth.newPassword')} htmlFor="pw" hint={password ? undefined : t('auth.passwordHint')}>
            <PasswordInput id="pw" required autoFocus minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordStrength value={password} />
          </Field>
          {error && <p role="alert" className="alert-error">{error}</p>}
          <Button type="submit" size="lg" full loading={busy}>{busy ? t('auth.saving') : t('auth.savePassword')}</Button>
        </form>
      )}

      {state === 'done' && (
        <div className="space-y-4">
          <p role="status" className="alert-success">{t('auth.passwordUpdated')}</p>
          <Link href="/" className={buttonClass('primary', 'lg', 'w-full')}>{t('nav.map')}</Link>
        </div>
      )}
    </AuthShell>
  );
}
