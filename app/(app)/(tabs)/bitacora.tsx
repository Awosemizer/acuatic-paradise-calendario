import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/src/context/AuthContext';
import { KeyboardScreen } from '@/src/components/KeyboardScreen';
import {
  FancyTitle,
  GlassCard,
  ScreenFocusFade,
  SegmentedControl,
  TropicalBackground,
  WoodLogo,
} from '@/src/components/ui';
import {
  areaLabel,
  bitacoraStatus,
  nextDueAt,
  statusMeta,
  useBitacora,
  type BitacoraFilter,
} from '@/src/hooks/useBitacora';
import { colors, fonts, radius, shadow } from '@/src/theme';
import type { BitacoraArea, BitacoraItem, BitacoraLog } from '@/src/types';

const AREA_OPTIONS: { id: BitacoraFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'piscina', label: 'Piscina' },
  { id: 'salon', label: 'Salón' },
  { id: 'general', label: 'General' },
];

const FORM_AREAS: { value: BitacoraArea; label: string }[] = [
  { value: 'piscina', label: 'Piscina' },
  { value: 'salon', label: 'Salón' },
  { value: 'general', label: 'General' },
];

function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Sin registro';
  const d = typeof value === 'string' ? parseISO(value) : value;
  return format(d, "d MMM yyyy", { locale: es });
}

function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy · HH:mm", { locale: es });
}

export default function BitacoraScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, loading, error, createItem, updateItem, registerDone, fetchLogs } = useBitacora();
  const [filter, setFilter] = useState<BitacoraFilter>('todas');
  const [selected, setSelected] = useState<BitacoraItem | null>(null);
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerNotes, setRegisterNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BitacoraItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArea, setFormArea] = useState<BitacoraArea>('piscina');
  const [formInterval, setFormInterval] = useState('7');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === 'todas') return items;
    return items.filter((i) => i.area === filter);
  }, [items, filter]);

  const openDetail = useCallback(
    async (item: BitacoraItem) => {
      setSelected(item);
      setActionError(null);
      setLogsLoading(true);
      try {
        const rows = await fetchLogs(item.id);
        setLogs(rows);
      } catch (e) {
        setLogs([]);
        setActionError(e instanceof Error ? e.message : 'No se pudo cargar el historial');
      } finally {
        setLogsLoading(false);
      }
    },
    [fetchLogs],
  );

  useEffect(() => {
    if (!selected) return;
    const fresh = items.find((i) => i.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [items, selected]);

  function openCreate() {
    setEditing(null);
    setFormTitle('');
    setFormArea(filter === 'todas' ? 'piscina' : filter);
    setFormInterval('7');
    setFormDescription('');
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item: BitacoraItem) {
    setEditing(item);
    setFormTitle(item.title);
    setFormArea(item.area);
    setFormInterval(String(item.interval_days));
    setFormDescription(item.description ?? '');
    setFormError(null);
    setFormOpen(true);
  }

  async function saveForm() {
    const title = formTitle.trim();
    const interval = Number(formInterval);
    if (!title) {
      setFormError('Escribe un título.');
      return;
    }
    if (!Number.isFinite(interval) || interval < 1) {
      setFormError('El intervalo debe ser un número mayor a 0.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateItem(editing.id, {
          title,
          area: formArea,
          interval_days: Math.floor(interval),
          description: formDescription,
        });
        const refreshed = { ...editing, title, area: formArea, interval_days: Math.floor(interval), description: formDescription || null };
        setSelected(refreshed);
      } else {
        await createItem(
          {
            title,
            area: formArea,
            interval_days: Math.floor(interval),
            description: formDescription,
          },
          user?.id,
        );
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function submitRegister() {
    if (!selected || saving) return;
    setSaving(true);
    setActionError(null);
    try {
      await registerDone(selected.id, user?.id, registerNotes);
      const rows = await fetchLogs(selected.id);
      setLogs(rows);
      setRegisterOpen(false);
      setRegisterNotes('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TropicalBackground>
      <ScreenFocusFade style={styles.flex}>
        <KeyboardAwareFlatList
          style={styles.flex}
          data={loading ? [] : visible}
          keyExtractor={(item) => item.id}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={100}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          ListHeaderComponent={
            <View>
              <View style={[styles.head, { paddingTop: insets.top + 8 }]}>
                <WoodLogo size="sm" />
                <FancyTitle size={28} tilt={-5} style={styles.title}>
                  Bitácora
                </FancyTitle>
                <Text style={styles.sub}>Mantenimiento compartido del equipo</Text>
              </View>

              <View style={styles.tabs}>
                <SegmentedControl options={AREA_OPTIONS} value={filter} onChange={setFilter} />
              </View>

              <View style={styles.toolbar}>
                <Pressable onPress={openCreate} style={styles.addBtn}>
                  <Ionicons name="add" size={22} color={colors.white} />
                  <Text style={styles.addBtnText}>Nuevo ítem</Text>
                </Pressable>
              </View>

              {error ? (
                <GlassCard style={{ marginHorizontal: 16, marginBottom: 8 }} padding={12}>
                  <Text style={styles.error}>{error}</Text>
                </GlassCard>
              ) : null}

              {loading ? <ActivityIndicator color={colors.white} style={{ marginTop: 30 }} /> : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={{ padding: 16 }}>
                <GlassCard padding={20}>
                  <Text style={styles.empty}>
                    No hay ítems en esta área. Agrega el primero con «Nuevo ítem».
                  </Text>
                </GlassCard>
              </View>
            )
          }
          renderItem={({ item }) => {
            const status = bitacoraStatus(item);
            const meta = statusMeta(status);
            const next = nextDueAt(item);
            return (
              <Pressable
                onPress={() => openDetail(item)}
                style={{ paddingHorizontal: 16, marginBottom: 10 }}
              >
                <View style={[styles.card, shadow.card]}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.chipText, { color: meta.fg }]}>{meta.label}</Text>
                    </View>
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.areaBadge}>
                      <Text style={styles.areaBadgeText}>{areaLabel(item.area)}</Text>
                    </View>
                    <Text style={styles.interval}>Cada {item.interval_days} d</Text>
                  </View>
                  <Text style={styles.metaLine}>Última vez · {formatDate(item.last_done_at)}</Text>
                  <Text style={styles.metaLine}>
                    Próxima aprox · {next ? formatDate(next) : 'Pendiente de primer registro'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />

        {/* Detail modal */}
        <Modal
          visible={!!selected}
          animationType="slide"
          transparent
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {selected ? (
                <KeyboardScreen bottomPadding={24} extraScrollHeight={120}>
                  <View style={styles.modalHead}>
                    <Text style={styles.modalTitle}>{selected.title}</Text>
                    <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                      <Ionicons name="close" size={24} color={colors.muted} />
                    </Pressable>
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.areaBadge}>
                      <Text style={styles.areaBadgeText}>{areaLabel(selected.area)}</Text>
                    </View>
                    {(() => {
                      const meta = statusMeta(bitacoraStatus(selected));
                      return (
                        <View style={[styles.chip, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.chipText, { color: meta.fg }]}>{meta.label}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  {selected.description ? (
                    <Text style={styles.desc}>{selected.description}</Text>
                  ) : null}
                  <Text style={styles.metaLine}>
                    Intervalo · cada {selected.interval_days} día
                    {selected.interval_days === 1 ? '' : 's'}
                  </Text>
                  <Text style={styles.metaLine}>
                    Última vez · {formatDate(selected.last_done_at)}
                  </Text>
                  <Text style={styles.metaLine}>
                    Próxima aprox ·{' '}
                    {nextDueAt(selected)
                      ? formatDate(nextDueAt(selected)!)
                      : 'Pendiente de primer registro'}
                  </Text>

                  {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => {
                      setRegisterNotes('');
                      setRegisterOpen(true);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Registrar mantenimiento</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={() => openEdit(selected)}>
                    <Ionicons name="create-outline" size={18} color={colors.tealDeep} />
                    <Text style={styles.secondaryBtnText}>Editar ítem</Text>
                  </Pressable>

                  <Text style={styles.sectionLabel}>Historial</Text>
                  {logsLoading ? (
                    <ActivityIndicator color={colors.teal} style={{ marginVertical: 16 }} />
                  ) : logs.length === 0 ? (
                    <Text style={styles.emptySoft}>Aún no hay registros.</Text>
                  ) : (
                    logs.map((log) => (
                      <View key={log.id} style={styles.logRow}>
                        <Ionicons name="water" size={16} color={colors.teal} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logDate}>{formatDateTime(log.done_at)}</Text>
                          {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}
                        </View>
                      </View>
                    ))
                  )}
                </KeyboardScreen>
              ) : null}
            </View>
          </View>
        </Modal>

        {/* Register done modal */}
        <Modal
          visible={registerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRegisterOpen(false)}
        >
          <Pressable style={styles.centerBackdrop} onPress={() => setRegisterOpen(false)}>
            <Pressable style={styles.formSheet} onPress={() => {}}>
              <Text style={styles.formTitle}>Registrar mantenimiento</Text>
              <Text style={styles.formHint}>
                Se marcará como hecho ahora y quedará en el historial.
              </Text>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                value={registerNotes}
                onChangeText={setRegisterNotes}
                placeholder="Ej. cloro 2 ppm, pH 7.4…"
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.input, styles.multiline]}
              />
              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setRegisterOpen(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.okBtn} onPress={submitRegister} disabled={saving}>
                  <Text style={styles.okText}>{saving ? 'Guardando…' : 'Registrar'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Create / edit modal */}
        <Modal
          visible={formOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFormOpen(false)}
        >
          <Pressable style={styles.centerBackdrop} onPress={() => setFormOpen(false)}>
            <Pressable style={styles.formSheet} onPress={() => {}}>
              <Text style={styles.formTitle}>{editing ? 'Editar ítem' : 'Nuevo ítem'}</Text>
              <Text style={styles.label}>Título</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Ej. Retrolavado del filtro"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Text style={styles.label}>Área</Text>
              <View style={styles.chips}>
                {FORM_AREAS.map((opt) => {
                  const active = formArea === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setFormArea(opt.value)}
                      style={[styles.areaChip, active && styles.areaChipActive]}
                    >
                      <Text style={[styles.areaChipText, active && styles.areaChipTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.label}>Intervalo (días)</Text>
              <TextInput
                value={formInterval}
                onChangeText={setFormInterval}
                keyboardType="number-pad"
                placeholder="7"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Detalle o instrucciones…"
                placeholderTextColor={colors.muted}
                multiline
                style={[styles.input, styles.multiline]}
              />
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setFormOpen(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.okBtn} onPress={saveForm} disabled={saving}>
                  <Text style={styles.okText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScreenFocusFade>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: 16 },
  title: { marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 10, marginLeft: 6 },
  tabs: { paddingHorizontal: 16, marginBottom: 10 },
  toolbar: { paddingHorizontal: 16, marginBottom: 10 },
  addBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { color: colors.white, fontFamily: fonts.semiBold, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.semiBold,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  areaBadge: {
    backgroundColor: colors.aquaMist,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  areaBadgeText: { color: colors.tealDeep, fontWeight: '700', fontSize: 12 },
  interval: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  metaLine: { color: colors.muted, fontSize: 13, marginTop: 6 },
  empty: { color: colors.muted, textAlign: 'center' },
  emptySoft: { color: colors.muted, marginTop: 8, marginBottom: 12 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '92%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: fonts.bold,
    fontWeight: '800',
    color: colors.ink,
  },
  desc: { color: colors.ink, marginTop: 10, lineHeight: 20, fontSize: 14 },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: '800',
    color: colors.navy,
    fontSize: 15,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryBtnText: { color: colors.tealDeep, fontWeight: '700', fontSize: 14 },
  logRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  logDate: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  logNotes: { color: colors.muted, marginTop: 2, fontSize: 13, lineHeight: 18 },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  formHint: { color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  label: { color: colors.navy, fontWeight: '700', marginTop: 10, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.skyMist,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.skyMist,
  },
  areaChipActive: { backgroundColor: colors.teal },
  areaChipText: { color: colors.navy, fontWeight: '700', fontSize: 13 },
  areaChipTextActive: { color: colors.white },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.skyMist,
    alignItems: 'center',
  },
  cancelText: { color: colors.navy, fontWeight: '700' },
  okBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
  },
  okText: { color: colors.white, fontWeight: '700' },
});
