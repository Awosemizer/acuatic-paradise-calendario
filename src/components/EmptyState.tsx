import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🌊</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emoji: { fontSize: 28 },
  text: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
});
