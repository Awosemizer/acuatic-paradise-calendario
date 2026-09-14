import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import { TropicalBackground, WoodLogo } from '@/src/components/ui';

export function LoadingScreen({ label = 'Cargando…' }: { label?: string }) {
  return (
    <TropicalBackground overlay="dark">
      <View style={styles.wrap}>
        <WoodLogo size="md" />
        <ActivityIndicator color={colors.aquaLight} size="large" style={{ marginTop: 20 }} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: { color: colors.skyMist, fontSize: 14 },
});
