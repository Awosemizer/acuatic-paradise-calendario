import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeTop } from '@/src/hooks/useSafeTop';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/src/components/Avatar';
import { useAuth } from '@/src/context/AuthContext';
import { emailToUsername } from '@/src/lib/authUsername';
import { colors, radius, shadow } from '@/src/theme';
import { FancyTitle, GlassCard, ScreenFocusFade, TropicalBackground, WoodLogo } from '@/src/components/ui';
import { UpdatesSection } from '@/src/components/UpdatesSection';

export default function MasScreen() {
  const router = useRouter();
  const safeTop = useSafeTop(8);
  const { profile, user, signOut } = useAuth();

  const username = profile?.username || emailToUsername(user?.email) || null;
  const displayName = profile?.full_name || username || 'Personal del salón';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <TropicalBackground>
      <ScreenFocusFade>
        <ScrollView
          contentContainerStyle={[
            styles.pad,
            { paddingTop: safeTop, paddingBottom: 120 },
          ]}
        >
          <WoodLogo size="md" style={{ alignSelf: 'center', marginBottom: 8 }} />
          <FancyTitle size={30} tilt={-5} style={styles.pageTitle}>
            Más
          </FancyTitle>

          <GlassCard strong padding={20} style={styles.profile}>
            <Avatar name={displayName} uri={profile?.avatar_url} size={72} />
            <Text style={styles.name}>{displayName}</Text>
            {username ? <Text style={styles.username}>@{username}</Text> : null}
            <Text style={styles.role}>Rol · {profile?.role ?? 'staff'}</Text>
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </GlassCard>

          <GlassCard padding={18} style={{ marginTop: 12 }}>
            <Text style={styles.aboutTitle}>Acerca de Aquatic Paradise</Text>
            <Text style={styles.aboutBody}>
              Salón de eventos en Pachuca. Este calendario ayuda al equipo a coordinar visitas de
              clientes y eventos internos en un solo lugar, con sincronización en tiempo real.
            </Text>
          </GlassCard>

          <Pressable
            onPress={() => router.push('/(app)/perfil')}
            style={[styles.rowBtn, shadow.card]}
          >
            <Ionicons name="create-outline" size={22} color={colors.tealDeep} />
            <Text style={styles.rowText}>Editar perfil</Text>
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
          <Text style={styles.signature}>Creado por Awosemizer</Text>
        </ScrollView>
      </ScreenFocusFade>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  pageTitle: { alignSelf: 'center', marginBottom: 14 },
  profile: { alignItems: 'center', gap: 4 },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 8 },
  username: { color: colors.muted, marginTop: 2 },
  role: { color: colors.tealDeep, fontWeight: '700', marginTop: 6, textTransform: 'capitalize' },
  bio: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 14 },
  aboutTitle: { fontWeight: '800', fontSize: 16, color: colors.navy, marginBottom: 8 },
  aboutBody: { color: colors.muted, lineHeight: 20, fontSize: 14 },
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
  signature: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
