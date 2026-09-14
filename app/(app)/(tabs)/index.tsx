import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { useAuth } from '@/src/context/AuthContext';
import { useCalendarData } from '@/src/hooks/useCalendarData';
import { formatChipDate, formatDayHeading, isSameDay } from '@/src/lib/dates';
import { colors, radius, shadow } from '@/src/theme';
import {
  FlamingoFloat,
  GlassCard,
  TropicalBackground,
  WoodLogo,
} from '@/src/components/ui';
import { CalendarItemCard } from '@/src/components/CalendarItemCard';
import type { CalendarItem } from '@/src/types';

export default function InicioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const today = useMemo(() => new Date(), []);
  const { items, loading } = useCalendarData(today, 'week');

  const todayItems = items.filter((i) => isSameDay(parseISO(i.data.starts_at), today));
  const upcoming = items
    .filter((i) => parseISO(i.data.starts_at).getTime() >= today.getTime())
    .slice(0, 6);

  const name = profile?.full_name?.split(' ')[0] || profile?.username || 'equipo';

  function openItem(item: CalendarItem) {
    if (item.kind === 'visit') router.push(`/(app)/visita/${item.data.id}`);
    else router.push(`/(app)/evento/${item.data.id}`);
  }

  return (
    <TropicalBackground>
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingTop: insets.top + 8, paddingBottom: 120 },
        ]}
      >
        <View style={styles.topRow}>
          <WoodLogo size="sm" />
          <Text style={styles.script}>Buenas experiencias todo el año ♡</Text>
        </View>

        <GlassCard strong style={styles.hero} padding={18}>
          <Text style={styles.hello}>Hola, {name} 👋</Text>
          <Text style={styles.heroTitle}>Resumen de hoy</Text>
          <Text style={styles.heroDate}>{formatDayHeading(today)}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {todayItems.filter((i) => i.kind === 'visit').length}
              </Text>
              <Text style={styles.statLabel}>Visitas</Text>
            </View>
            <View style={[styles.stat, styles.statEvent]}>
              <Text style={[styles.statNum, { color: colors.coral }]}>
                {todayItems.filter((i) => i.kind === 'event').length}
              </Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.section}>Acciones rápidas</Text>
        <View style={styles.actions}>
          <Pressable
            style={[styles.action, { backgroundColor: colors.teal }]}
            onPress={() => router.push('/(app)/visita/nueva')}
          >
            <Ionicons name="person-add" size={20} color={colors.white} />
            <Text style={styles.actionText}>Nueva visita</Text>
          </Pressable>
          <Pressable
            style={[styles.action, { backgroundColor: colors.coral }]}
            onPress={() => router.push('/(app)/evento/nuevo')}
          >
            <Ionicons name="sparkles" size={20} color={colors.white} />
            <Text style={styles.actionText}>Nuevo evento</Text>
          </Pressable>
          <Pressable
            style={[styles.action, { backgroundColor: colors.navy }]}
            onPress={() => router.push('/(app)/(tabs)/calendario')}
          >
            <Ionicons name="calendar" size={20} color={colors.white} />
            <Text style={styles.actionText}>Ver calendario</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Próximos en la agenda</Text>
        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: 20 }} />
        ) : upcoming.length === 0 ? (
          <GlassCard padding={20}>
            <Text style={styles.empty}>Sin citas próximas. ¡Buen momento para planear!</Text>
          </GlassCard>
        ) : (
          upcoming.map((item) => (
            <View key={`${item.kind}-${item.data.id}`} style={shadow.card}>
              <CalendarItemCard item={item} onPress={() => openItem(item)} />
              <Text style={styles.when}>{formatChipDate(item.data.starts_at)}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <FlamingoFloat size={90} style={styles.flam} />
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  script: {
    flex: 1,
    marginLeft: 8,
    color: colors.white,
    fontStyle: 'italic',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 3,
  },
  hero: { marginBottom: 16 },
  hello: { color: colors.muted, fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.navy, marginTop: 4 },
  heroDate: { color: colors.navySoft, textTransform: 'capitalize', marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: colors.aquaMist,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  statEvent: { backgroundColor: colors.coralMist },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.tealDeep },
  statLabel: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  section: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 10,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 3,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  actionText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center' },
  when: { color: colors.white, fontSize: 11, marginTop: -4, marginBottom: 10, marginLeft: 4 },
  flam: { right: 8, bottom: 100 },
});
