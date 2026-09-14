import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddMenu } from '@/src/components/AddMenu';
import { CalendarHeader } from '@/src/components/CalendarHeader';
import { DayView } from '@/src/components/DayView';
import { MonthView } from '@/src/components/MonthView';
import { WeekView } from '@/src/components/WeekView';
import { useAuth } from '@/src/context/AuthContext';
import { useCalendarData } from '@/src/hooks/useCalendarData';
import { shiftCursor } from '@/src/lib/dates';
import { colors } from '@/src/theme';
import type { CalendarItem, CalendarView } from '@/src/types';

export default function CalendarHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
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
        onProfile={() => router.push('/(app)/perfil')}
        staffName={profile?.full_name || user?.email || 'Equipo'}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.aqua} />
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

      <Pressable
        onPress={() => setMenuOpen(true)}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

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
  screen: { flex: 1, backgroundColor: colors.offWhite },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: {
    color: colors.danger,
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#FDE8E8',
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.navy,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  fabPlus: { fontSize: 32, color: colors.navy, fontWeight: '700', marginTop: -2 },
});
