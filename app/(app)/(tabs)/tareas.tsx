import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { colors, radius, shadow } from '@/src/theme';
import {
  FadeSlide,
  FancyTitle,
  GlassCard,
  ScreenFocusFade,
  SegmentedControl,
  TropicalBackground,
  WoodLogo,
} from '@/src/components/ui';
import type { Task } from '@/src/types';

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TaskScope>('shared');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function addTask() {
    const t = title.trim();
    if (!t || saving) return;
    setSaving(true);
    const isPersonal = scope === 'personal';
    const { error: err } = await supabase.from('tasks').insert({
      title: t,
      done: false,
      created_by: user?.id ?? null,
      is_personal: isPersonal,
    });
    setSaving(false);
    if (err) setError(mapTaskError(err.message, err.code));
    else {
      setTitle('');
      load();
    }
  }

  async function toggle(task: Task) {
    await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id);
    load();
  }

  async function remove(task: Task) {
    await supabase.from('tasks').delete().eq('id', task.id);
    load();
  }

  return (
    <TropicalBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={insets.top + 8}
      >
        <ScreenFocusFade>
          <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
            <WoodLogo size="sm" />
            <FancyTitle size={28} tilt={-5} style={styles.title}>
              Tareas
            </FancyTitle>
            <Text style={styles.sub}>
              {scope === 'personal' ? 'Solo tú las ves' : 'Visibles para todo el equipo'}
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

          <View style={styles.composer}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={scope === 'personal' ? 'Nueva tarea personal…' : 'Nueva tarea del equipo…'}
              placeholderTextColor={colors.muted}
              style={styles.input}
              onSubmitEditing={addTask}
            />
            <Pressable onPress={addTask} style={styles.addBtn} disabled={saving}>
              <Ionicons name="add" size={26} color={colors.white} />
            </Pressable>
          </View>

          {error ? (
            <GlassCard style={{ marginHorizontal: 16, marginBottom: 8 }} padding={12}>
              <Text style={styles.error}>{error}</Text>
            </GlassCard>
          ) : null}

          {loading ? (
            <ActivityIndicator color={colors.white} style={{ marginTop: 30 }} />
          ) : (
            <FadeSlide animKey={scope} style={{ flex: 1 }}>
              <FlatList
                data={visible}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                  <GlassCard padding={20}>
                    <Text style={styles.empty}>
                      {scope === 'personal'
                        ? 'Sin tareas personales. Agrega una solo para ti.'
                        : 'Sin tareas de equipo. Agrega la primera.'}
                    </Text>
                  </GlassCard>
                }
                renderItem={({ item }) => (
                  <View style={[styles.row, shadow.card, item.done && styles.rowDone]}>
                    <Pressable onPress={() => toggle(item)} hitSlop={8}>
                      <Ionicons
                        name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                        size={26}
                        color={item.done ? colors.success : colors.teal}
                      />
                    </Pressable>
                    <Text style={[styles.taskTitle, item.done && styles.taskDone]} numberOfLines={3}>
                      {item.title}
                    </Text>
                    <Pressable onPress={() => remove(item)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                )}
              />
            </FadeSlide>
          )}
        </ScreenFocusFade>
      </KeyboardAvoidingView>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: 16 },
  title: { marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 10, marginLeft: 6 },
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
  taskTitle: { flex: 1, color: colors.ink, fontWeight: '600', fontSize: 15 },
  taskDone: { textDecorationLine: 'line-through', color: colors.muted },
  empty: { color: colors.muted, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
});
