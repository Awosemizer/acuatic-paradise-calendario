import { Tabs } from 'expo-router';
import { WaveTabBar } from '@/src/components/ui';
import { useReminders } from '@/src/hooks/useReminders';
import { useIsTablet } from '@/src/hooks/useLayoutMode';

export default function TabsLayout() {
  useReminders();
  const tablet = useIsTablet();

  return (
    <Tabs
      tabBar={(props) => <WaveTabBar {...(props as any)} rail={tablet} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: tablet ? 'left' : 'bottom',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="tareas" options={{ title: 'Tareas' }} />
      <Tabs.Screen name="bitacora" options={{ title: 'Bitácora' }} />
      <Tabs.Screen name="mas" options={{ title: 'Más' }} />
    </Tabs>
  );
}
