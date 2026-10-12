import { PressableScale } from '@/src/components/ui/PressableScale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeTop } from '@/src/hooks/useSafeTop';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { canEditTasks } from '@/src/lib/permissions';
import { supabase } from '@/src/lib/supabase';
import { colors, radius, shadow } from '@/src/theme';
import {
  FancyTitle,
  GlassCard,
  ScreenFocusFade,
  SegmentedControl,
  TropicalBackground,
  WoodLogo,
} from '@/src/components/ui';
import type { Task } from '@/src/types';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { DateTimePickerField } from '@/src/components/DateTimePickerField';
import { useSettings } from '@/src/context/SettingsContext';
import { endOfDay, format, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function dueLabel(due: string) {
  const d = parseISO(due);
  if (isToday(d)) return 'Vence hoy';
  if (isTomorrow(d)) return 'Vence mañana';
  return `Vence ${format(d, "EEE d 'de' MMM", { locale: es })}`;
}

type TaskScope = 'shared' | 'personal';

function mapTaskError(message: string, code?: string) {
  if (message.includes('does not exist') || code === '42P01') {
    return 'La tabla de tareas aún no está creada. Aplica supabase/migrations/20260914140000_tasks.sql.';
  }
  if (message.includes('is_personal') || message.includes('column')) {
    return 'Falta la columna de tareas personales. Aplica supabase/migrations/20260914150000_tasks_personal.sql.';
  }
  return message;
}

export default function TareasScreen() {
  const insets = useSafeAreaInsets();
  const safeTop = useSafeTop(8);
  const { user, profile } = useAuth();
  const allowSharedEdit = canEditTasks(profile);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TaskScope>('shared');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const { settings, update: updateSettings } = useSettings();
  const hideDone = !settings.showCompleted;

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*')
      .order('done', { ascending: true })
      .order('created_at', { ascending: false });
    if (err) {
      setError(mapTaskError(err.message, err.code));
      setTasks([]);
    } else {
      setTasks((data as Task[]) ?? []);
    }
    setLoading(false);
  }, []);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const topic = `tareas-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(topic)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          void loadRef.current();
        });
      channel.subscribe();
    } catch (err) {
      console.warn('Realtime tareas no disponible', err);
    }
    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const visible = useMemo(() => {
    if (scope === 'personal') {
      return tasks.filter((t) => t.is_personal && t.created_by === user?.id);
    }
    return tasks.filter((t) => !t.is_personal);
  }, [tasks, scope, user?.id]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible
      .filter((t) => (hideDone ? !t.done : true))
      .filter((t) => (q ? t.title.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.due_at && b.due_at) return a.due_at.localeCompare(b.due_at);
        if (a.due_at) return -1;
        if (b.due_at) return 1;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [visible, hideDone, query]);

  const pendingCount = visible.filter((t) => !t.done).length;
  const overdueCount = visible.filter(
    (t) => !t.done && t.due_at && isBefore(parseISO(t.due_at), new Date()),
  ).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function addTask() {
    const t = title.trim();
    if (saving) return;
    if (!t) {
      const msg = 'Escribe un título para la tarea.';
      setError(msg);
      Alert.alert('Tarea', msg);
      return;
    }
    if (!user?.id) {
      const msg = 'No hay sesión activa. Vuelve a iniciar sesión.';
      setError(msg);
      Alert.alert('Tarea', msg);
      return;
    }
    const isPersonal = scope === 'personal';
    if (!isPersonal && !allowSharedEdit) {
      const msg = 'No tienes permiso para crear tareas del equipo.';
      setError(msg);
      Alert.alert('Permiso', msg);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('tasks').insert({
        title: t,
        done: false,
        created_by: user.id,
        is_personal: isPersonal,
        due_at: dueDate ? endOfDay(new Date(`${dueDate}T12:00:00`)).toISOString() : null,
      });
      if (err) {
        const msg = mapTaskError(err.message, err.code);
        setError(msg);
        Alert.alert('No se pudo guardar', msg);
      } else {
        setTitle('');
        setDueDate('');
        await load();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar la tarea';
      setError(msg);
      Alert.alert('No se pudo guardar', msg);
    } finally {
      setSaving(false);
    }
  }


  async function toggle(task: Task) {
    await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id);
    load();
  }

  async function remove(task: Task) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', task.id);
    if (err) setError(mapTaskError(err.message, err.code));
    load();
  }

  function askRemove(task: Task) {
    if (settings.confirmDeletes) setToDelete(task);
    else void remove(task);
  }

  return (
    <TropicalBackground>
      <ScreenFocusFade style={styles.flex}>
        <KeyboardAwareFlatList
          style={styles.flex}
          data={loading ? [] : shown}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.teal]} />}
          keyExtractor={(item) => item.id}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={100}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          ListHeaderComponent={
            <View>
              <View style={[styles.head, { paddingTop: safeTop }]}>
                <WoodLogo size="sm" />
                <FancyTitle size={28} tilt={-5} style={styles.title}>
                  Tareas
                </FancyTitle>
                <Text style={styles.sub}>
                  {scope === 'personal' ? 'Solo tú las ves' : allowSharedEdit ? 'Visibles para todo el equipo' : 'Visibles para el equipo (solo lectura)'}
                </Text>
              </View>

              <View style={styles.tabs}>
                <SegmentedControl
                  options={[
                    { id: 'shared', label: 'Equipo' },
                    { id: 'personal', label: 'Personales' },
                  ]}
                  value={scope}
                  onChange={setScope}
                />
              </View>

              {(allowSharedEdit || scope === 'personal') ? (
              <View style={styles.composer}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={scope === 'personal' ? 'Nueva tarea personal…' : 'Nueva tarea del equipo…'}
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  onSubmitEditing={addTask}
                  returnKeyType="done"
                />
                <PressableScale
                  onPress={addTask}
                  style={styles.addBtn}
                  disabled={saving}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar tarea"
                >
                  <Ionicons name="add" size={26} color={colors.white} />
                </PressableScale>
              </View>
              ) : null}
              {(allowSharedEdit || scope === 'personal') ? (
                <View style={styles.dueRow}>
                  <DateTimePickerField
                    mode="date"
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Fecha límite (opcional)"
                    onClear={() => setDueDate('')}
                  />
                </View>
              ) : (
                <Text style={[styles.sub, { marginHorizontal: 16 }]}>
                  Solo lectura en tareas del equipo. Un admin puede darte permiso.
                </Text>
              )}

              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar tarea…"
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {query ? (
                  <PressableScale onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </PressableScale>
                ) : null}
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>{pendingCount} pendientes</Text>
                {overdueCount ? <Text style={[styles.stat, styles.statDanger]}>{overdueCount} vencidas</Text> : null}
                <PressableScale onPress={() => updateSettings({ showCompleted: hideDone })} style={styles.statBtn}>
                  <Ionicons name={hideDone ? 'eye-outline' : 'eye-off-outline'} size={14} color={colors.white} />
                  <Text style={styles.statBtnText}>{hideDone ? 'Mostrar hechas' : 'Ocultar hechas'}</Text>
                </PressableScale>
              </View>

              {error ? (
                <GlassCard style={{ marginHorizontal: 16, marginBottom: 8 }} padding={12}>
                  <Text style={styles.error}>{error}</Text>
                </GlassCard>
              ) : null}

              {loading ? (
                <ActivityIndicator color={colors.white} style={{ marginTop: 30 }} />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={{ padding: 16 }}>
                <GlassCard padding={20}>
                  <Text style={styles.empty}>
                    {scope === 'personal'
                      ? 'Sin tareas personales. Agrega una solo para ti.'
                      : query
                        ? 'Ninguna tarea coincide con la búsqueda.'
                        : 'Sin tareas de equipo. Agrega la primera.'}
                  </Text>
                </GlassCard>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={[styles.row, shadow.card, item.done && styles.rowDone]}>
                <PressableScale onPress={() => toggle(item)} hitSlop={8}>
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={item.done ? colors.success : colors.teal}
                  />
                </PressableScale>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, item.done && styles.taskDone]} numberOfLines={3}>
                    {item.title}
                  </Text>
                  {item.due_at ? (
                    <Text
                      style={[
                        styles.due,
                        !item.done && isBefore(parseISO(item.due_at), new Date()) && styles.dueLate,
                      ]}
                    >
                      {!item.done && isBefore(parseISO(item.due_at), new Date()) ? 'Vencida · ' : ''}
                      {dueLabel(item.due_at)}
                    </Text>
                  ) : null}
                </View>
                <PressableScale
                  onPress={() => askRemove(item)}
                  hitSlop={8}
                  accessibilityLabel="Eliminar tarea"
                  disabled={!item.is_personal && !allowSharedEdit}
                  style={!item.is_personal && !allowSharedEdit ? { opacity: 0.3 } : null}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.muted} />
                </PressableScale>
              </View>
            </View>
          )}
        />
        <ConfirmDialog
          visible={!!toDelete}
          title="¿Eliminar tarea?"
          message={toDelete ? `«${toDelete.title}» se eliminará.` : ''}
          confirmLabel="Eliminar"
          destructive
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const t = toDelete;
            setToDelete(null);
            if (t) void remove(t);
          }}
        />
      </ScreenFocusFade>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: 16 },
  title: { marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.9)', marginTop: 10, marginBottom: 10, marginLeft: 6 },
  tabs: { paddingHorizontal: 16, marginBottom: 10 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 8,
  },
  rowDone: { opacity: 0.7 },
  dueRow: { paddingHorizontal: 16, marginBottom: -4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 15, color: colors.ink },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 18, marginBottom: 10 },
  stat: { color: colors.white, fontWeight: '700', fontSize: 13 },
  statDanger: { color: colors.coralSoft },
  statBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  statBtnText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  due: { color: colors.tealDeep, fontSize: 12, fontWeight: '600', marginTop: 2 },
  dueLate: { color: colors.danger },
  taskTitle: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  taskDone: { textDecorationLine: 'line-through', color: colors.muted },
  empty: { color: colors.muted, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
});
