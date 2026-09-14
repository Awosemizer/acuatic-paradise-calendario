import { parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isSameDay, isSameMonth, monthGrid } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { CalendarItemCard } from './CalendarItemCard';
import { EmptyState } from './EmptyState';

type Props = {
  cursor: Date;
  selected: Date;
  items: CalendarItem[];
  onSelectDay: (day: Date) => void;
  onPressItem: (item: CalendarItem) => void;
};

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MonthView({ cursor, selected, items, onSelectDay, onPressItem }: Props) {
  const days = monthGrid(cursor);
  const selectedItems = items.filter((item) => isSameDay(parseISO(item.data.starts_at), selected));

  const counts = (day: Date) => {
    const dayItems = items.filter((item) => isSameDay(parseISO(item.data.starts_at), day));
    return {
      visits: dayItems.filter((i) => i.kind === 'visit').length,
      events: dayItems.filter((i) => i.kind === 'event').length,
    };
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.dowRow}>
        {DOW.map((d) => (
          <Text key={d} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          const isSel = isSameDay(day, selected);
          const { visits, events } = counts(day);
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDay(day)}
              style={[
                styles.cell,
                isSel && styles.cellSel,
                today && !isSel && styles.cellToday,
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
                {visits > 0 && <View style={[styles.dot, { backgroundColor: colors.aqua }]} />}
                {events > 0 && <View style={[styles.dot, { backgroundColor: colors.coral }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.aqua }]} />
          <Text style={styles.legendText}>Visitas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.coral }]} />
          <Text style={styles.legendText}>Eventos</Text>
        </View>
      </View>

      <Text style={styles.listTitle}>
        {selected.toLocaleDateString('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </Text>
      {selectedItems.length === 0 ? (
        <EmptyState message="Nada agendado este día." />
      ) : (
        selectedItems.map((item) => (
          <CalendarItemCard
            key={`${item.kind}-${item.data.id}`}
            item={item}
            onPress={() => onPressItem(item)}
          />
        ))
      )}
    </ScrollView>
  );
}

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
  cellSel: { backgroundColor: colors.navy },
  cellToday: { backgroundColor: colors.aquaMist },
  num: { fontSize: 14, fontWeight: '700', color: colors.ink },
  numMuted: { color: '#A8B6C3' },
  numSel: { color: colors.white },
  dots: { flexDirection: 'row', gap: 3, height: 8, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: 16, marginVertical: 12, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
});
