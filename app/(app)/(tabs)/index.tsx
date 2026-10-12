import { PressableScale } from '@/src/components/ui/PressableScale';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { bitacoraStatus } from '@/src/hooks/useBitacora';
import type { BitacoraItem } from '@/src/types';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeTop } from '@/src/hooks/useSafeTop';
import { useLayout } from '@/src/hooks/useLayoutMode';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { useAuth } from '@/src/context/AuthContext';
import { useCalendarData } from '@/src/hooks/useCalendarData';
import { formatChipDate, formatDayHeading, isSameDay } from '@/src/lib/dates';
import { colors, fonts, radius, shadow } from '@/src/theme';
import { FancyTitle, GlassCard, ScreenFocusFade, TropicalBackground, WoodLogo } from '@/src/components/ui';
import { CalendarItemCard } from '@/src/components/CalendarItemCard';
import type { CalendarItem } from '@/src/types';

export default function InicioScreen() {
  const router = useRouter();
  const safeTop = useSafeTop(8);
  const { profile } = useAuth();
  const today = useMemo(() => new Date(), []);
  const { items, loading, refresh } = useCalendarData(today, 'week');
  const { user } = useAuth();
  const [extra, setExtra] = useState<{ tasks: number; overdueTasks: number; bitVencidos: number; bitPronto: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadExtra = useCallback(async () => {
    const [t, b] = await Promise.all([
      supabase.from('tasks').select('id,done,due_at,is_personal,created_by').eq('done', false),
      supabase.from('bitacora_items').select('*').eq('active', true),
    ]);
    const tasks = ((t.data as { due_at: string | null; is_personal: boolean; created_by: string | null }[]) ?? []).filter(
      (x) => !x.is_personal || x.created_by === user?.id,
    );
    const now = Date.now();
    const bits = (b.data as BitacoraItem[]) ?? [];
    setExtra({
      tasks: tasks.length,
      overdueTasks: tasks.filter((x) => x.due_at && new Date(x.due_at).getTime() < now).length,
      bitVencidos: bits.filter((x) => bitacoraStatus(x) === 'vencido').length,
      bitPronto: bits.filter((x) => bitacoraStatus(x) === 'pronto').length,
    });
  }, [user?.id]);

  useEffect(() => {
    void loadExtra();
  }, [loadExtra]);
  useFocusEffect(
    useCallback(() => {
      void loadExtra();
    }, [loadExtra]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadExtra()]);
    setRefreshing(false);
  }, [refresh, loadExtra]);

  const { tablet, wide } = useLayout();
  const todayItems = useMemo(
    () => items.filter((i) => isSameDay(parseISO(i.data.starts_at), today)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, today.toDateString()],
  );
  const upcoming = useMemo(
    () =>
      items
        .filter((i) => parseISO(i.data.starts_at).getTime() >= today.getTime())
        .slice(0, tablet ? 8 : 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, tablet, today.toDateString()],
  );

  const name = profile?.full_name?.split(' ')[0] || profile?.username || 'equipo';

  function openItem(item: CalendarItem) {
    if (item.kind === 'visit') router.push(`/(app)/visita/${item.data.id}`);
    else router.push(`/(app)/evento/${item.data.id}`);
  }

  return (
    <TropicalBackground>
      <ScreenFocusFade>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.teal]} />}
        contentContainerStyle={[
          styles.pad,
          { paddingTop: safeTop, paddingBottom: tablet ? 48 : 140 },
          tablet && styles.padTablet,
        ]}
      >
        <View style={styles.topRow}>
          <WoodLogo size="sm" />
        </View>

        <FancyTitle size={30} tilt={-5} style={styles.welcome}>
          Bienvenido
        </FancyTitle>
        <Text style={styles.hello}>Hola, {name}</Text>

        <View style={wide ? styles.cols : undefined}>
        <View style={wide ? styles.colLeft : undefined}>
        <GlassCard strong style={styles.hero} padding={18}>
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
          {extra ? (
            <View style={styles.stats}>
              <PressableScale style={[styles.stat, styles.statSoft]} onPress={() => router.push('/(app)/(tabs)/tareas')}>
                <Text style={[styles.statNum, { color: colors.navy }]}>{extra.tasks}</Text>
                <Text style={styles.statLabel}>Tareas pendientes</Text>
                {extra.overdueTasks ? <Text style={styles.statAlert}>{extra.overdueTasks} vencidas</Text> : null}
              </PressableScale>
              <PressableScale style={[styles.stat, styles.statSoft]} onPress={() => router.push('/(app)/(tabs)/bitacora')}>
                <Text style={[styles.statNum, { color: extra.bitVencidos ? colors.danger : colors.success }]}>
                  {extra.bitVencidos}
                </Text>
                <Text style={styles.statLabel}>Mantenimiento vencido</Text>
                {extra.bitPronto ? <Text style={styles.statWarn}>{extra.bitPronto} pronto</Text> : null}
              </PressableScale>
            </View>
          ) : null}
        </GlassCard>

        <FancyTitle size={18} tilt={-3} style={styles.sectionTitle}>
          Acciones rápidas
        </FancyTitle>
        <View style={styles.actions}>
          <PressableScale
            style={[styles.action, { backgroundColor: colors.teal }]}
            onPress={() => router.push('/(app)/visita/nueva')}
          >
            <Ionicons name="person-add" size={20} color={colors.white} />
            <Text style={styles.actionText}>Nueva visita</Text>
          </PressableScale>
          <PressableScale
            style={[styles.action, { backgroundColor: colors.coral }]}
            onPress={() => router.push('/(app)/evento/nuevo')}
          >
            <Ionicons name="sparkles" size={20} color={colors.white} />
            <Text style={styles.actionText}>Nuevo evento</Text>
          </PressableScale>
          <PressableScale
            style={[styles.action, { backgroundColor: colors.navy }]}
            onPress={() => router.push('/(app)/(tabs)/calendario')}
          >
            <Ionicons name="calendar" size={20} color={colors.white} />
            <Text style={styles.actionText}>Ver calendario</Text>
          </PressableScale>
        </View>

        </View>
        <View style={wide ? styles.colRight : undefined}>
        <FancyTitle size={18} tilt={-3} style={styles.sectionTitle}>
          Próximos en la agenda
        </FancyTitle>
        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: 20 }} />
        ) : upcoming.length === 0 ? (
          <GlassCard padding={20}>
            <Text style={styles.empty}>Sin citas próximas. Agrega la primera desde el calendario.</Text>
          </GlassCard>
        ) : (
          <View style={tablet && !wide ? styles.grid : undefined}>
            {upcoming.map((item) => (
              <View
                key={`${item.kind}-${item.data.id}`}
                style={[shadow.card, tablet && !wide ? styles.gridCell : undefined]}
              >
                <CalendarItemCard item={item} onPress={() => openItem(item)} />
                <Text style={styles.when}>{formatChipDate(item.data.starts_at)}</Text>
              </View>
            ))}
          </View>
        )}
        </View>
        </View>
      </ScrollView>
      </ScreenFocusFade>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  padTablet: { paddingHorizontal: 28, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  cols: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  colLeft: { flex: 1.1 },
  colRight: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  gridCell: { width: '50%', paddingHorizontal: 8 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcome: { marginBottom: 10, marginLeft: 4 },
  hello: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 14,
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 3,
  },
  hero: { marginBottom: 16 },
  heroTitle: { fontSize: 22, fontFamily: fonts.bold, fontWeight: '800', color: colors.navy },
  heroDate: { color: colors.navySoft, textTransform: 'capitalize', marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: {
    flex: 1,
    backgroundColor: colors.aquaMist,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  statSoft: { backgroundColor: colors.skyMist },
  statAlert: { color: colors.danger, fontSize: 11, fontWeight: '700', marginTop: 2 },
  statWarn: { color: '#9A6700', fontSize: 11, fontWeight: '700', marginTop: 2 },
  statEvent: { backgroundColor: colors.coralMist },
  statNum: { fontSize: 24, fontFamily: fonts.bold, fontWeight: '800', color: colors.tealDeep },
  statLabel: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 },
  sectionTitle: { marginBottom: 10, marginTop: 8, marginLeft: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  actionText: { color: colors.white, fontFamily: fonts.bold, fontWeight: '800', fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center' },
  when: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,30,50,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 14,
    marginLeft: 6,
  },
});
