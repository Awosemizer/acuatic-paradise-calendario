import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { GlassCard, TropicalBackground, WoodLogo } from '@/src/components/ui';
import type { Task } from '@/src/types';

export default function TareasScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
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
      setError(
        err.message.includes('does not exist') || err.code === '42P01'
          ? 'La tabla de tareas aún no está creada. Aplica la migración supabase/migrations/20260914140000_tasks.sql.'
          : err.message,
      );
      setTasks([]);
    } else {
      setTasks((data as Task[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('tareas-equipo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function addTask() {
    const t = title.trim();
    if (!t || saving) return;
    setSaving(true);
    const { error: err } = await supabase.from('tasks').insert({
      title: t,
      done: false,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (err) setError(err.message);
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
      <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
        <WoodLogo size="sm" />
        <Text style={styles.title}>Tareas</Text>
        <Text style={styles.sub}>Lista compartida del equipo</Text>
      </View>

      <View style={styles.composer}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nueva tarea…"
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
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          ListEmptyComponent={
            <GlassCard padding={20}>
              <Text style={styles.empty}>Sin tareas. Agrega la primera para el equipo.</Text>
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
      )}
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16 },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 3,
  },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 12 },
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
