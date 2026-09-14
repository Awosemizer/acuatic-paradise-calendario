import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { colors, radius } from '@/src/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Equipo</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || user?.email || 'E').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'Personal del salón'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Calendario compartido · {profile?.role ?? 'staff'}</Text>
      </View>

      <Text style={styles.note}>
        Las tres personas del equipo ven y editan las mismas visitas y eventos. Los cambios se
        sincronizan en tiempo real.
      </Text>

      <Pressable
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
        style={styles.out}
      >
        <Text style={styles.outText}>Cerrar sesión</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite, padding: 20 },
  head: { marginBottom: 20 },
  back: { color: colors.sky, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.navy },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  email: { color: colors.muted },
  role: { color: colors.sky, fontWeight: '700', marginTop: 4 },
  note: { color: colors.muted, marginTop: 18, lineHeight: 20 },
  out: {
    marginTop: 28,
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outText: { color: colors.white, fontWeight: '800' },
});
