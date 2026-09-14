import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddMenu } from '@/src/components/AddMenu';
import { CalendarHeader } from '@/src/components/CalendarHeader';
import { DayView } from '@/src/components/DayView';
import { MonthView } from '@/src/components/MonthView';
import { WeekView } from '@/src/components/WeekView';
import { ErrorBoundary, SplashFAB, TropicalBackground } from '@/src/components/ui';
import { useAuth } from '@/src/context/AuthContext';
import { useCalendarData } from '@/src/hooks/useCalendarData';
import { shiftCursor } from '@/src/lib/dates';
import { colors } from '@/src/theme';
import type { CalendarItem, CalendarView } from '@/src/types';

export default function CalendarioScreen() {
  return (
    <TropicalBackground>
      <ErrorBoundary fallbackTitle="No se pudo abrir el calendario">
        <CalendarioBody />
      </ErrorBoundary>
    </TropicalBackground>
  );
}

function CalendarioBody() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [view, setView] = useState<CalendarView>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const { items, loading, error } = useCalendarData(cursor, view);

  const isoForCreate = useMemo(() => {
    const d = view === 'month' ? selectedDay : cursor;
    const copy = new Date(d);
    if (copy.getHours() < 8) copy.setHours(10, 0, 0, 0);
    return copy.toISOString();
  }, [cursor, selectedDay, view]);

  function openItem(item: CalendarItem) {
    if (item.kind === 'visit') {
      router.push(`/(app)/visita/${item.data.id}`);
    } else {
      router.push(`/(app)/evento/${item.data.id}`);
    }
  }

  function goDay(day: Date) {
    setCursor(day);
    setSelectedDay(day);
    setView('day');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <CalendarHeader
        cursor={cursor}
        view={view}
        onView={setView}
        onPrev={() => setCursor((c) => shiftCursor(c, view, -1))}
        onNext={() => setCursor((c) => shiftCursor(c, view, 1))}
        onToday={() => {
          const now = new Date();
          setCursor(now);
          setSelectedDay(now);
        }}
        onProfile={() => router.push('/(app)/(tabs)/mas')}
        staffName={profile?.full_name || profile?.username || 'Equipo'}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : view === 'day' ? (
          <DayView date={cursor} items={items} onPressItem={openItem} />
        ) : view === 'week' ? (
          <WeekView cursor={cursor} items={items} onPressItem={openItem} onPressDay={goDay} />
        ) : (
          <MonthView
            cursor={cursor}
            selected={selectedDay}
            items={items}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setCursor(day);
            }}
            onPressItem={openItem}
          />
        )}
      </View>

      <SplashFAB
        onPress={() => setMenuOpen(true)}
        bottom={Math.max(insets.bottom, 8) + 8}
      />

      <AddMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onVisit={() => {
          setMenuOpen(false);
          router.push({ pathname: '/(app)/visita/nueva', params: { at: isoForCreate } });
        }}
        onEvent={() => {
          setMenuOpen(false);
          router.push({ pathname: '/(app)/evento/nuevo', params: { at: isoForCreate } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: {
    color: colors.danger,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#FDE8E8',
    marginHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
});
