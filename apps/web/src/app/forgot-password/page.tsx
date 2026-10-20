'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { AuthShell, Button, Field } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <AuthShell
      icon="🔑"
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSub')}
      footer={<Link href="/login" className="font-semibold text-blue-700 hover:underline">{t('auth.backToLogin')}</Link>}
    >
      {sent ? (
        <p role="status" className="alert-success">{t('auth.linkSent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t('auth.email')} htmlFor="email">
            <input id="email" required autoFocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </Field>
          {error && <p role="alert" className="alert-error">{error}</p>}
          <Button type="submit" size="lg" full loading={busy}>{busy ? t('auth.sending') : t('auth.sendLink')}</Button>
        </form>
      )}
    </AuthShell>
  );
}
