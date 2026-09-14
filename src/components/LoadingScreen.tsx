import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function LoadingScreen({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Acuatic Paradise</Text>
      <ActivityIndicator color={colors.aqua} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    color: colors.aquaLight,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  label: { color: colors.skyMist, fontSize: 14 },
});
