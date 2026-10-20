import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import sql from './db.js';
import { optionalAuth, requireAuth, requireAdmin } from './auth.js';
import {
  sendEmail,
  submissionConfirmationHtml,
  approvalHtml,
  rejectionHtml,
} from './email.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const isProd = process.env.NODE_ENV === 'production';

// Behind a reverse proxy (Render, Fly, Railway…) set TRUST_PROXY=1 so rate limiting sees real IPs.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.use(helmet());

if (isProd && !process.env.CORS_ORIGIN) {
  console.warn('[security] CORS_ORIGIN is not set: only http://localhost:3000 will be allowed. Set it to your website address.');
}
// Allowed browser origins: CORS_ORIGIN (comma separated). In development we also accept your PC's
// local-network address so a phone on the same Wi-Fi can use the website (http://192.168.x.x:3000).
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const privateNetwork =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(
  cors({
    origin(origin, cb) {
      // No Origin header = mobile app, curl, server-to-server: allowed (CORS only protects browsers).
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (!isProd && privateNetwork.test(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json({ limit: '50kb' }));

// Responses that depend on who is logged in must never be stored by browsers or proxies.
app.use(['/api/v1/me', '/api/v1/admin'], (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const adminLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api/v1/admin', (req, res, next) => adminLimiter(req, res, next));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
app.use(generalLimiter);

// Attach req.user if a valid Bearer token is present (never rejects)
app.use(optionalAuth);

// ---------- Validation ----------
export const CATEGORIES = ['faculty', 'housing', 'library', 'cafe', 'transport', 'pharmacy', 'other'] as const;

// Only http(s) links: blocks javascript:, data:, etc.
const httpUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => /^https?:\/\//i.test(u), { message: 'URL must start with http:// or https://' });

// Remove invisible control characters (keeps normal text and line breaks), then trim.
const clean = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

const placeFields = {
  name: z.string().max(400).transform(clean).pipe(z.string().min(2).max(120)),
  description: z.string().max(4000).transform(clean).pipe(z.string().max(1000)).optional(),
  category: z.enum(CATEGORIES),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  sourceUrl: httpUrl.optional(),
};

const submissionSchema = z.object({ ...placeFields, submitterEmail: z.string().email().max(200).optional() }).strict();
const adminPlaceSchema = z.object(placeFields).strict();
const STATUSES = ['pending', 'approved', 'rejected'] as const;
const idSchema = z.string().uuid();

/** Best-effort record of admin actions (who did what, when). Never blocks the request. */
async function audit(req: Request, action: string, placeId: string | null, details?: Record<string, unknown>) {
  try {
    await sql`
      INSERT INTO public.audit_log (actor_id, actor_email, action, place_id, details)
      VALUES (${req.user!.id}, ${req.user!.email}, ${action}, ${placeId}, ${details ? sql.json(details as unknown as Parameters<typeof sql.json>[0]) : null})
    `;
  } catch (e) {
    console.error('[audit] could not write audit log (run database/migrations/002_security.sql):', e instanceof Error ? e.message : e);
  }
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

// ---------- Friendly root page (so http://localhost:4000 doesn't look broken) ----------
app.get('/', (_req, res) => {
  res
    .status(200)
    .type('html')
    .send(
      '<!doctype html><meta charset="utf-8"><title>UniGuide API</title>' +
        '<body style="font-family:system-ui;max-width:520px;margin:15vh auto;padding:0 16px;color:#0f172a">' +
        '<h1>UniGuide Gabès API is running ✅</h1>' +
        '<p>This address is the <b>API</b>, it has no web page. The website is at ' +
        '<a href="http://localhost:3000">http://localhost:3000</a>.</p>' +
        '<p>Check the database: <a href="/api/v1/health">/api/v1/health</a></p></body>'
    );
});

// ---------- Health ----------
app.get('/api/v1/health', async (_req, res) => {
  try {
    await sql`select 1`;
    res.json({ status: 'ok', service: 'uniguide-api', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[health]', e);
    res.status(500).json({ status: 'error', db: 'unreachable' });
  }
});

// ---------- Who am I (role is decided here, on the server) ----------
app.get('/api/v1/me', requireAuth, (req, res) => {
  res.json({ id: req.user!.id, email: req.user!.email, role: req.user!.role });
});

// ---------- Public: list approved places ----------
app.get('/api/v1/places', async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : undefined;
    const rows = await sql`
      SELECT
        id, name, description, category,
        latitude, longitude,
        source_url AS "sourceUrl",
        status,
        submitted_at AS "submittedAt",
        reviewed_at AS "reviewedAt"
      FROM public.places
      WHERE status = 'approved'
        ${category ? sql`AND category = ${category}` : sql``}
        ${q ? sql`AND name ILIKE ${'%' + escapeLike(q) + '%'}` : sql``}
      ORDER BY name ASC
      LIMIT 500
    `;
    res.json({ places: rows });
  } catch (e) {
    next(e);
  }
});

// ---------- Public: nearby places (PostGIS) ----------
app.get('/api/v1/places/nearby', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radius ?? 5);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'lat and lng are required numbers' });
    }
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
      return res.status(400).json({ error: 'radius must be between 0 and 100 km' });
    }

    const radiusMeters = radiusKm * 1000;

    const rows = await sql`
      SELECT
        id, name, description, category,
        latitude, longitude,
        source_url AS "sourceUrl",
        extensions.ST_Distance(
          location,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::extensions.geography
        ) AS distance_meters
      FROM public.places
      WHERE status = 'approved'
        AND extensions.ST_DWithin(
          location,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::extensions.geography,
          ${radiusMeters}::float8
        )
      ORDER BY distance_meters ASC
      LIMIT 200
    `;

    res.json({
      center: { latitude: lat, longitude: lng },
      radiusKm,
      places: rows.map((r) => ({ ...r, distanceMeters: Number(r.distance_meters) })),
    });
  } catch (e) {
    next(e);
  }
});

// ---------- Auth: current user's own submissions ----------
app.get('/api/v1/me/submissions', requireAuth, async (req, res, next) => {
  try {
    const rows = await sql`
      SELECT
        id, name, description, category,
        latitude, longitude,
        source_url AS "sourceUrl",
        status,
        rejection_reason AS "rejectionReason",
        submitted_at AS "submittedAt",
        reviewed_at AS "reviewedAt"
      FROM public.places
      WHERE submitter_id = ${req.user!.id}
      ORDER BY submitted_at DESC
    `;
    res.json({ submissions: rows });
  } catch (e) {
    next(e);
  }
});

// ---------- Student: submit a place (goes to moderation) ----------
app.post('/api/v1/places/submissions', writeLimiter, requireAuth, async (req, res, next) => {
  try {
    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid submission', details: parsed.error.flatten() });
    }
    const { name, description, category, latitude, longitude, sourceUrl } = parsed.data;

    // Trust the verified token, never the client, for who the submitter is.
    const submitterEmail = req.user!.email ?? parsed.data.submitterEmail ?? null;

    const [row] = await sql`
      INSERT INTO public.places
        (name, description, category, latitude, longitude, source_url,
         submitter_email, submitter_id, status)
      VALUES (
        ${name},
        ${description ?? null},
        ${category},
        ${latitude},
        ${longitude},
        ${sourceUrl ?? null},
        ${submitterEmail?.toLowerCase() ?? null},
        ${req.user!.id},
        'pending'
      )
      RETURNING id, status, submitted_at AS "submittedAt"
    `;

    if (submitterEmail) {
      void sendEmail({
        to: submitterEmail,
        subject: 'We received your submission — UniGuide Gabès',
        html: submissionConfirmationHtml(name, row.id),
      });
    }

    res.status(201).json({ id: row.id, status: row.status, submittedAt: row.submittedAt });
  } catch (e) {
    next(e);
  }
});

// ---------- Admin: create a place directly (published immediately) ----------
app.post('/api/v1/admin/places', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = adminPlaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid place', details: parsed.error.flatten() });
    }
    const { name, description, category, latitude, longitude, sourceUrl } = parsed.data;

    const [row] = await sql`
      INSERT INTO public.places
        (name, description, category, latitude, longitude, source_url,
         submitter_email, submitter_id, status, reviewed_at)
      VALUES (
        ${name},
        ${description ?? null},
        ${category},
        ${latitude},
        ${longitude},
        ${sourceUrl ?? null},
        ${req.user!.email?.toLowerCase() ?? null},
        ${req.user!.id},
        'approved',
        now()
      )
      RETURNING id, status
    `;
    await audit(req, 'place.create', row.id, { name });
    res.status(201).json({ id: row.id, status: row.status });
  } catch (e) {
    next(e);
  }
});

// ---------- Admin: list submissions ----------
app.get('/api/v1/admin/submissions', requireAdmin, async (req, res, next) => {
  try {
    const raw = typeof req.query.status === 'string' ? req.query.status : undefined;
    if (raw && !(STATUSES as readonly string[]).includes(raw)) {
      return res.status(400).json({ error: 'status must be pending, approved or rejected' });
    }
    const rows = await sql`
      SELECT
        id, name, description, category,
        latitude, longitude,
        source_url AS "sourceUrl",
        submitter_email AS "submitterEmail",
        status,
        rejection_reason AS "rejectionReason",
        submitted_at AS "submittedAt",
        reviewed_at AS "reviewedAt"
      FROM public.places
      ${raw ? sql`WHERE status = ${raw}` : sql``}
      ORDER BY submitted_at DESC
      LIMIT 1000
    `;
    res.json({ submissions: rows });
  } catch (e) {
    next(e);
  }
});

// ---------- Admin: approve ----------
app.patch('/api/v1/admin/submissions/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid id' });

    const [row] = await sql`
      UPDATE public.places
      SET status = 'approved', reviewed_at = now(), rejection_reason = null
      WHERE id = ${req.params.id}
      RETURNING id, status, name, submitter_email AS "submitterEmail"
    `;
    if (!row) return res.status(404).json({ error: 'Not found' });

    if (row.submitterEmail) {
      void sendEmail({
        to: row.submitterEmail,
        subject: 'Your place is now live — UniGuide Gabès',
        html: approvalHtml(row.name),
      });
    }

    await audit(req, 'place.approve', row.id, { name: row.name });
    res.json({ ok: true, id: row.id, status: row.status });
  } catch (e) {
    next(e);
  }
});

// ---------- Admin: reject ----------
app.patch('/api/v1/admin/submissions/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid id' });

    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim().slice(0, 300) : null;

    const [row] = await sql`
      UPDATE public.places
      SET status = 'rejected', reviewed_at = now(), rejection_reason = ${reason}
      WHERE id = ${req.params.id}
      RETURNING id, status, name, submitter_email AS "submitterEmail"
    `;
    if (!row) return res.status(404).json({ error: 'Not found' });

    if (row.submitterEmail) {
      void sendEmail({
        to: row.submitterEmail,
        subject: 'Submission update — UniGuide Gabès',
        html: rejectionHtml(row.name, reason),
      });
    }

    await audit(req, 'place.reject', row.id, { name: row.name, reason });
    res.json({ ok: true, id: row.id, status: row.status });
  } catch (e) {
    next(e);
  }
});

// ---------- 404 + error handler ----------
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    // Malformed JSON, body too large, etc. (the client's fault)
    return res.status(status).json({ error: 'Invalid request' });
  }
  console.error('[api error]', err instanceof Error ? err.message : err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err instanceof Error ? err.message : 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}  (health: http://localhost:${PORT}/api/v1/health)`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✖ Port ${PORT} is already in use. Close the other terminal running the API, or change PORT in services/api/.env.\n`);
  } else {
    console.error('✖ Server error:', err.message);
  }
  process.exit(1);
});
