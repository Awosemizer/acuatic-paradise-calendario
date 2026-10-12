import { PressableScale } from '@/src/components/ui/PressableScale';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRange } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { StatusBadge } from './StatusBadge';

export function calendarItemKey(item: CalendarItem) {
  return `${item.kind}-${item.data.id}`;
}

type Props = {
  item: CalendarItem;
  compact?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  selectMode?: boolean;
  selected?: boolean;
};

export function CalendarItemCard({
  item,
  compact,
  onPress,
  onLongPress,
  selectMode,
  selected,
}: Props) {
  const isVisit = item.kind === 'visit';
  const title = isVisit ? item.data.client_name : item.data.title;
  const subtitle = isVisit ? item.data.service_type : 'Evento interno';
  const range = formatRange(item.data.starts_at, item.data.duration_minutes);

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.card,
        isVisit ? styles.visit : styles.event,
        compact && styles.compact,
        selected && styles.selected,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: isVisit ? colors.visit : colors.event }]} />
      {selectMode ? (
        <View style={[styles.checkbox, selected && styles.checkboxOn]}>
          {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
        </View>
      ) : (
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isVisit ? colors.aquaMist : colors.eventMist },
          ]}
        >
          <Ionicons
            name={isVisit ? 'people' : 'calendar'}
            size={16}
            color={isVisit ? colors.tealDeep : colors.eventDeep}
          />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.time, !isVisit && { color: colors.eventDeep }]} numberOfLines={1}>
          {range}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!compact && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {isVisit && !compact && <StatusBadge status={item.data.status} />}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  visit: { backgroundColor: colors.white },
  event: { backgroundColor: '#FFF8F5' },
  compact: { marginBottom: 4 },
  selected: {
    borderColor: colors.teal,
    backgroundColor: 'rgba(20,196,200,0.14)',
  },
  stripe: { width: 5, alignSelf: 'stretch' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.tealDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  body: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  time: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tealDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: 4 },
});
