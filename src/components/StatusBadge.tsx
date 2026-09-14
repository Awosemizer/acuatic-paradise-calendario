import { StyleSheet, Text, View } from 'react-native';
import { statusColors } from '@/src/theme';
import type { VisitStatus } from '@/src/types';

export function StatusBadge({ status }: { status: VisitStatus }) {
  const meta = statusColors[status] ?? statusColors.programada;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.label, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
