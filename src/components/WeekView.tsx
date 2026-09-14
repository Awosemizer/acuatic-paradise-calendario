import { parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { isSameDay, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { formatTime } from '@/src/lib/dates';

type Props = {
  cursor: Date;
  items: CalendarItem[];
  onPressItem: (item: CalendarItem) => void;
  onPressDay: (day: Date) => void;
};

export function WeekView({ cursor, items, onPressItem, onPressDay }: Props) {
  const days = weekDays(cursor);
  const { width } = useWindowDimensions();
  const compact = width < 720;

  if (compact) {
    return (
      <ScrollView contentContainerStyle={styles.listPad}>
        {days.map((day) => {
          const dayItems = items.filter((item) => isSameDay(parseISO(item.data.starts_at), day));
          const today = isSameDay(day, new Date());
          return (
            <View key={day.toISOString()} style={styles.dayBlock}>
              <Pressable onPress={() => onPressDay(day)} style={styles.dayHead}>
                <Text style={[styles.dayName, today && styles.todayText]}>
                  {day.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                </Text>
                {today && <Text style={styles.todayPill}>Hoy</Text>}
              </Pressable>
              {dayItems.length === 0 ? (
                <Text style={styles.empty}>Sin citas</Text>
              ) : (
                dayItems.map((item) => {
                  const isVisit = item.kind === 'visit';
                  const title = isVisit ? item.data.client_name : item.data.title;
                  return (
                    <Pressable
                      key={`${item.kind}-${item.data.id}`}
                      onPress={() => onPressItem(item)}
                      style={[
                        styles.rowItem,
                        { borderLeftColor: isVisit ? colors.aqua : colors.coral },
                      ]}
                    >
                      <Text style={styles.rowTime}>{formatTime(item.data.starts_at)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.rowKind}>{isVisit ? 'Visita' : 'Evento'}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView horizontal contentContainerStyle={styles.gridPad}>
      <View style={styles.grid}>
        {days.map((day) => {
          const dayItems = items.filter((item) => isSameDay(parseISO(item.data.starts_at), day));
          const today = isSameDay(day, new Date());
          return (
            <View key={day.toISOString()} style={[styles.col, today && styles.colToday]}>
              <Pressable onPress={() => onPressDay(day)} style={styles.colHead}>
                <Text style={styles.colDow}>
                  {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                </Text>
                <Text style={[styles.colNum, today && styles.todayNum]}>{day.getDate()}</Text>
              </Pressable>
              <ScrollView>
                {dayItems.map((item) => {
                  const isVisit = item.kind === 'visit';
                  const title = isVisit ? item.data.client_name : item.data.title;
                  return (
                    <Pressable
                      key={`${item.kind}-${item.data.id}`}
                      onPress={() => onPressItem(item)}
                      style={[
                        styles.chip,
                        { backgroundColor: isVisit ? colors.aquaMist : '#FFE8E0' },
                      ]}
                    >
                      <Text style={styles.chipTime}>{formatTime(item.data.starts_at)}</Text>
                      <Text style={styles.chipTitle} numberOfLines={2}>
                        {title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 16, paddingBottom: 120 },
  dayBlock: { marginBottom: 18 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dayName: { fontSize: 16, fontWeight: '800', color: colors.ink, textTransform: 'capitalize' },
  todayText: { color: colors.sky },
  todayPill: {
    backgroundColor: colors.aqua,
    color: colors.navy,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  empty: { color: colors.muted, fontSize: 13, marginLeft: 4 },
  rowItem: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  rowTime: { width: 48, fontWeight: '800', color: colors.navySoft },
  rowTitle: { fontWeight: '700', color: colors.ink },
  rowKind: { fontSize: 12, color: colors.muted },
  gridPad: { padding: 12, paddingBottom: 120 },
  grid: { flexDirection: 'row', gap: 8, minWidth: 900 },
  col: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 8,
    minHeight: 420,
    borderWidth: 1,
    borderColor: colors.line,
  },
  colToday: { borderColor: colors.aqua, backgroundColor: '#F3FCFC' },
  colHead: { alignItems: 'center', marginBottom: 8 },
  colDow: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  colNum: { fontSize: 20, fontWeight: '800', color: colors.ink },
  todayNum: { color: colors.sky },
  chip: { borderRadius: 8, padding: 8, marginBottom: 6 },
  chipTime: { fontSize: 10, fontWeight: '800', color: colors.navySoft },
  chipTitle: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
