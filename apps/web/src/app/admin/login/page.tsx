'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchMe } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AuthShell, Button, Field, PasswordInput } from '@/components/ui';

export default function AdminLoginPage() {
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

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.session) {
      setBusy(false);
      setError(authError && /invalid login/i.test(authError.message) ? t('auth.invalidCredentials') : (authError?.message ?? 'Login failed'));
      return;
    }

    // The API is the source of truth for roles: ask it who this token belongs to.
    const me = await fetchMe(data.session.access_token);
    if (!me) {
      await supabase.auth.signOut();
      setBusy(false);
      setError(t('auth.apiDown'));
      return;
    }
    if (me.role !== 'admin') {
      await supabase.auth.signOut();
      setBusy(false);
      setError(t('auth.notAdmin'));
      return;
    }

    setBusy(false);
    router.push('/admin');
  }

  return (
    <AuthShell
      dark
      icon="🛡️"
      title={t('auth.adminTitle')}
      subtitle={t('auth.adminSub')}
      footer={<Link href="/login" className="font-semibold text-slate-600 hover:underline">{t('auth.studentLink')}</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.email')} htmlFor="email">
          <input id="email" required autoFocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
        </Field>
        <Field label={t('auth.password')} htmlFor="password">
          <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p role="alert" className="alert-error">{error}</p>}
        <Button type="submit" size="lg" full loading={busy}>{busy ? t('auth.loggingIn') : t('auth.loginBtn')}</Button>
      </form>
    </AuthShell>
  );
}
