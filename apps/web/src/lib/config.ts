/**
 * API address. In development NEXT_PUBLIC_API_URL points to localhost, which would be the PHONE itself
 * when you open the site from a phone. So when the env value is localhost but the page was opened through
 * your PC's address (e.g. http://192.168.1.20:3000), we use that same address for the API.
 */
function resolveApiUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  if (typeof window === 'undefined') return env;
  try {
    const u = new URL(env);
    const here = window.location.hostname;
    const envIsLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    const hereIsLocal = here === 'localhost' || here === '127.0.0.1';
    if (envIsLocal && !hereIsLocal) {
      u.hostname = here;
      return u.toString().replace(/\/$/, '');
    }
  } catch {
    /* keep env value */
  }
  return env;
}

export const API_URL = resolveApiUrl();

export const GABES_CENTER: [number, number] = [33.8815, 10.0982];

export type CategorySlug =
  | 'faculty'
  | 'housing'
  | 'library'
  | 'cafe'
  | 'transport'
  | 'pharmacy'
  | 'other';

export const CATEGORIES: { slug: CategorySlug; emoji: string; color: string }[] = [
  { slug: 'faculty', emoji: '🎓', color: '#2563eb' },
  { slug: 'housing', emoji: '🏠', color: '#7c3aed' },
  { slug: 'library', emoji: '📚', color: '#0891b2' },
  { slug: 'cafe', emoji: '☕', color: '#d97706' },
  { slug: 'transport', emoji: '🚌', color: '#059669' },
  { slug: 'pharmacy', emoji: '💊', color: '#dc2626' },
  { slug: 'other', emoji: '📍', color: '#475569' },
];

export function categoryMeta(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Only allow http(s) links from user-supplied data (blocks javascript: URLs). */
export function safeUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};
