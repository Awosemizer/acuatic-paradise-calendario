import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { colors, radius, shadow } from '@/src/theme';
import { GlassCard, TropicalBackground, WoodLogo } from '@/src/components/ui';
import type { Profile } from '@/src/types';

export default function EquipoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (err) setError(err.message);
    else setStaff((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <TropicalBackground>
      <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
        <WoodLogo size="sm" />
        <Text style={styles.title}>Equipo</Text>
        <Text style={styles.sub}>Personal del salón · Acuatic Paradise</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.white} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.white} />}
          ListEmptyComponent={
            <GlassCard padding={20}>
              <Text style={styles.empty}>
                {error ?? 'Aún no hay perfiles visibles.'}
              </Text>
            </GlassCard>
          }
          renderItem={({ item }) => {
            const isMe = item.id === user?.id;
            const initial = (item.full_name || item.username || '?').charAt(0).toUpperCase();
            return (
              <View style={[styles.card, shadow.card]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                  {isMe ? <View style={styles.onlineDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {item.full_name || 'Sin nombre'}
                    {isMe ? ' (tú)' : ''}
                  </Text>
                  {item.username ? (
                    <Text style={styles.username}>@{item.username}</Text>
                  ) : null}
                  <Text style={styles.role}>{item.role || 'staff'}</Text>
                </View>
                <Ionicons
                  name={isMe ? 'radio-button-on' : 'person-circle-outline'}
                  size={22}
                  color={isMe ? colors.success : colors.muted}
                />
              </View>
            );
          }}
        />
      )}
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16, marginBottom: 4 },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 3,
  },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  username: { color: colors.muted, marginTop: 1 },
  role: { color: colors.tealDeep, fontWeight: '700', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  empty: { color: colors.muted, textAlign: 'center' },
});
