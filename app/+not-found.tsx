import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado', headerShown: true }} />
      <View style={styles.wrap}>
        <Text style={styles.title}>Pantalla no encontrada</Text>
        <Link href="/" style={styles.link}>
          Volver al calendario
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.offWhite },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  link: { color: colors.sky, fontWeight: '700' },
});
