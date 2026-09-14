import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDayHeading, formatMonthYear, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarView } from '@/src/types';
import { SegmentedControl, WoodLogo } from '@/src/components/ui';

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
  const week = weekDays(cursor);
  const title =
    view === 'month'
      ? formatMonthYear(cursor)
      : view === 'week'
        ? `${week[0].getDate()} – ${week[6].getDate()} ${formatMonthYear(cursor)}`
        : formatDayHeading(cursor);

  const subtitle =
    view === 'week'
      ? 'Planificamos juntos grandes momentos'
      : view === 'month'
        ? 'Organizamos hoy, momentos increíbles mañana'
        : 'Un gran día en Acuatic Paradise';

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <WoodLogo size="sm" />
        <Text style={styles.script} numberOfLines={2}>
          {view === 'week'
            ? 'Organización hoy, experiencias inolvidables ♡'
            : 'Buenas experiencias todo el año ♡'}
        </Text>
        <Pressable onPress={onProfile} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(staffName ?? 'E').trim().charAt(0).toUpperCase() || 'E'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.titleCard}>
        <View style={styles.titleRow}>
          <View style={styles.calIcon}>
            <Ionicons name="calendar" size={20} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Calendario del equipo</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>
          <Pressable onPress={onToday} style={styles.hoyBtn}>
            <Ionicons name="today-outline" size={14} color={colors.tealDeep} />
            <Text style={styles.hoyText}>Hoy</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.nav}>
        <Pressable onPress={onPrev} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.white} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={onNext} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </Pressable>
      </View>

      <SegmentedControl options={VIEWS} value={view} onChange={onView} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  script: {
    flex: 1,
    color: colors.white,
    fontStyle: 'italic',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  titleCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.aquaMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontSize: 16, fontWeight: '800', color: colors.navy },
  sub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  hoyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.aquaMist,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  hoyText: { color: colors.tealDeep, fontWeight: '800', fontSize: 12 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});
