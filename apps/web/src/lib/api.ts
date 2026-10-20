'use client';

import { supabase } from './supabase';
import { API_URL } from './config';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_URL}${path}`, { ...init, headers });
}

/** Ask the API (the source of truth) which role a token belongs to. */
export async function fetchMe(
  accessToken: string
): Promise<{ id: string; email: string | null; role: 'student' | 'admin' } | null> {
  try {
    const r = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
