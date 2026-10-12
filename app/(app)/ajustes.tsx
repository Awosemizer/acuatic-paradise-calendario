import { PressableScale } from '@/src/components/ui/PressableScale';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { settingsNav, useSettings } from '@/src/context/SettingsContext';
import {
  ACCENTS,
  DEFAULT_SETTINGS,
  FONT_SCALES,
  type AccentId,
  type FontSizeId,
  type StartView,
} from '@/src/lib/settingsStore';
import { remindersSupported, syncReminders } from '@/src/lib/reminders';
import { colors, radius } from '@/src/theme';

const FONT_OPTIONS: { id: FontSizeId; label: string }[] = [
  { id: 'sm', label: 'Pequeño' },
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Grande' },
  { id: 'xl', label: 'Muy grande' },
];
const VIEW_OPTIONS: { id: StartView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];
const REMINDER_OPTIONS = [10, 15, 30, 60, 120];

function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <PressableScale
            key={String(o.id)}
            onPress={() => onChange(o.id)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Row({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.teal, false: colors.line }} />
    </View>
  );
}

export default function AjustesScreen() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const [msg, setMsg] = useState<string | null>(null);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.pad}
        contentOffset={{ x: 0, y: settingsNav.scrollY }}
        scrollEventThrottle={64}
        onScroll={(e) => {
          settingsNav.scrollY = e.nativeEvent.contentOffset.y;
        }}
      >
        <PressableScale
          onPress={() => {
            settingsNav.scrollY = 0;
            if (router.canGoBack()) router.back();
            else router.replace('/(app)/(tabs)/mas' as never);
          }}
          hitSlop={8}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text style={styles.back}>‹ Volver</Text>
        </PressableScale>
        <Text style={styles.title}>Ajustes</Text>

        <Text style={styles.section}>Apariencia</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Tamaño de letra</Text>
          <Chips options={FONT_OPTIONS} value={settings.fontSize} onChange={(v) => void update({ fontSize: v })} />
          <Text style={[styles.preview, { fontSize: 15 * FONT_SCALES[settings.fontSize] }]}>
            Así se verá el texto en la app.
          </Text>

          <Text style={[styles.rowLabel, { marginTop: 16 }]}>Color del tema</Text>
          <View style={styles.swatches}>
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
              const on = settings.accent === id;
              const pal = ACCENTS[id].palette;
              return (
                <PressableScale
                  key={id}
                  onPress={() => void update({ accent: id })}
                  style={styles.swatchWrap}
                  accessibilityLabel={`Tema ${ACCENTS[id].label}`}
                >
                  <View style={[styles.swatch, { backgroundColor: pal.teal }, on && styles.swatchOn]}>
                    <View style={[styles.swatchInner, { backgroundColor: pal.aquaLight }]} />
                    {on ? <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ position: 'absolute' }} /> : null}
                  </View>
                  <Text style={styles.swatchLabel}>{ACCENTS[id].label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <Text style={styles.section}>Calendario</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Vista al abrir el calendario</Text>
          <Chips options={VIEW_OPTIONS} value={settings.startView} onChange={(v) => void update({ startView: v })} />
          <Text style={[styles.rowLabel, { marginTop: 16 }]}>Primer día de la semana</Text>
          <Chips
            options={[
              { id: 1 as const, label: 'Lunes' },
              { id: 0 as const, label: 'Domingo' },
            ]}
            value={settings.weekStartsOn}
            onChange={(v) => void update({ weekStartsOn: v })}
          />
          <Text style={styles.hint}>Las horas se muestran en formato de 12 horas (a.m. / p.m.).</Text>
        </View>

        <Text style={styles.section}>Recordatorios</Text>
        <View style={styles.card}>
          {remindersSupported ? (
            <>
              <Row
                label="Avisos de visitas y eventos"
                hint="Notificación en este teléfono antes de cada cita (próximos 7 días)."
                value={settings.reminders}
                onChange={(v) => void update({ reminders: v })}
              />
              {settings.reminders ? (
                <>
                  <Text style={[styles.rowLabel, { marginTop: 8 }]}>Avisar antes</Text>
                  <Chips
                    options={REMINDER_OPTIONS.map((m) => ({ id: m, label: m >= 60 ? `${m / 60} h` : `${m} min` }))}
                    value={settings.reminderMinutes}
                    onChange={(v) => void update({ reminderMinutes: v })}
                  />
                </>
              ) : null}
              <Row
                label="Resumen diario de bitácora"
                hint="A las 8:00 a.m., si hay mantenimiento vencido o próximo."
                value={settings.bitacoraAlerts}
                onChange={(v) => void update({ bitacoraAlerts: v })}
              />
              <PressableScale
                style={styles.secondary}
                onPress={async () => {
                  await syncReminders();
                  flash('Recordatorios actualizados.');
                }}
              >
                <Ionicons name="notifications-outline" size={18} color={colors.tealDeep} />
                <Text style={styles.secondaryText}>Actualizar recordatorios ahora</Text>
              </PressableScale>
            </>
          ) : (
            <Text style={styles.hint}>
              Los recordatorios funcionan en la app de Android. En la web no hay notificaciones.
            </Text>
          )}
        </View>

        <Text style={styles.section}>General</Text>
        <View style={styles.card}>
          <Row
            label="Mostrar tareas completadas"
            value={settings.showCompleted}
            onChange={(v) => void update({ showCompleted: v })}
          />
          <Row
            label="Confirmar antes de eliminar"
            value={settings.confirmDeletes}
            onChange={(v) => void update({ confirmDeletes: v })}
          />
        </View>

        <PressableScale
          style={styles.reset}
          onPress={async () => {
            await update({ ...DEFAULT_SETTINGS });
            flash('Ajustes restablecidos.');
          }}
        >
          <Text style={styles.resetText}>Restablecer ajustes</Text>
        </PressableScale>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <Text style={styles.foot}>Los ajustes se guardan en este dispositivo{Platform.OS === 'web' ? ' (navegador)' : ''}.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  pad: { padding: 20, paddingBottom: 60 },
  back: { color: colors.sky, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  section: { fontSize: 13, fontWeight: '800', color: colors.tealDeep, textTransform: 'uppercase', marginTop: 18, marginBottom: 8, letterSpacing: 0.6 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
  preview: { color: colors.navySoft, marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.skyMist },
  chipOn: { backgroundColor: colors.teal },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: colors.white },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  swatchWrap: { alignItems: 'center', width: 58 },
  swatch: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  swatchInner: { position: 'absolute', right: -8, bottom: -8, width: 26, height: 26, borderRadius: 13 },
  swatchOn: { borderWidth: 3, borderColor: colors.navy },
  swatchLabel: { fontSize: 10.5, color: colors.muted, marginTop: 4, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  secondary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingVertical: 10 },
  secondaryText: { color: colors.tealDeep, fontWeight: '700' },
  reset: { marginTop: 22, alignSelf: 'center', padding: 10 },
  resetText: { color: colors.danger, fontWeight: '700' },
  msg: { textAlign: 'center', color: colors.success, fontWeight: '700' },
  foot: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
