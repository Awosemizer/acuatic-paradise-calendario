import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { ChipRow, DateTimeFields, DurationPicker, Field } from '@/src/components/FormFields';
import { KeyboardScreen } from '@/src/components/KeyboardScreen';
import { useAuth } from '@/src/context/AuthContext';
import { SERVICE_TYPES, VISIT_STATUSES } from '@/src/lib/constants';
import { parseDateTimeInputs, parseISO, toDateInput, toTimeInput } from '@/src/lib/dates';
import { supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme';
import type { Visit, VisitStatus } from '@/src/types';

export function VisitFormScreen({ visitId }: { visitId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ at?: string }>();
  const initial = params.at ? parseISO(String(params.at)) : new Date();

  const [loading, setLoading] = useState(Boolean(visitId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0]);
  const [date, setDate] = useState(toDateInput(initial));
  const [time, setTime] = useState(() => {
    const d = new Date(initial);
    if (d.getHours() < 8) d.setHours(10, 0, 0, 0);
    return toTimeInput(d);
  });
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<VisitStatus>('programada');

  useEffect(() => {
    if (!visitId) return;
    supabase
      .from('visits')
      .select('*')
      .eq('id', visitId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('No se encontró la visita.');
        } else {
          const v = data as Visit;
          setClientName(v.client_name);
          setPhone(v.phone ?? '');
          setServiceType(v.service_type);
          const d = parseISO(v.starts_at);
          setDate(toDateInput(d));
          setTime(toTimeInput(d));
          setDuration(v.duration_minutes);
          setNotes(v.notes ?? '');
          setStatus(v.status);
        }
        setLoading(false);
      });
  }, [visitId]);

  async function save() {
    setError(null);
    if (!clientName.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      setError('Usa fecha AAAA-MM-DD y hora HH:mm.');
      return;
    }
    setSaving(true);
    const payload = {
      client_name: clientName.trim(),
      phone: phone.trim() || null,
      service_type: serviceType,
      starts_at: parseDateTimeInputs(date, time).toISOString(),
      duration_minutes: duration,
      notes: notes.trim() || null,
      status,
      created_by: user?.id ?? null,
    };

    const query = visitId
      ? supabase.from('visits').update(payload).eq('id', visitId)
      : supabase.from('visits').insert(payload);

    const { error: err } = await query;
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.back();
  }

  async function remove() {
    if (!visitId) return;
    const { error: err } = await supabase.from('visits').delete().eq('id', visitId);
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
        <ActivityIndicator color={colors.aqua} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardScreen contentContainerStyle={styles.pad} bottomPadding={120} extraScrollHeight={120}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Calendario</Text>
        </Pressable>
        <Text style={styles.title}>{visitId ? 'Editar visita' : 'Nueva visita'}</Text>
        <Text style={styles.kicker}>Cliente · aqua</Text>

        <Field
          label="Nombre del cliente"
          value={clientName}
          onChangeText={setClientName}
          placeholder="María López"
          autoCapitalize="words"
        />
        <Field
          label="Teléfono (opcional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="771 123 4567"
          keyboardType="phone-pad"
        />
        <ChipRow
          label="Tipo de servicio"
          options={SERVICE_TYPES.map((s) => ({ value: s, label: s }))}
          value={serviceType}
          onChange={setServiceType}
        />
        <DateTimeFields date={date} time={time} onDate={setDate} onTime={setTime} />
        <DurationPicker value={duration} onChange={setDuration} />
        {visitId && (
          <ChipRow
            label="Estado"
            options={VISIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            value={status}
            onChange={(v) => setStatus(v as VisitStatus)}
          />
        )}
        <Field
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Paquete, invitados, indicaciones…"
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={save} disabled={saving} style={[styles.save, saving && { opacity: 0.6 }]}>
          <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar visita'}</Text>
        </Pressable>

        {visitId ? (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.delete}>
            <Text style={styles.deleteText}>Eliminar visita</Text>
          </Pressable>
        ) : null}
      </KeyboardScreen>

      <ConfirmDialog
        visible={confirmDelete}
        title="¿Eliminar visita?"
        message="Esta acción no se puede deshacer. Todo el equipo dejará de verla."
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
  kicker: { color: colors.aqua, fontWeight: '800', marginBottom: 18, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 10, fontWeight: '600' },
  save: {
    backgroundColor: colors.aqua,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  delete: { marginTop: 16, alignItems: 'center', padding: 12 },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
