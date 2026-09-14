import { Redirect } from 'expo-router';
import { LoadingScreen } from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/context/AuthContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';

export default function Index() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return <Redirect href="/login" />;
  }
  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect href="/login" />;
  return <Redirect href="/(app)" />;
}
