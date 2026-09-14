import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { emailToUsername } from '@/src/lib/authUsername';
import { colors, radius, shadow } from '@/src/theme';
import { GlassCard, TropicalBackground, WoodLogo } from '@/src/components/ui';

export default function MasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();

  const username = profile?.username || emailToUsername(user?.email) || null;
  const displayName = profile?.full_name || username || 'Personal del salón';
  const initial = displayName.charAt(0).toUpperCase();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <TropicalBackground>
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingTop: insets.top + 8, paddingBottom: 120 },
        ]}
      >
        <WoodLogo size="md" style={{ alignSelf: 'center', marginBottom: 12 }} />

        <GlassCard strong padding={20} style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {username ? <Text style={styles.username}>@{username}</Text> : null}
          <Text style={styles.role}>Rol · {profile?.role ?? 'staff'}</Text>
        </GlassCard>

        <GlassCard padding={18} style={{ marginTop: 12 }}>
          <Text style={styles.aboutTitle}>Acerca de Acuatic Paradise</Text>
          <Text style={styles.aboutBody}>
            Salón de eventos en Pachuca. Este calendario ayuda al equipo a coordinar visitas de
            clientes y eventos internos en un solo lugar, con sincronización en tiempo real.
          </Text>
          <Text style={styles.tagline}>Más que eventos, son buenos momentos ♡</Text>
        </GlassCard>

        <Pressable
          onPress={() => router.push('/(app)/perfil')}
          style={[styles.rowBtn, shadow.card]}
        >
          <Ionicons name="person-circle-outline" size={22} color={colors.tealDeep} />
          <Text style={styles.rowText}>Ver perfil</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
          style={[styles.logout, shadow.card]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.white} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>

        <Text style={styles.version}>Versión {version}</Text>
      </ScrollView>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  profile: { alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.white },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  username: { color: colors.muted, marginTop: 2 },
  role: { color: colors.tealDeep, fontWeight: '700', marginTop: 6, textTransform: 'capitalize' },
  aboutTitle: { fontWeight: '800', fontSize: 16, color: colors.navy, marginBottom: 8 },
  aboutBody: { color: colors.muted, lineHeight: 20, fontSize: 14 },
  tagline: {
    marginTop: 12,
    fontStyle: 'italic',
    color: colors.navySoft,
    fontSize: 13,
  },
  rowBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 16,
  },
  rowText: { flex: 1, fontWeight: '700', color: colors.ink, fontSize: 15 },
  logout: {
    marginTop: 16,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 20,
    fontSize: 12,
  },
});
