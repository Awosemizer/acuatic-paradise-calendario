import { Tabs } from 'expo-router';
import { WaveTabBar } from '@/src/components/ui';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <WaveTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
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
