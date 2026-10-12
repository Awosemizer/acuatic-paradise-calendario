import { PressableScale } from '@/src/components/ui/PressableScale';
import { parseISO } from 'date-fns';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, isSameDay, weekDays } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { calendarItemKey } from './CalendarItemCard';
import { layoutOverlaps } from '@/src/lib/overlap';
import { DAY_END_HOUR, DAY_START_HOUR } from '@/src/lib/constants';
import { useIsTablet } from '@/src/hooks/useLayoutMode';

type Props = {
  cursor: Date;
  items: CalendarItem[];
  onPressItem: (item: CalendarItem) => void;
  onPressDay: (day: Date) => void;
  selectMode?: boolean;
  selectedKeys?: Set<string>;
  onToggleItem?: (item: CalendarItem) => void;
  onLongPressItem?: (item: CalendarItem) => void;
};

export function WeekView({
  cursor,
  items,
  onPressItem,
  onPressDay,
  selectMode,
  selectedKeys,
  onToggleItem,
  onLongPressItem,
}: Props) {
  function handleItemPress(item: CalendarItem) {
    if (selectMode) onToggleItem?.(item);
    else onPressItem(item);
  }
  const days = weekDays(cursor);
  const compact = !useIsTablet();

  if (compact) {
    return (
      <ScrollView contentContainerStyle={styles.listPad}>
        {days.map((day) => {
          const dayItems = items.filter((item) => isSameDay(parseISO(item.data.starts_at), day));
          const today = isSameDay(day, new Date());
          return (
            <View key={day.toISOString()} style={styles.dayCard}>
              <PressableScale onPress={() => onPressDay(day)} style={styles.dayHead}>
                <Text style={[styles.dayName, today && styles.todayText]}>
                  {day.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}
                </Text>
                {today && (
                  <View style={styles.todayPill}>
                    <Text style={styles.todayPillText}>Hoy</Text>
                  </View>
                )}
              </PressableScale>
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
                    <PressableScale
                      key={`${item.kind}-${item.data.id}`}
                      onPress={() => handleItemPress(item)}
                      onLongPress={() => onLongPressItem?.(item)}
                      delayLongPress={350}
                      style={[
                        styles.rowItem,
                        { borderLeftColor: isVisit ? colors.visit : colors.event },
                        selectedKeys?.has(calendarItemKey(item)) && styles.rowSelected,
                      ]}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: isVisit ? colors.aquaMist : colors.eventMist },
                        ]}
                      >
                        <Ionicons
                          name={isVisit ? 'people' : 'construct'}
                          size={16}
                          color={isVisit ? colors.tealDeep : colors.eventDeep}
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
                    </PressableScale>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // Tablet / wide: 7-column time grid using the full width (Google Calendar style).
  const placedByDay = days.map((day) =>
    layoutOverlaps(items.filter((item) => isSameDay(parseISO(item.data.starts_at), day))),
  );
  let startHour = DAY_START_HOUR;
  let endHour = DAY_END_HOUR;
  placedByDay.flat().forEach(({ start, end }) => {
    const s0 = new Date(start);
    const e0 = new Date(end);
    startHour = Math.min(startHour, s0.getHours());
    endHour = Math.max(endHour, e0.getDate() !== s0.getDate() ? 24 : e0.getHours() + (e0.getMinutes() ? 1 : 0));
  });
  endHour = Math.min(endHour, 24);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const H = WEEK_HOUR_HEIGHT;
  const topOf = (t: number) => {
    const d = new Date(t);
    return GRID_PAD + ((d.getHours() - startHour) * 60 + d.getMinutes()) / 60 * H;
  };
  const now = new Date();

  return (
    <View style={styles.gridWrap}>
      <View style={styles.gridHead}>
        <View style={{ width: HOUR_COL }} />
        {days.map((day) => {
          const today = isSameDay(day, now);
          const count = placedByDay[days.indexOf(day)].length;
          return (
            <PressableScale key={day.toISOString()} onPress={() => onPressDay(day)} style={[styles.headCell, today && styles.headToday]}>
              <Text style={[styles.colDow, today && styles.todayNum]} numberOfLines={1}>
                {day.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}
              </Text>
              <Text style={[styles.colNum, today && styles.todayNum]}>{day.getDate()}</Text>
              <Text style={styles.headCount} numberOfLines={1}>{count ? `${count} cita${count > 1 ? 's' : ''}` : ' '}</Text>
            </PressableScale>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: hours.length * H + GRID_PAD * 2, flexDirection: 'row' }}>
          <View style={{ width: HOUR_COL }}>
            {hours.map((h, i) => (
              <Text key={h} style={[styles.hourLabel, { top: GRID_PAD + i * H - 7 }]} numberOfLines={1}>
                {`${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'a.m.' : 'p.m.'}`}
              </Text>
            ))}
          </View>
          {days.map((day, di) => {
            const today = isSameDay(day, now);
            return (
              <View key={day.toISOString()} style={[styles.gridCol, today && styles.gridColToday]}>
                {hours.map((h, i) => (
                  <View key={h} style={[styles.gridLine, { top: GRID_PAD + i * H }]} />
                ))}
                {today && now.getHours() >= startHour && now.getHours() < endHour ? (
                  <View style={[styles.nowLine, { top: topOf(now.getTime()) }]} />
                ) : null}
                {placedByDay[di].map(({ item, col, cols, start, end }) => {
                  const isVisit = item.kind === 'visit';
                  const title = isVisit ? item.data.client_name : item.data.title;
                  const top = topOf(start);
                  const height = Math.max(topOf(end) - top - 2, 22);
                  const sel = !!selectedKeys?.has(calendarItemKey(item));
                  return (
                    <PressableScale
                      key={`${item.kind}-${item.data.id}`}
                      onPress={() => handleItemPress(item)}
                      onLongPress={() => onLongPressItem?.(item)}
                      delayLongPress={350}
                      style={[
                        styles.gBlock,
                        {
                          top,
                          height,
                          left: `${(col / cols) * 100}%`,
                          width: `${100 / cols}%`,
                          backgroundColor: isVisit ? colors.aquaMist : colors.eventMist,
                          borderLeftColor: isVisit ? colors.visit : colors.event,
                        },
                        sel && styles.gBlockSel,
                      ]}
                    >
                      {height >= 34 && cols < 3 ? (
                        <Text style={styles.chipTime} numberOfLines={1}>{formatTime(item.data.starts_at)}</Text>
                      ) : null}
                      <Text style={styles.chipTitle} numberOfLines={Math.max(1, Math.floor((height - 18) / 15))}>
                        {title}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const HOUR_COL = 52;
const GRID_PAD = 10;
const WEEK_HOUR_HEIGHT = 56;

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
  rowSelected: { backgroundColor: 'rgba(20,196,200,0.16)' },
  gridWrap: { flex: 1, paddingHorizontal: 8 },
  gridHead: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  headCell: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: radius.md, marginHorizontal: 2 },
  headToday: { backgroundColor: colors.aquaMist },
  headCount: { fontSize: 10, color: colors.muted, fontWeight: '700' },
  hourLabel: { position: 'absolute', left: 0, width: HOUR_COL - 6, textAlign: 'right', fontSize: 10, fontWeight: '700', color: colors.muted },
  gridCol: { flex: 1, position: 'relative', borderLeftWidth: 1, borderLeftColor: colors.line, paddingHorizontal: 2 },
  gridColToday: { backgroundColor: 'rgba(20,196,200,0.06)' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.line },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.coral, zIndex: 3 },
  gBlock: { position: 'absolute', borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 2, overflow: 'hidden', borderRightWidth: 1, borderRightColor: colors.white, zIndex: 2 },
  gBlockSel: { borderWidth: 2, borderColor: colors.teal },
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
