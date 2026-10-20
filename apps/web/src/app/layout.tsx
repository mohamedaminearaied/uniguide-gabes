import type { Metadata, Viewport } from 'next';
import { Geist, Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth-context';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PwaRegister from '@/components/PwaRegister';
import { ToastProvider } from '@/components/Toast';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const notoArabic = Noto_Sans_Arabic({ variable: '--font-arabic', subsets: ['arabic'] });

export const metadata: Metadata = {
  title: { default: 'UniGuide Gabès', template: '%s · UniGuide Gabès' },
  description: 'Interactive student map: useful places for students in Gabès',
  applicationName: 'UniGuide Gabès',
  appleWebApp: { capable: true, title: 'UniGuide', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1d4ed8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${geistSans.variable} ${notoArabic.variable}`} suppressHydrationWarning>
      <body>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <Header />
              <div style={{ paddingBottom: 'var(--bottom-h)' }}>{children}</div>
              <BottomNav />
              <PwaRegister />
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
