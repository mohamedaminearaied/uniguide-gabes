'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { fetchMe } from './api';

export type Role = 'student' | 'admin';

type AuthState = {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(async (s: Session | null) => {
    if (!s) {
      setRole(null);
      setLoading(false);
      return;
    }
    const me = await fetchMe(s.access_token);
    // If the API is unreachable we fall back to the least-privileged role.
    setRole(me?.role ?? 'student');
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer: never call supabase methods synchronously inside this callback.
      setTimeout(() => void loadRole(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRole]);

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  }

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, role, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
