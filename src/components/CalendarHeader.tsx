import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDayHeading, formatMonthYear, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarView } from '@/src/types';

type Props = {
  cursor: Date;
  view: CalendarView;
  onView: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onProfile: () => void;
  staffName?: string;
};

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export function CalendarHeader({
  cursor,
  view,
  onView,
  onPrev,
  onNext,
  onToday,
  onProfile,
  staffName,
}: Props) {
  const title =
    view === 'month'
      ? formatMonthYear(cursor)
      : view === 'week'
        ? `${weekDays(cursor)[0].getDate()}–${weekDays(cursor)[6].getDate()} ${formatMonthYear(cursor)}`
        : formatDayHeading(cursor);

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View>
          <Text style={styles.brand}>Acuatic Paradise</Text>
          <Text style={styles.sub}>Calendario del equipo</Text>
        </View>
        <Pressable onPress={onProfile} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(staffName ?? 'E').trim().charAt(0).toUpperCase() || 'E'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.nav}>
        <Pressable onPress={onPrev} style={styles.navBtn}>
          <Text style={styles.navGlyph}>‹</Text>
        </Pressable>
        <Pressable onPress={onToday} style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>
        <Pressable onPress={onNext} style={styles.navBtn}>
          <Text style={styles.navGlyph}>›</Text>
        </Pressable>
      </View>

      <View style={styles.switcher}>
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <Pressable
              key={v.id}
              onPress={() => onView(v.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{v.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.aquaLight, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.skyLight, fontSize: 12, marginTop: 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGlyph: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: -2 },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: colors.navyMid,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.aqua },
  tabText: { color: colors.skyMist, fontWeight: '700' },
  tabTextActive: { color: colors.navy },
});
