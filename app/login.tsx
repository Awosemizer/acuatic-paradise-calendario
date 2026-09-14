import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { colors, radius, shadow } from '@/src/theme';
import {
  FlamingoFloat,
  PasswordInput,
  TropicalBackground,
  WoodLogo,
} from '@/src/components/ui';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slide = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2800, useNativeDriver: true }),
      ]),
    ).start();
  }, [slide, opacity, pulse]);

  if (session) return <Redirect href="/(app)/(tabs)" />;

  async function onSubmit() {
    setError(null);
    if (!username.trim() || !password) {
      setError('Escribe usuario y contraseña.');
      return;
    }
    setBusy(true);
    const result = await signIn(username, password);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <TropicalBackground overlay="none">
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulse }], opacity: 0.35 }]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(94,232,236,0.25)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.scriptTop}>Más que eventos, son buenos momentos ♡</Text>

          <WoodLogo size="lg" style={styles.logo} />

          <Animated.View style={{ opacity, transform: [{ translateY: slide }] }}>
            <View style={[styles.card, shadow.card]}>
              <View style={styles.cardIcon}>
                <Ionicons name="calendar" size={28} color={colors.teal} />
              </View>
              <Text style={styles.welcome}>Bienvenido 🌴</Text>
              <Text style={styles.subtitle}>Calendario compartido del equipo</Text>

              {!isSupabaseConfigured && (
                <View style={styles.warn}>
                  <Text style={styles.warnTitle}>Falta configurar Supabase</Text>
                  <Text style={styles.warnText}>
                    Crea un archivo .env con EXPO_PUBLIC_SUPABASE_URL y
                    EXPO_PUBLIC_SUPABASE_ANON_KEY. Consulta el README.
                  </Text>
                </View>
              )}

              <Text style={styles.label}>
                <Ionicons name="person-outline" size={14} color={colors.navySoft} /> Usuario
              </Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.teal} style={{ marginRight: 8 }} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Usuario"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.navySoft} /> Contraseña
              </Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                onSubmitEditing={onSubmit}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={busy || !isSupabaseConfigured}
                style={({ pressed }) => [
                  styles.btnWrap,
                  (busy || !isSupabaseConfigured) && { opacity: 0.6 },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <LinearGradient
                  colors={[colors.teal, colors.tealDeep, colors.sky]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btn}
                >
                  <View style={styles.btnArrow}>
                    <Ionicons name="arrow-forward" size={18} color={colors.tealDeep} />
                  </View>
                  <Text style={styles.btnText}>{busy ? 'Entrando…' : 'Entrar'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          <View style={styles.pillRow}>
            {[
              { icon: 'calendar-outline' as const, label: 'Organiza' },
              { icon: 'people-outline' as const, label: 'Coordina' },
              { icon: 'star-outline' as const, label: 'Haz que suceda' },
            ].map((p) => (
              <View key={p.label} style={styles.pill}>
                <View style={styles.pillCircle}>
                  <Ionicons name={p.icon} size={18} color={colors.white} />
                </View>
                <Text style={styles.pillLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.scriptBottom}>Eventos hoy, mejores recuerdos mañana ♡</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <FlamingoFloat size={130} style={styles.flamingo} />
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  scriptTop: {
    color: colors.white,
    fontStyle: 'italic',
    fontSize: 13,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
    marginBottom: 8,
  },
  logo: { alignSelf: 'center', marginBottom: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.aquaMist,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
  },
  label: {
    fontWeight: '700',
    color: colors.navySoft,
    marginBottom: 6,
    marginTop: 10,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  error: { color: colors.danger, marginTop: 12, fontWeight: '600' },
  btnWrap: { marginTop: 18, borderRadius: radius.pill, overflow: 'hidden' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  btnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 17 },
  warn: {
    backgroundColor: '#FFF3D6',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 8,
  },
  warnTitle: { fontWeight: '800', color: '#9A6700', marginBottom: 4 },
  warnText: { color: '#7A5A00', fontSize: 13, lineHeight: 18 },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 22,
    marginBottom: 12,
  },
  pill: { alignItems: 'center', gap: 6, maxWidth: 100 },
  pillCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(11,31,58,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 3,
  },
  scriptBottom: {
    color: colors.white,
    fontStyle: 'italic',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
  },
  flamingo: { left: -10, bottom: 40, zIndex: 2 },
});
