import { PressableScale } from '@/src/components/ui/PressableScale';
import { getSettings } from '@/src/lib/settingsStore';
import { format, parseISO } from 'date-fns';
import { memo, useMemo } from 'react';
import { useLayout } from '@/src/hooks/useLayoutMode';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isSameDay, isSameMonth, monthGrid } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { CalendarItemCard, calendarItemKey } from './CalendarItemCard';
import { EmptyState } from './EmptyState';

type Props = {
  cursor: Date;
  selected: Date;
  items: CalendarItem[];
  onSelectDay: (day: Date) => void;
  onPressItem: (item: CalendarItem) => void;
  onOpenFullAgenda?: (day: Date) => void;
  selectMode?: boolean;
  selectedKeys?: Set<string>;
  onToggleItem?: (item: CalendarItem) => void;
  onLongPressItem?: (item: CalendarItem) => void;
};

const DOW_MON = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DOW_SUN = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export const MonthView = memo(function MonthView({
  cursor,
  selected,
  items,
  onSelectDay,
  onPressItem,
  onOpenFullAgenda,
  selectMode,
  selectedKeys,
  onToggleItem,
  onLongPressItem,
}: Props) {
  const { tablet } = useLayout();
  const ws = getSettings().weekStartsOn;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => monthGrid(cursor), [cursor.getFullYear(), cursor.getMonth(), ws]);
  const selectedItems = useMemo(
    () => items.filter((item) => isSameDay(parseISO(item.data.starts_at), selected)),
    [items, selected],
  );
  // One pass over items instead of filtering per cell.
  const countMap = useMemo(() => {
    const m = new Map<string, { visits: number; events: number }>();
    for (const it of items) {
      const k = format(parseISO(it.data.starts_at), 'yyyy-MM-dd');
      const c = m.get(k) ?? { visits: 0, events: 0 };
      if (it.kind === 'visit') c.visits += 1;
      else c.events += 1;
      m.set(k, c);
    }
    return m;
  }, [items]);
  const counts = (day: Date) => countMap.get(format(day, 'yyyy-MM-dd')) ?? { visits: 0, events: 0 };
  const today = new Date();

  const agenda = (
    <>
      <View style={styles.dayHead}>
        <Text style={styles.listTitle}>
          {selected.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        {tablet ? (
          <Text style={styles.listCount}>
            {selectedItems.length === 0
              ? 'Sin citas'
              : selectedItems.length === 1
                ? '1 cita'
                : `${selectedItems.length} citas`}
          </Text>
        ) : null}
      </View>

      {selectedItems.length === 0 ? (
        <EmptyState message="Sin citas este día." />
      ) : (
        selectedItems.map((item) => {
          const key = calendarItemKey(item);
          return (
            <CalendarItemCard
              key={key}
              item={item}
              selectMode={selectMode}
              selected={selectedKeys?.has(key)}
              onPress={() => {
                if (selectMode) onToggleItem?.(item);
                else onPressItem(item);
              }}
              onLongPress={() => onLongPressItem?.(item)}
            />
          );
        })
      )}
    </>
  );

  const grid = (
    <>
      <View style={styles.dowRow}>
        {(ws === 0 ? DOW_SUN : DOW_MON).map((d) => (
          <Text key={d} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          const isSel = isSameDay(day, selected);
          const { visits, events } = counts(day);
          return (
            <PressableScale
              key={day.toISOString()}
              onPress={() => onSelectDay(day)}
              style={[
                styles.cell,
                tablet && styles.cellTablet,
                isSel && styles.cellSel,
                isToday && !isSel && styles.cellToday,
              ]}
            >
              <Text
                style={[
                  styles.num,
                  !inMonth && styles.numMuted,
                  isSel && styles.numSel,
                ]}
              >
                {day.getDate()}
              </Text>
              <View style={styles.dots}>
                {visits > 0 && <View style={[styles.dot, { backgroundColor: colors.visit }]} />}
                {events > 0 && <View style={[styles.dot, { backgroundColor: colors.event }]} />}
              </View>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.visit }]} />
            <Text style={styles.legendText}>Visitas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.event }]} />
            <Text style={styles.legendText}>Eventos</Text>
          </View>
        </View>
        <PressableScale
          onPress={() => onOpenFullAgenda?.(selected)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ver agenda completa"
        >
          <Text style={styles.agendaLink}>Ver agenda completa →</Text>
        </PressableScale>
      </View>

    </>
  );

  if (tablet) {
    return (
      <View style={styles.split}>
        <ScrollView style={styles.splitMain} contentContainerStyle={styles.padTablet}>
          {grid}
        </ScrollView>
        <View style={styles.sidePanel}>
          <ScrollView contentContainerStyle={styles.sidePad}>{agenda}</ScrollView>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      {grid}
      {agenda}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  pad: { padding: 12, paddingBottom: 120 },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dow: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  cellTablet: { aspectRatio: undefined, height: 64 },
  split: { flex: 1, flexDirection: 'row' },
  splitMain: { flex: 1 },
  padTablet: { padding: 16, paddingBottom: 40 },
  sidePanel: {
    width: 360,
    maxWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 24,
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  sidePad: { padding: 16, paddingBottom: 120 },
  listCount: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  cellSel: { backgroundColor: colors.tealDeep },
  cellToday: { backgroundColor: colors.aquaMist },
  num: { fontSize: 14, fontWeight: '700', color: colors.ink },
  numMuted: { color: '#A8B6C3' },
  numSel: { color: colors.white },
  dots: { flexDirection: 'row', gap: 3, height: 8, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  agendaLink: { color: colors.tealDeep, fontWeight: '700', fontSize: 12 },
  dayHead: { marginBottom: 8 },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    textTransform: 'capitalize',
  },
});
