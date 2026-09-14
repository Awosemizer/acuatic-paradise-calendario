import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/context/AuthContext';
import { colors } from '@/src/theme';

export default function AppGroupLayout() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.offWhite },
      }}
    />
  );
}
