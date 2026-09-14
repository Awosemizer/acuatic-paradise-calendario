import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  emailToUsername,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from '@/src/lib/authUsername';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';
import type { Profile } from '@/src/types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureProfileUsername(userId: string, email: string | undefined) {
  const username = emailToUsername(email);
  if (!username) return;

  const { data } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return;
  if (data.username) return;

  await supabase.from('profiles').update({ username }).eq('id', userId);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    (async () => {
      await ensureProfileUsername(userId, session?.user?.email);
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!cancelled) {
        setProfile((data as Profile | null) ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.email]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: async (username, password) => {
        if (!isSupabaseConfigured) {
          return { error: 'Faltan las variables de entorno de Supabase.' };
        }
        const normalized = normalizeUsername(username);
        if (!isValidUsername(normalized)) {
          return {
            error:
              'Usuario inválido. Usa solo letras, números, guion bajo (_) o punto (.).',
          };
        }
        if (!password) {
          return { error: 'Escribe usuario y contraseña.' };
        }
        const email = usernameToEmail(normalized);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { error: 'Usuario o contraseña incorrectos.' };
        }
        return {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
