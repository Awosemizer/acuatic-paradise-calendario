import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDayHeading, formatMonthYear, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarView } from '@/src/types';
import { Avatar } from '@/src/components/Avatar';
import { FancyTitle, SegmentedControl, WoodLogo } from '@/src/components/ui';

type Props = {
  cursor: Date;
  view: CalendarView;
  onView: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onProfile: () => void;
  staffName?: string;
  avatarUrl?: string | null;
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
  avatarUrl,
}: Props) {
  const week = weekDays(cursor);
  const title =
    view === 'month'
      ? formatMonthYear(cursor)
      : view === 'week'
        ? `${week[0].getDate()} – ${week[6].getDate()} ${formatMonthYear(cursor)}`
        : formatDayHeading(cursor);

  return (
    <View style={styles.wrap}>
      <View style={styles.pageHead}>
        <WoodLogo size="sm" />
        <FancyTitle size={28} tilt={-5} style={styles.pageTitle}>
          Calendario
        </FancyTitle>
        <Pressable onPress={onProfile} hitSlop={8} style={styles.avatarBtn}>
          <Avatar name={staffName} uri={avatarUrl} size={36} />
        </Pressable>
      </View>

      <View style={styles.tools}>
        <View style={styles.nav}>
          <Pressable onPress={onPrev} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.white} />
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onNext} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={onToday} style={styles.hoyBtn}>
            <Ionicons name="today-outline" size={14} color={colors.tealDeep} />
            <Text style={styles.hoyText}>Hoy</Text>
          </Pressable>
        </View>

        <SegmentedControl options={VIEWS} value={view} onChange={onView} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  pageHead: {
    alignItems: 'center',
    paddingHorizontal: 2,
    position: 'relative',
  },
  pageTitle: {
    marginTop: 8,
  },
  avatarBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  tools: {
    gap: 10,
  },
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
  navTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
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
});
