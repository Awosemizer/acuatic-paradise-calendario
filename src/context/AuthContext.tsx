import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  emailToUsername,
  isValidUsername,
  normalizeUsername,
  usernameToEmail,
} from '@/src/lib/authUsername';
import { isSupabaseConfigured, supabase } from '@/src/lib/supabase';
import type { Profile } from '@/src/types';

type ProfileUpdate = {
  full_name?: string;
  role?: string;
  bio?: string | null;
  avatar_url?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapProfile(data: Record<string, unknown> | null): Profile | null {
  if (!data) return null;
  return {
    id: String(data.id),
    full_name: String(data.full_name ?? ''),
    username: (data.username as string | null) ?? null,
    role: String(data.role ?? 'staff'),
    avatar_url: (data.avatar_url as string | null | undefined) ?? null,
    bio: (data.bio as string | null | undefined) ?? null,
    created_at: String(data.created_at ?? ''),
  };
}

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

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    await ensureProfileUsername(userId, email);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      console.warn('profiles load', error.message);
      setProfile(null);
      return;
    }
    setProfile(mapProfile((data as Record<string, unknown> | null) ?? null));
  }, []);

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
      await loadProfile(userId, session?.user?.email);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.email, loadProfile]);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    await loadProfile(userId, session?.user?.email);
  }, [session?.user?.id, session?.user?.email, loadProfile]);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate) => {
      const userId = session?.user?.id;
      if (!userId) return { error: 'No hay sesión.' };

      const payload: Record<string, unknown> = {};
      if (patch.full_name !== undefined) payload.full_name = patch.full_name;
      if (patch.role !== undefined) payload.role = patch.role;
      if (patch.bio !== undefined) payload.bio = patch.bio;
      if (patch.avatar_url !== undefined) payload.avatar_url = patch.avatar_url;

      const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
      if (error) {
        const msg = error.message ?? '';
        if (msg.includes('avatar_url') || msg.includes('bio') || msg.includes('column')) {
          // Retry without optional columns if migration not applied yet
          const fallback: Record<string, unknown> = {};
          if (patch.full_name !== undefined) fallback.full_name = patch.full_name;
          if (patch.role !== undefined) fallback.role = patch.role;
          if (Object.keys(fallback).length === 0) {
            return {
              error:
                'Faltan columnas de perfil (avatar_url/bio). Aplica supabase/migrations/20260914160000_profiles_avatar_bio.sql.',
            };
          }
          const { error: err2 } = await supabase.from('profiles').update(fallback).eq('id', userId);
          if (err2) return { error: err2.message };
          await refreshProfile();
          return {
            error:
              'Perfil parcial guardado. Aplica la migración de avatar/bio para foto y descripción.',
          };
        }
        return { error: msg };
      }

      await refreshProfile();
      return {};
    },
    [session?.user?.id, refreshProfile],
  );

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
      refreshProfile,
      updateProfile,
    }),
    [session, profile, loading, refreshProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
