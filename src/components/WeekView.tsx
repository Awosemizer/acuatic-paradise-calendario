import { parseISO } from 'date-fns';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, isSameDay, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';

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
            <View key={day.toISOString()} style={styles.dayCard}>
              <Pressable onPress={() => onPressDay(day)} style={styles.dayHead}>
                <Text style={[styles.dayName, today && styles.todayText]}>
                  {day.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                </Text>
                {today && (
                  <View style={styles.todayPill}>
                    <Text style={styles.todayPillText}>Hoy</Text>
                  </View>
                )}
              </Pressable>
              {dayItems.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>Sin citas</Text>
                  <Text style={styles.emptyHint}>Un día para planear nuevas experiencias</Text>
                </View>
              ) : (
                dayItems.map((item) => {
                  const isVisit = item.kind === 'visit';
                  const title = isVisit ? item.data.client_name : item.data.title;
                  const kind = isVisit
                    ? item.data.service_type || 'Visita'
                    : 'Evento interno';
                  return (
                    <Pressable
                      key={`${item.kind}-${item.data.id}`}
                      onPress={() => onPressItem(item)}
                      style={[
                        styles.rowItem,
                        { borderLeftColor: isVisit ? colors.visit : colors.event },
                      ]}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: isVisit ? colors.aquaMist : colors.coralMist },
                        ]}
                      >
                        <Ionicons
                          name={isVisit ? 'people' : 'construct'}
                          size={16}
                          color={isVisit ? colors.tealDeep : colors.coral}
                        />
                      </View>
                      <Text style={styles.rowTime}>{formatTime(item.data.starts_at)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.rowKind}>{kind}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
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
                        { backgroundColor: isVisit ? colors.aquaMist : colors.coralMist },
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
  listPad: { padding: 12, paddingBottom: 120 },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dayName: { fontSize: 16, fontWeight: '800', color: colors.ink, textTransform: 'capitalize' },
  todayText: { color: colors.tealDeep },
  todayPill: {
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayPillText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  emptyBox: {
    backgroundColor: colors.skyMist,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  emptyTitle: { fontWeight: '800', color: colors.navySoft },
  emptyHint: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  rowItem: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTime: { width: 42, fontWeight: '800', color: colors.navySoft, fontSize: 13 },
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
  todayNum: { color: colors.tealDeep },
  chip: { borderRadius: 8, padding: 8, marginBottom: 6 },
  chipTime: { fontSize: 10, fontWeight: '800', color: colors.navySoft },
  chipTitle: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
