import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { DateTimeFields, DurationPicker, Field } from '@/src/components/FormFields';
import { KeyboardScreen } from '@/src/components/KeyboardScreen';
import { useAuth } from '@/src/context/AuthContext';
import { parseDateTimeInputs, parseISO, toDateInput, toTimeInput } from '@/src/lib/dates';
import { supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme';
import type { CalendarEvent } from '@/src/types';

export function EventFormScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ at?: string }>();
  const initial = params.at ? parseISO(String(params.at)) : new Date();

  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateInput(initial));
  const [time, setTime] = useState(
    toTimeInput(initial.getHours() < 8 ? new Date(new Date(initial).setHours(10, 0, 0, 0)) : initial),
  );
  const [duration, setDuration] = useState(120);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('No se encontró el evento.');
        } else {
          const e = data as CalendarEvent;
          setTitle(e.title);
          const d = parseISO(e.starts_at);
          setDate(toDateInput(d));
          setTime(toTimeInput(d));
          setDuration(e.duration_minutes);
          setNotes(e.notes ?? '');
        }
        setLoading(false);
      });
  }, [eventId]);

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      setError('Usa fecha AAAA-MM-DD y hora HH:mm.');
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      starts_at: parseDateTimeInputs(date, time).toISOString(),
      duration_minutes: duration,
      notes: notes.trim() || null,
      created_by: user?.id ?? null,
    };
    const query = eventId
      ? supabase.from('events').update(payload).eq('id', eventId)
      : supabase.from('events').insert(payload);
    const { error: err } = await query;
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.back();
  }

  async function remove() {
    if (!eventId) return;
    const { error: err } = await supabase.from('events').delete().eq('id', eventId);
    setConfirmDelete(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.coral} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardScreen contentContainerStyle={styles.pad} bottomPadding={120} extraScrollHeight={120}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Calendario</Text>
        </Pressable>
        <Text style={styles.title}>{eventId ? 'Editar evento' : 'Nuevo evento'}</Text>
        <Text style={styles.kicker}>Interno · coral</Text>

        <Field
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Mantenimiento de alberca"
          autoCapitalize="sentences"
        />
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <DurationPicker value={duration} onChange={setDuration} />
        <Field
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalles para el equipo…"
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={save} disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar evento'}</Text>
        </Pressable>

        {eventId ? (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.delete}>
            <Text style={styles.deleteText}>Eliminar evento</Text>
          </Pressable>
        ) : null}
      </KeyboardScreen>

      <ConfirmDialog
        visible={confirmDelete}
        title="¿Eliminar evento?"
        message="Esta acción no se puede deshacer. Todo el equipo dejará de verlo."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  pad: { padding: 20 },
  back: { color: colors.sky, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  kicker: { color: colors.coral, fontWeight: '800', marginBottom: 18, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 10, fontWeight: '600' },
  save: {
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  delete: { marginTop: 16, alignItems: 'center', padding: 12 },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
