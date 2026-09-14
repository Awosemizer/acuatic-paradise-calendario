import { parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DAY_END_HOUR, DAY_START_HOUR, HOUR_HEIGHT } from '@/src/lib/constants';
import { formatRange } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { EmptyState } from './EmptyState';

type Props = {
  date: Date;
  items: CalendarItem[];
  onPressItem: (item: CalendarItem) => void;
};

function topFor(iso: string) {
  const d = parseISO(iso);
  const minutes = (d.getHours() - DAY_START_HOUR) * 60 + d.getMinutes();
  return (minutes / 60) * HOUR_HEIGHT;
}

function heightFor(minutes: number) {
  return Math.max((minutes / 60) * HOUR_HEIGHT, 36);
}

export function DayView({ date, items, onPressItem }: Props) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const dayItems = items.filter((item) => {
    const d = parseISO(item.data.starts_at);
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  });

  const now = new Date();
  const showNow =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate() &&
    now.getHours() >= DAY_START_HOUR &&
    now.getHours() < DAY_END_HOUR;
  const nowTop = topFor(now.toISOString());

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
      {dayItems.length === 0 && (
        <EmptyState message="No hay visitas ni eventos este día. Toca + para agregar." />
      )}
      <View style={{ height: hours.length * HOUR_HEIGHT, position: 'relative' }}>
        {hours.map((hour, idx) => (
          <View key={hour} style={[styles.hourRow, { top: idx * HOUR_HEIGHT }]}>
            <Text style={styles.hourLabel}>{`${String(hour).padStart(2, '0')}:00`}</Text>
            <View style={styles.hourLine} />
          </View>
        ))}
        {showNow && (
          <View style={[styles.now, { top: nowTop }]}>
            <View style={styles.nowDot} />
            <View style={styles.nowLine} />
          </View>
        )}
        {dayItems.map((item) => {
          const isVisit = item.kind === 'visit';
          const title = isVisit ? item.data.client_name : item.data.title;
          const extra = isVisit ? item.data.service_type : 'Evento';
          return (
            <Pressable
              key={`${item.kind}-${item.data.id}`}
              onPress={() => onPressItem(item)}
              style={[
                styles.block,
                {
                  top: topFor(item.data.starts_at),
                  height: heightFor(item.data.duration_minutes),
                  backgroundColor: isVisit ? colors.aquaMist : colors.coralMist,
                  borderLeftColor: isVisit ? colors.visit : colors.event,
                },
              ]}
            >
              <Text style={styles.blockTime} numberOfLines={1}>
                {formatRange(item.data.starts_at, item.data.duration_minutes)}
              </Text>
              <Text style={styles.blockTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.blockExtra} numberOfLines={1}>
                {extra}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    paddingLeft: 8,
  },
  hourLabel: {
    width: 52,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
    marginTop: 0,
  },
  now: {
    position: 'absolute',
    left: 52,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
    marginLeft: -4,
  },
  nowLine: { flex: 1, height: 2, backgroundColor: colors.coral },
  block: {
    position: 'absolute',
    left: 60,
    right: 12,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 2,
  },
  blockTime: { fontSize: 11, fontWeight: '700', color: colors.navySoft },
  blockTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  blockExtra: { fontSize: 12, color: colors.muted },
});
