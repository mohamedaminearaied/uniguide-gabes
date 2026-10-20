'use client';

import { useId, useState } from 'react';
import { useI18n, type I18nKey } from '@/lib/i18n';

/* ------------------------------------------------------------------ */
/* Buttons: ONE place that defines how every button in the app looks.  */
/* ------------------------------------------------------------------ */

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold ' +
  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-b from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-900/30 ring-1 ring-inset ring-white/10 ' +
    'hover:from-blue-700 hover:to-blue-800 hover:shadow-md focus-visible:ring-blue-500',
  secondary:
    'border border-slate-300 bg-white text-slate-800 shadow-xs hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-blue-500',
  subtle: 'bg-blue-50 text-blue-800 hover:bg-blue-100 focus-visible:ring-blue-500',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-blue-500',
  danger:
    'bg-linear-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-900/25 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500',
  success:
    'bg-linear-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-900/25 hover:from-emerald-600 hover:to-emerald-700 focus-visible:ring-emerald-500',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** Class string for buttons AND link-buttons:  <Link className={buttonClass('primary')}> */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

/** Round icon-only button (map controls, close buttons…). Always give it an aria-label. */
export function iconButtonClass(variant: 'floating' | 'plain' = 'plain', extra = '') {
  const look =
    variant === 'floating'
      ? 'bg-white text-slate-700 shadow-lg shadow-slate-900/15 ring-1 ring-slate-200 hover:bg-slate-50'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800';
  return `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 ` +
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${look} ${extra}`.trim();
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  full?: boolean;
};

export function Button({ variant = 'primary', size = 'md', loading, full, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, `${full ? 'w-full' : ''} ${className}`)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form pieces                                                         */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-slate-400">{t('common.optional')}</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const eye = (
  <>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);
const eyeOff = (
  <>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.8C3.9 8.5 2 12 2 12s3.5 7 10 7c1.5 0 2.8-.3 4-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </>
);

/** Password input with a show/hide eye button. */
export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={shown ? 'text' : 'password'} className={`field !pe-12 ${props.className ?? ''}`} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={shown}
        className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {shown ? eyeOff : eye}
        </svg>
      </button>
    </div>
  );
}

/** Live checklist + strength bar shown under the "new password" field. */
export function PasswordStrength({ value }: { value: string }) {
  const { t } = useI18n();
  const rules: { ok: boolean; key: I18nKey }[] = [
    { ok: value.length >= 8, key: 'auth.rule.length' },
    { ok: /[A-Za-z\u0600-\u06FF]/.test(value), key: 'auth.rule.letter' },
    { ok: /\d/.test(value), key: 'auth.rule.number' },
  ];
  const score = rules.filter((r) => r.ok).length + (value.length >= 12 ? 1 : 0);
  const color = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-500' : 'bg-emerald-500';
  const id = useId();

  if (!value) return null;
  return (
    <div className="mt-2" aria-describedby={id}>
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= score ? color : 'bg-slate-200'}`} />
        ))}
      </div>
      <ul id={id} className="mt-2 space-y-1 text-xs">
        {rules.map((r) => (
          <li key={r.key} className={`flex items-center gap-1.5 ${r.ok ? 'text-emerald-700' : 'text-slate-500'}`}>
            <span aria-hidden="true">{r.ok ? '✓' : '○'}</span>
            {t(r.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

/** Centered card used by login / signup / reset pages. */
export function AuthShell({
  icon,
  title,
  subtitle,
  dark,
  children,
  footer,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[calc(100dvh-3.5rem-var(--bottom-h))] items-center justify-center px-4 py-10 ${
        dark ? 'bg-slate-900' : 'bg-linear-to-br from-blue-50 via-white to-indigo-50'
      }`}
    >
      <div className="ug-fade-in w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-2xl shadow-lg shadow-blue-900/30">
            {icon}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 space-y-3 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">{icon}</div>
      <p className="font-semibold text-slate-900">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const statusLook: Record<string, { cls: string; icon: string; key: I18nKey }> = {
  pending: { cls: 'bg-amber-100 text-amber-800', icon: '⏳', key: 'status.pending' },
  approved: { cls: 'bg-emerald-100 text-emerald-800', icon: '✓', key: 'status.approved' },
  rejected: { cls: 'bg-red-100 text-red-800', icon: '✕', key: 'status.rejected' },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const look = statusLook[status] ?? statusLook.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${look.cls}`}>
      <span aria-hidden="true">{look.icon}</span>
      {t(look.key)}
    </span>
  );
}
