import { PressableScale } from '@/src/components/ui/PressableScale';
import { parseISO } from 'date-fns';
import { memo, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DAY_END_HOUR, DAY_START_HOUR, HOUR_HEIGHT } from '@/src/lib/constants';
import { formatRange, formatTime } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { calendarItemKey } from './CalendarItemCard';
import { EmptyState } from './EmptyState';

type Props = {
  date: Date;
  items: CalendarItem[];
  onPressItem: (item: CalendarItem) => void;
  selectMode?: boolean;
  selectedKeys?: Set<string>;
  onToggleItem?: (item: CalendarItem) => void;
  onLongPressItem?: (item: CalendarItem) => void;
};

/** Space above the first hour line so its label is never clipped. */
const TOP_PAD = 14;

function topFor(iso: string, startHour: number) {
  const d = parseISO(iso);
  const minutes = (d.getHours() - startHour) * 60 + d.getMinutes();
  return TOP_PAD + (minutes / 60) * HOUR_HEIGHT;
}

function hourLabel(hour: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${hour < 12 ? 'a.m.' : 'p.m.'}`;
}

function heightFor(minutes: number) {
  return Math.max((minutes / 60) * HOUR_HEIGHT, 36);
}

export const DayView = memo(function DayView({
  date,
  items,
  onPressItem,
  selectMode,
  selectedKeys,
  onToggleItem,
  onLongPressItem,
}: Props) {
  const dayItems = useMemo(
    () =>
      items.filter((item) => {
        const d = parseISO(item.data.starts_at);
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
        );
      }),
    [items, date],
  );
  // Grow the grid if an item falls outside the default working hours (otherwise it was hidden).
  const { startHour, endHour } = useMemo(() => {
    let startH = DAY_START_HOUR;
    let endH = DAY_END_HOUR;
    for (const it of dayItems) {
      const d = parseISO(it.data.starts_at);
      const end = new Date(d.getTime() + it.data.duration_minutes * 60_000);
      startH = Math.min(startH, d.getHours());
      const endHr = end.getDate() !== d.getDate() ? 24 : end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
      endH = Math.max(endH, endHr);
    }
    return { startHour: startH, endHour: Math.min(endH, 24) };
  }, [dayItems]);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const now = new Date();
  const showNow =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate() &&
    now.getHours() >= startHour &&
    now.getHours() < endHour;
  const nowTop = topFor(now.toISOString(), startHour);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
      {dayItems.length === 0 && (
        <EmptyState message="No hay visitas ni eventos este día. Toca + para agregar." />
      )}
      <View style={{ height: hours.length * HOUR_HEIGHT + TOP_PAD * 2, position: 'relative' }}>
        {hours.map((hour, idx) => (
          <View key={hour} style={[styles.hourRow, { top: TOP_PAD + idx * HOUR_HEIGHT }]}>
            <Text style={styles.hourLabel} numberOfLines={1}>{hourLabel(hour)}</Text>
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
          const key = calendarItemKey(item);
          const selected = !!selectedKeys?.has(key);
          const blockH = heightFor(item.data.duration_minutes);
          const compact = blockH < 48;
          return (
            <PressableScale
              key={key}
              onPress={() => {
                if (selectMode) onToggleItem?.(item);
                else onPressItem(item);
              }}
              onLongPress={() => onLongPressItem?.(item)}
              delayLongPress={350}
              style={[
                styles.block,
                {
                  top: topFor(item.data.starts_at, startHour),
                  height: blockH,
                  backgroundColor: isVisit ? colors.aquaMist : colors.coralMist,
                  borderLeftColor: isVisit ? colors.visit : colors.event,
                },
                compact && styles.blockCompact,
                selected && styles.blockSelected,
              ]}
            >
              {compact ? (
                <Text style={styles.blockTitle} numberOfLines={1}>
                  <Text style={styles.blockTime}>{formatTime(item.data.starts_at)} · </Text>
                  {title}
                </Text>
              ) : (
                <>
                  <Text style={styles.blockTime} numberOfLines={1}>
                    {formatRange(item.data.starts_at, item.data.duration_minutes)}
                  </Text>
                  <Text style={styles.blockTitle} numberOfLines={blockH > 80 ? 2 : 1}>
                    {title}
                  </Text>
                  {blockH > 64 ? (
                    <Text style={styles.blockExtra} numberOfLines={1}>
                      {extra}
                    </Text>
                  ) : null}
                </>
              )}
            </PressableScale>
          );
        })}
      </View>
    </ScrollView>
  );
});

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
    width: 56,
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    marginTop: -7,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
    marginTop: 0,
  },
  now: {
    position: 'absolute',
    left: 60,
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
    left: 66,
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
  blockCompact: { paddingVertical: 2, justifyContent: 'center' },
  blockSelected: {
    borderWidth: 1,
    borderColor: colors.teal,
  },
});
