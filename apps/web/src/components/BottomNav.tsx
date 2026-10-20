'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

const icons = {
  map: <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Zm0 0v13m6-10v13" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4" />,
  login: <path d="M15 4h4v16h-4M10 8l4 4-4 4m4-4H4" />,
};

export default function BottomNav() {
  const { user, role, loading } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname() ?? '/';

  type Item = { href: string; label: string; icon: keyof typeof icons; active: boolean };
  const left: Item[] = [{ href: '/', label: t('nav.map'), icon: 'map', active: pathname === '/' }];
  const right: Item[] = [];
  if (role === 'admin') right.push({ href: '/admin', label: t('nav.admin'), icon: 'shield', active: pathname.startsWith('/admin') });
  if (!loading && !user) {
    right.push({ href: '/login', label: t('nav.login'), icon: 'login', active: pathname.startsWith('/login') || pathname.startsWith('/signup') });
  } else {
    right.push({ href: '/account', label: t('nav.account'), icon: 'user', active: pathname.startsWith('/account') });
  }
  const addActive = pathname.startsWith('/submit');

  const renderItem = (it: Item) => (
    <li key={it.href} className="flex-1">
      <Link
        href={it.href}
        aria-current={it.active ? 'page' : undefined}
        className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
          it.active ? 'text-blue-700' : 'text-slate-500 active:text-slate-800'
        }`}
      >
        <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${it.active ? 'bg-blue-100' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={it.active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icons[it.icon]}
          </svg>
        </span>
        <span className="max-w-full truncate px-1">{it.label}</span>
      </Link>
    </li>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[1100] border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex h-[3.75rem] items-stretch justify-around">
        {left.map(renderItem)}

        {/* Raised "Add a place" button in the middle: the main action of the app */}
        <li className="flex flex-1 justify-center">
          <Link
            href="/submit"
            aria-label={t('nav.submit')}
            aria-current={addActive ? 'page' : undefined}
            className="-mt-5 flex flex-col items-center gap-0.5 text-[11px] font-semibold text-blue-700 focus-visible:outline-none"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-b from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 ring-4 ring-white transition active:scale-95 ${
                addActive ? 'from-blue-700 to-blue-800' : ''
              }`}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="max-w-[5.5rem] truncate">{t('nav.submit')}</span>
          </Link>
        </li>

        {right.map(renderItem)}
      </ul>
    </nav>
  );
}
