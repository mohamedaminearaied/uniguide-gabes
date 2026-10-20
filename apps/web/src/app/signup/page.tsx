'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { passwordIssue } from '@/lib/password';
import { AuthShell, Button, Field, PasswordInput, PasswordStrength, buttonClass } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weak = passwordIssue(password);
    if (weak) {
      setError(t(weak));
      return;
    }
    setBusy(true);
    setError(null);
    setExists(false);
    setNotice(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    setBusy(false);
    if (error) {
      if (/already registered|already exists/i.test(error.message) || error.code === 'user_already_exists') setExists(true);
      else setError(error.message);
    } else if (data.user && data.user.identities?.length === 0) {
      // Supabase hides existing emails when "Confirm email" is on: empty identities = account already exists.
      setExists(true);
    } else if (!data.session) {
      setNotice(t('auth.checkEmail'));
    } else {
      router.push('/');
    }
  }

  return (
    <AuthShell
      icon="✨"
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSub')}
      footer={
        <p className="text-slate-600">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">{t('nav.login')}</Link>
        </p>
      }
    >
      {notice ? (
        <div className="space-y-4">
          <p role="status" className="alert-success">{notice}</p>
          <Link href="/login" className={buttonClass('primary', 'lg', 'w-full')}>{t('nav.login')}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t('auth.name')} htmlFor="name">
            <input id="name" required autoFocus autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="field" />
          </Field>
          <Field label={t('auth.email')} htmlFor="email">
            <input id="email" required type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </Field>
          <Field label={t('auth.password')} htmlFor="password" hint={password ? undefined : t('auth.passwordHint')}>
            <PasswordInput id="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordStrength value={password} />
          </Field>

          {error && <p role="alert" className="alert-error">{error}</p>}
          {exists && (
            <div role="alert" className="alert-error space-y-2">
              <p>{t('auth.alreadyRegistered')}</p>
              <p className="flex flex-wrap gap-4 font-semibold">
                <Link href="/login" className="underline">{t('nav.login')}</Link>
                <Link href="/forgot-password" className="underline">{t('auth.forgot')}</Link>
              </p>
            </div>
          )}

          <Button type="submit" size="lg" full loading={busy}>{busy ? t('auth.creating') : t('auth.signupBtn')}</Button>
        </form>
      )}
    </AuthShell>
  );
}
