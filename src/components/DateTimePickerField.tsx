import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { colors, radius } from '@/src/theme';
import { formatTimeString } from '@/src/lib/dates';
import { getSettings } from '@/src/lib/settingsStore';

type Mode = 'date' | 'time';

function parseDateStr(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}
function parseTimeStr(v: string) {
  const [h, m] = v.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 10, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}
const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd');
const toTimeStr = (d: Date) => format(d, 'HH:mm');

export function displayDateStr(v: string) {
  const raw = format(parseDateStr(v), "EEE d 'de' MMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function DateTimePickerField({
  label,
  mode,
  value,
  onChange,
  placeholder,
  onClear,
}: {
  label?: string;
  mode: Mode;
  /** 'yyyy-MM-dd' for date, 'HH:mm' (24h, stored) for time; '' = empty */
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);

  function openPicker() {
    if (Platform.OS === 'android') {
      // Lazy require so web bundle never touches the native module.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
      const current = mode === 'date' ? (value ? parseDateStr(value) : new Date()) : parseTimeStr(value || '10:00');
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: false,
        firstDayOfWeek: getSettings().weekStartsOn,
        onChange: (event: { type: string }, date?: Date) => {
          if (event.type !== 'set' || !date) return;
          onChange(mode === 'date' ? toDateStr(date) : toTimeStr(date));
        },
      });
      return;
    }
    setOpen(true);
  }

  const shown = value ? (mode === 'date' ? displayDateStr(value) : formatTimeString(value)) : placeholder ?? (mode === 'date' ? 'Elegir fecha' : 'Elegir hora');

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.btnRow}>
        <Pressable
          onPress={openPicker}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={`${label ?? ''} ${shown}`}
        >
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.tealDeep} />
          <Text style={[styles.buttonText, !value && styles.placeholder]} numberOfLines={1}>
            {shown}
          </Text>
        </Pressable>
        {onClear && value ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clear} accessibilityLabel="Quitar fecha">
            <Ionicons name="close-circle" size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <PickerModal
          mode={mode}
          value={value}
          onClose={() => setOpen(false)}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

function PickerModal({
  mode,
  value,
  onClose,
  onPick,
}: {
  mode: Mode;
  value: string;
  onClose: () => void;
  onPick: (v: string) => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {mode === 'date' ? (
            <CalendarPicker value={value} onPick={onPick} />
          ) : (
            <TimePicker value={value} onPick={onPick} />
          )}
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CalendarPicker({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const selected = value ? parseDateStr(value) : null;
  const [cursor, setCursor] = useState(selected ?? new Date());
  const ws = getSettings().weekStartsOn;
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: ws }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: ws }),
      }),
    [cursor, ws],
  );
  const dow = ws === 0 ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const title = format(cursor, 'LLLL yyyy', { locale: es });
  const today = new Date();

  return (
    <View>
      <View style={styles.calHead}>
        <Pressable onPress={() => setCursor(subMonths(cursor, 1))} hitSlop={10} accessibilityLabel="Mes anterior">
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.calTitle}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
        <Pressable onPress={() => setCursor(addMonths(cursor, 1))} hitSlop={10} accessibilityLabel="Mes siguiente">
          <Ionicons name="chevron-forward" size={22} color={colors.navy} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {dow.map((d, i) => (
          <Text key={`${d}${i}`} style={styles.dow}>
            {d}
          </Text>
        ))}
        {days.map((d) => {
          const sel = selected && isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          return (
            <Pressable key={d.toISOString()} onPress={() => onPick(toDateStr(d))} style={styles.dayCell}>
              <View style={[styles.dayInner, isToday && styles.dayToday, sel && styles.daySel]}>
                <Text
                  style={[
                    styles.dayText,
                    !isSameMonth(d, cursor) && styles.dayOut,
                    sel && styles.daySelText,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => onPick(toDateStr(today))} style={styles.todayBtn}>
        <Text style={styles.todayText}>Hoy</Text>
      </Pressable>
    </View>
  );
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function TimePicker({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const base = parseTimeStr(value || '10:00');
  const [h24, setH24] = useState(base.getHours());
  const [min, setMin] = useState(base.getMinutes());
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minutes = MINUTES.includes(min) ? MINUTES : [...MINUTES, min].sort((a, b) => a - b);

  function setHour12(h: number) {
    const base24 = h % 12;
    setH24(pm ? base24 + 12 : base24);
  }
  function setPm(next: boolean) {
    if (next === pm) return;
    setH24(next ? h24 + 12 : h24 - 12);
  }
  const preview = `${h12}:${String(min).padStart(2, '0')} ${pm ? 'p.m.' : 'a.m.'}`;

  return (
    <View>
      <Text style={styles.calTitle}>{preview}</Text>
      <Text style={styles.subLabel}>Hora</Text>
      <View style={styles.chipGrid}>
        {HOURS.map((h) => (
          <Pressable key={h} onPress={() => setHour12(h)} style={[styles.chip, h === h12 && styles.chipOn]}>
            <Text style={[styles.chipText, h === h12 && styles.chipTextOn]}>{h}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.subLabel}>Minutos</Text>
      <ScrollView horizontal={false} style={{ maxHeight: 140 }}>
        <View style={styles.chipGrid}>
          {minutes.map((m) => (
            <Pressable key={m} onPress={() => setMin(m)} style={[styles.chip, m === min && styles.chipOn]}>
              <Text style={[styles.chipText, m === min && styles.chipTextOn]}>{String(m).padStart(2, '0')}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.chipGrid, { marginTop: 8 }]}>
        {[false, true].map((p) => (
          <Pressable key={String(p)} onPress={() => setPm(p)} style={[styles.ampm, p === pm && styles.chipOn]}>
            <Text style={[styles.chipText, p === pm && styles.chipTextOn]}>{p ? 'p.m.' : 'a.m.'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => onPick(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`)}
        style={styles.okBtn}
      >
        <Text style={styles.okText}>Listo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navySoft, marginBottom: 6 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  buttonText: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '600' },
  placeholder: { color: colors.muted, fontWeight: '400' },
  clear: { padding: 2 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
  },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calTitle: { fontSize: 17, fontWeight: '800', color: colors.navy, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', color: colors.muted, fontWeight: '700', fontSize: 12, paddingVertical: 4 },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayInner: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: colors.teal },
  daySel: { backgroundColor: colors.teal },
  dayText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  dayOut: { color: '#A9B6C2' },
  daySelText: { color: colors.white },
  todayBtn: { alignSelf: 'center', marginTop: 6, paddingHorizontal: 16, paddingVertical: 6 },
  todayText: { color: colors.tealDeep, fontWeight: '800' },
  subLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 10, marginBottom: 6 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    minWidth: 44,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.skyMist,
    alignItems: 'center',
  },
  ampm: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.skyMist, alignItems: 'center' },
  chipOn: { backgroundColor: colors.teal },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: colors.white },
  okBtn: { marginTop: 14, backgroundColor: colors.teal, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  okText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  cancel: { alignSelf: 'center', marginTop: 8, padding: 8 },
  cancelText: { color: colors.muted, fontWeight: '700' },
});
