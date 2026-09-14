import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/src/components/Avatar';
import { Field } from '@/src/components/FormFields';
import { KeyboardScreen } from '@/src/components/KeyboardScreen';
import { useAuth } from '@/src/context/AuthContext';
import { emailToUsername } from '@/src/lib/authUsername';
import { supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const { profile, user, updateProfile, refreshProfile } = useAuth();

  const username = profile?.username || emailToUsername(user?.email) || null;
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [role, setRole] = useState(profile?.role ?? 'staff');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setRole(profile?.role ?? 'staff');
    setBio(profile?.bio ?? '');
    setAvatarUri(profile?.avatar_url ?? null);
  }, [profile?.full_name, profile?.role, profile?.bio, profile?.avatar_url]);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso', 'Necesitamos acceso a tus fotos para cambiar el avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setLocalPhoto(result.assets[0].uri);
  }

  async function uploadAvatar(localUri: string, userId: string): Promise<string | null> {
    const extGuess = localUri.split('.').pop()?.toLowerCase()?.split('?')[0] || 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extGuess) ? extGuess : 'jpg';
    const contentType =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : ext === 'gif'
            ? 'image/gif'
            : 'image/jpeg';
    const path = `${userId}/avatar-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      throw new Error(
        upErr.message.includes('Bucket not found') || upErr.message.includes('not found')
          ? 'Bucket avatars no existe. Aplica la migración de storage o créalo en Supabase.'
          : upErr.message,
      );
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSave() {
    if (!user?.id || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      let nextAvatar = avatarUri;
      if (localPhoto) {
        nextAvatar = await uploadAvatar(localPhoto, user.id);
        setAvatarUri(nextAvatar);
        setLocalPhoto(null);
      }

      const result = await updateProfile({
        full_name: fullName.trim(),
        role: role.trim() || 'staff',
        bio: bio.trim() || null,
        avatar_url: nextAvatar,
      });

      if (result.error && result.error.startsWith('Perfil parcial')) {
        setMessage(result.error);
      } else if (result.error) {
        setMessage(result.error);
      } else {
        setMessage('Perfil actualizado.');
        await refreshProfile();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  const preview = localPhoto || avatarUri;
  const displayName = fullName.trim() || username || 'Personal';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Editar perfil</Text>
      </View>

      <KeyboardScreen contentContainerStyle={{ paddingBottom: 24 }} bottomPadding={120} extraScrollHeight={120}>
        <View style={styles.card}>
          <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
            <Avatar name={displayName} uri={preview} size={96} />
            <View style={styles.camBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </Pressable>
          <Text style={styles.hint}>Toca la foto para cambiarla</Text>
          {username ? <Text style={styles.username}>@{username}</Text> : null}
        </View>

        <Field
          label="Nombre (opcional)"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Tu nombre"
          autoCapitalize="words"
        />
        <Field
          label="Rol"
          value={role}
          onChangeText={setRole}
          placeholder="staff, recepción, gerente…"
          autoCapitalize="sentences"
        />
        <Field
          label="Descripción corta"
          value={bio}
          onChangeText={setBio}
          placeholder="Una línea sobre ti en el equipo"
          multiline
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable onPress={onSave} style={styles.save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Guardar</Text>
          )}
        </Pressable>
      </KeyboardScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite, padding: 20 },
  head: { marginBottom: 16 },
  back: { color: colors.sky, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: { position: 'relative' },
  camBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  hint: { color: colors.muted, marginTop: 10, fontSize: 13 },
  username: { color: colors.muted, marginTop: 4 },
  message: { color: colors.tealDeep, marginTop: 8, marginBottom: 4, fontSize: 13 },
  save: {
    marginTop: 18,
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 16 },
});
