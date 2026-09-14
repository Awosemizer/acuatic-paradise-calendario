import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme';

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/(app)" />;

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Escribe correo y contraseña.');
      return;
    }
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>SALÓN · PACHUCA</Text>
          <Text style={styles.brand}>Acuatic Paradise</Text>
          <Text style={styles.tag}>Calendario compartido del equipo</Text>
        </View>

        <View style={styles.card}>
          {!isSupabaseConfigured && (
            <View style={styles.warn}>
              <Text style={styles.warnTitle}>Falta configurar Supabase</Text>
              <Text style={styles.warnText}>
                Crea un archivo .env con EXPO_PUBLIC_SUPABASE_URL y
                EXPO_PUBLIC_SUPABASE_ANON_KEY. Consulta el README.
              </Text>
            </View>
          )}

          <Text style={styles.heading}>Iniciar sesión</Text>
          <Text style={styles.hint}>Usa la cuenta del personal del salón.</Text>

          <Text style={styles.label}>Correo</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ana@acuaticparadise.mx"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            style={styles.input}
            onSubmitEditing={onSubmit}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={busy || !isSupabaseConfigured}
            style={({ pressed }) => [
              styles.btn,
              (busy || !isSupabaseConfigured) && { opacity: 0.6 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.btnText}>{busy ? 'Entrando…' : 'Entrar'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  flex: { flex: 1, justifyContent: 'center', padding: 20 },
  hero: { marginBottom: 24, paddingHorizontal: 4 },
  kicker: {
    color: colors.aqua,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontSize: 12,
  },
  brand: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 6 },
  tag: { color: colors.skyLight, fontSize: 15, marginTop: 6 },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 24,
    padding: 22,
  },
  heading: { fontSize: 20, fontWeight: '800', color: colors.ink },
  hint: { color: colors.muted, marginBottom: 16, marginTop: 4 },
  label: { fontWeight: '700', color: colors.navySoft, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.danger, marginTop: 12, fontWeight: '600' },
  btn: {
    marginTop: 18,
    backgroundColor: colors.aqua,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  warn: {
    backgroundColor: '#FFF3D6',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  warnTitle: { fontWeight: '800', color: '#9A6700', marginBottom: 4 },
  warnText: { color: '#7A5A00', fontSize: 13, lineHeight: 18 },
});
