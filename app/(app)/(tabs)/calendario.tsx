import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeTop } from '@/src/hooks/useSafeTop';
import { AddMenu } from '@/src/components/AddMenu';
import { CalendarHeader } from '@/src/components/CalendarHeader';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { DayView } from '@/src/components/DayView';
import { MonthView } from '@/src/components/MonthView';
import { WeekView } from '@/src/components/WeekView';
import { calendarItemKey } from '@/src/components/CalendarItemCard';
import { ErrorBoundary, FadeSlide, ScreenFocusFade, SplashFAB, TropicalBackground } from '@/src/components/ui';
import { useAuth } from '@/src/context/AuthContext';
import { canEditCalendar } from '@/src/lib/permissions';
import { useCalendarData } from '@/src/hooks/useCalendarData';
import { shiftCursor } from '@/src/lib/dates';
import { supabase } from '@/src/lib/supabase';
import { colors, fonts, radius, shadow } from '@/src/theme';
import type { CalendarItem, CalendarView } from '@/src/types';

export default function CalendarioScreen() {
  return (
    <TropicalBackground>
      <ErrorBoundary fallbackTitle="No se pudo abrir el calendario">
        <ScreenFocusFade>
          <CalendarioBody />
        </ScreenFocusFade>
      </ErrorBoundary>
    </TropicalBackground>
  );
}

function CalendarioBody() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const safeTop = useSafeTop(8);
  const { profile } = useAuth();
  const allowCalendarEdit = canEditCalendar(profile);
  const [view, setView] = useState<CalendarView>('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { items, loading, error, refresh } = useCalendarData(cursor, view);

  const isoForCreate = useMemo(() => {
    const d = view === 'month' ? selectedDay : cursor;
    const copy = new Date(d);
    if (copy.getHours() < 8) copy.setHours(10, 0, 0, 0);
    return copy.toISOString();
  }, [cursor, selectedDay, view]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(calendarItemKey(item))),
    [items, selectedKeys],
  );
  const selectedCount = selectedItems.length;
  const selectedVisits = selectedItems.filter((i) => i.kind === 'visit');

  function openItem(item: CalendarItem) {
    if (item.kind === 'visit') {
      router.push(`/(app)/visita/${item.data.id}`);
    } else {
      router.push(`/(app)/evento/${item.data.id}`);
    }
  }

  function goDay(day: Date) {
    setCursor(day);
    setSelectedDay(day);
    setView('day');
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedKeys(new Set());
    setActionError(null);
  }

  function toggleSelectMode() {
    if (selectMode) exitSelectMode();
    else {
      setSelectMode(true);
      setSelectedKeys(new Set());
    }
  }

  function toggleItem(item: CalendarItem) {
    const key = calendarItemKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function longPressItem(item: CalendarItem) {
    if (!selectMode) {
      setSelectMode(true);
      setSelectedKeys(new Set([calendarItemKey(item)]));
      return;
    }
    toggleItem(item);
  }

  async function deleteSelected() {
    setBusy(true);
    setActionError(null);
    try {
      const visitIds = selectedItems.filter((i) => i.kind === 'visit').map((i) => i.data.id);
      const eventIds = selectedItems.filter((i) => i.kind === 'event').map((i) => i.data.id);
      if (visitIds.length) {
        const { error: err } = await supabase.from('visits').delete().in('id', visitIds);
        if (err) throw new Error(err.message);
      }
      if (eventIds.length) {
        const { error: err } = await supabase.from('events').delete().in('id', eventIds);
        if (err) throw new Error(err.message);
      }
      setConfirmDelete(false);
      exitSelectMode();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo eliminar');
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function markVisitsCompleted() {
    if (!selectedVisits.length) return;
    setBusy(true);
    setActionError(null);
    try {
      const ids = selectedVisits.map((i) => i.data.id);
      const { error: err } = await supabase
        .from('visits')
        .update({ status: 'completada' })
        .in('id', ids);
      if (err) throw new Error(err.message);
      exitSelectMode();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  const selectProps = {
    selectMode,
    selectedKeys,
    onToggleItem: toggleItem,
    onLongPressItem: longPressItem,
  };

  return (
    <View style={[styles.screen, { paddingTop: safeTop }]}>
      <CalendarHeader
        cursor={cursor}
        view={view}
        onView={setView}
        onPrev={() => setCursor((c) => shiftCursor(c, view, -1))}
        onNext={() => setCursor((c) => shiftCursor(c, view, 1))}
        onToday={() => {
          const now = new Date();
          setCursor(now);
          setSelectedDay(now);
        }}
        onProfile={() => router.push('/(app)/(tabs)/mas')}
        staffName={profile?.full_name || profile?.username || 'Equipo'}
        avatarUrl={profile?.avatar_url}
      />

      <View style={styles.toolbar}>
        <Pressable
          onPress={toggleSelectMode}
          style={[styles.selectBtn, selectMode && styles.selectBtnOn]}
        >
          <Ionicons
            name={selectMode ? 'checkbox' : 'checkbox-outline'}
            size={18}
            color={selectMode ? colors.white : colors.tealDeep}
          />
          <Text style={[styles.selectBtnText, selectMode && styles.selectBtnTextOn]}>
            {selectMode ? 'Listo' : 'Seleccionar'}
          </Text>
        </Pressable>
        {selectMode ? (
          <Text style={styles.selectHint}>
            Mantén pulsada una cita o tócala para marcar varias.
          </Text>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : (
          <FadeSlide animKey={view}>
            {view === 'day' ? (
              <DayView date={cursor} items={items} onPressItem={openItem} {...selectProps} />
            ) : view === 'week' ? (
              <WeekView
                cursor={cursor}
                items={items}
                onPressItem={openItem}
                onPressDay={goDay}
                {...selectProps}
              />
            ) : (
              <MonthView
                cursor={cursor}
                selected={selectedDay}
                items={items}
                onSelectDay={(day) => {
                  setSelectedDay(day);
                  setCursor(day);
                }}
                onPressItem={openItem}
                onOpenFullAgenda={goDay}
                {...selectProps}
              />
            )}
          </FadeSlide>
        )}
      </View>

      {selectedCount > 0 ? (
        <View style={[styles.bulkBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Text style={styles.bulkCount}>
            {selectedCount === 1 ? '1 seleccionado' : `${selectedCount} seleccionados`}
          </Text>
          <View style={styles.bulkActions}>
            {allowCalendarEdit && selectedVisits.length > 0 ? (
              <Pressable
                style={styles.bulkPrimary}
                onPress={() => {
                  void markVisitsCompleted();
                }}
                disabled={busy}
              >
                <Ionicons name="checkmark-done" size={16} color={colors.white} />
                <Text style={styles.bulkPrimaryText}>Completar visitas</Text>
              </Pressable>
            ) : null}
            {allowCalendarEdit ? (
              <Pressable
                style={styles.bulkDanger}
                onPress={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={styles.bulkPrimaryText}>Eliminar</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.bulkCancel} onPress={exitSelectMode}>
              <Text style={styles.bulkCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {allowCalendarEdit ? (
        <SplashFAB
          onPress={() => setMenuOpen(true)}
          bottom={Math.max(insets.bottom, 8) + 8 + (selectedCount > 0 ? 72 : 0)}
        />
      ) : null}

      <AddMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onVisit={() => {
          setMenuOpen(false);
          router.push({ pathname: '/(app)/visita/nueva', params: { at: isoForCreate } });
        }}
        onEvent={() => {
          setMenuOpen(false);
          router.push({ pathname: '/(app)/evento/nuevo', params: { at: isoForCreate } });
        }}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="¿Eliminar seleccionados?"
        message={
          selectedCount === 1
            ? 'Se eliminará esta cita del calendario.'
            : `Se eliminarán ${selectedCount} citas del calendario.`
        }
        confirmLabel={busy ? 'Eliminando…' : 'Eliminar'}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void deleteSelected();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toolbar: {
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 6,
  },
  selectBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  selectBtnOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  selectBtnText: { color: colors.tealDeep, fontWeight: '800', fontSize: 13 },
  selectBtnTextOn: { color: colors.white },
  selectHint: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 16 },
  body: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: {
    color: colors.ink,
    fontFamily: fonts.medium,
    textAlign: 'center',
    padding: 12,
    backgroundColor: colors.glassStrong,
    marginHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  bulkBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...shadow.card,
    zIndex: 20,
  },
  bulkCount: { color: colors.white, fontWeight: '800', fontSize: 14 },
  bulkActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bulkPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bulkDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bulkPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  bulkCancel: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bulkCancelText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
