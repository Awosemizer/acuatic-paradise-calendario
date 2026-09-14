import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRange } from '@/src/lib/dates';
import { colors, radius } from '@/src/theme';
import type { CalendarItem } from '@/src/types';
import { StatusBadge } from './StatusBadge';

type Props = {
  item: CalendarItem;
  compact?: boolean;
  onPress?: () => void;
};

export function CalendarItemCard({ item, compact, onPress }: Props) {
  const isVisit = item.kind === 'visit';
  const title = isVisit ? item.data.client_name : item.data.title;
  const subtitle = isVisit ? item.data.service_type : 'Evento interno';
  const range = formatRange(item.data.starts_at, item.data.duration_minutes);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isVisit ? styles.visit : styles.event,
        compact && styles.compact,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: isVisit ? colors.aqua : colors.coral }]} />
      <View style={styles.body}>
        <Text style={styles.time} numberOfLines={1}>
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
    </Pressable>
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
  },
  visit: {
    backgroundColor: colors.white,
  },
  event: {
    backgroundColor: '#FFF8F5',
  },
  compact: {
    marginBottom: 4,
  },
  stripe: {
    width: 5,
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  time: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.sky,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
});
