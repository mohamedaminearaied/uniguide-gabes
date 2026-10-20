import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^https:/, 'wss:') : null;

/**
 * Content-Security-Policy (production only; the dev server needs looser rules).
 * Allows only: this site, your API, your Supabase project and OpenStreetMap map tiles.
 * Set CSP_REPORT_ONLY=1 to log violations in the browser console instead of blocking (for debugging).
 */
const csp = [
  "default-src 'self'",
  // Next.js static pages bootstrap with small inline scripts, so 'unsafe-inline' is needed here.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  `connect-src 'self' ${[apiOrigin, supabaseOrigin, supabaseWs].filter(Boolean).join(' ')}`.trim(),
  "font-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()' },
  ...(isProd
    ? [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        {
          key: process.env.CSP_REPORT_ONLY ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
          value: csp,
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Lets you open the dev site from a phone on the same Wi-Fi (http://YOUR_PC_IP:3000) without warnings.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // The service worker must always be re-checked by the browser so updates reach users.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
