'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import InstallButton from './InstallButton';
import { buttonClass } from './ui';
import { useToast } from './Toast';

export default function Header() {
  const { user, role, loading, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { toast } = useToast();

  async function handleSignOut() {
    await signOut();
    toast(t('toast.signedOut'), 'info');
    router.push('/');
  }

  const link = (href: string, active: boolean) =>
    `relative rounded-lg px-3 py-2 text-sm font-medium transition ${
      active ? 'text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header
      className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl pe-2 font-bold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-base text-white shadow-md shadow-blue-900/25">📍</span>
            <span className="hidden sm:inline">{t('app.name')}</span>
          </Link>
          <nav className="ms-3 hidden items-center gap-1 md:flex" aria-label="Main">
            <Link href="/" className={link('/', pathname === '/')}>{t('nav.map')}</Link>
            {user && <Link href="/account" className={link('/account', pathname.startsWith('/account'))}>{t('nav.account')}</Link>}
            {role === 'admin' && <Link href="/admin" className={link('/admin', pathname.startsWith('/admin'))}>{t('nav.admin')}</Link>}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <InstallButton />
          <LanguageSwitcher />

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/submit" className={buttonClass('primary', 'sm')}>
              <span aria-hidden="true" className="text-base leading-none">＋</span> {t('nav.submit')}
            </Link>
            {loading ? (
              <span className="px-2 text-slate-300">…</span>
            ) : user ? (
              <>
                {role === 'admin' && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">{t('badge.admin')}</span>
                )}
                <button onClick={handleSignOut} className={buttonClass('ghost', 'sm')}>{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClass('secondary', 'sm')}>{t('nav.login')}</Link>
                <Link href="/signup" className={buttonClass('subtle', 'sm')}>{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
