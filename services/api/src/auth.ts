import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import sql from './db.js';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
const JWKS_URL = process.env.SUPABASE_JWKS_URL;
if (!SUPABASE_URL || !JWKS_URL) {
  throw new Error('SUPABASE_URL and SUPABASE_JWKS_URL must be set (see services/api/.env.example). Run: npm run doctor');
}

const ISSUER = `${SUPABASE_URL}/auth/v1`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Role = 'student' | 'admin';

export type AuthUser = {
  id: string;
  email: string | null;
  role: Role;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads "Authorization: Bearer <token>" and, when the token is valid, attaches req.user.
 * A token is accepted only if ALL of this is true:
 *  - signed by YOUR Supabase project (signature checked against its public keys, allowed algorithms only)
 *  - issuer is your project, audience is "authenticated" (so the public anon key is never accepted as a user)
 *  - not expired, and the user still exists, is not deleted and is not banned
 * The ROLE always comes from the database, never from the token or the client.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice('Bearer '.length).trim();
  if (!token || token.length > 4096) return next();

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: 'authenticated',
      algorithms: ['ES256', 'RS256', 'EdDSA'],
      clockTolerance: 5,
    });

    const userId = payload.sub;
    if (typeof userId !== 'string' || !UUID.test(userId)) throw new Error('token has no valid subject');

    const [row] = await sql<{ role: string; email: string | null }[]>`
      SELECT coalesce(p.role, 'student') AS role, u.email AS email
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.id = ${userId}
        AND u.deleted_at IS NULL
        AND (u.banned_until IS NULL OR u.banned_until < now())
    `;

    // Deleted or banned account: its old token stops working immediately.
    if (row) {
      req.user = { id: userId, email: row.email, role: row.role === 'admin' ? 'admin' : 'student' };
    }
  } catch (e) {
    // Invalid/expired token → treated as anonymous (protected routes then answer 401)
    console.warn('[auth] token rejected:', e instanceof Error ? e.message : 'unknown error');
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') {
    console.warn(`[security] admin route refused for non-admin user ${req.user.id} (${req.method} ${req.path})`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
