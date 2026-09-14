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
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="visita/nueva" options={{ presentation: 'modal' }} />
      <Stack.Screen name="visita/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="evento/nuevo" options={{ presentation: 'modal' }} />
      <Stack.Screen name="evento/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="perfil" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
