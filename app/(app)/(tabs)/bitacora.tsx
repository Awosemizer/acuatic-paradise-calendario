import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareFlatList, KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeTop } from '@/src/hooks/useSafeTop';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateTimeShort } from '@/src/lib/dates';
import { DateTimePickerField } from '@/src/components/DateTimePickerField';
import { RefreshControl } from 'react-native';
import { isAfter } from 'date-fns';
import { useAuth } from '@/src/context/AuthContext';
import { canEditBitacora } from '@/src/lib/permissions';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { KeyboardModalRoot } from '@/src/components/KeyboardModalRoot';
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
  return format(d, 'd MMM yyyy', { locale: es });
}

function formatDateTime(value: string) {
  return formatDateTimeShort(value);
}

export default function BitacoraScreen() {
  const insets = useSafeAreaInsets();
  const safeTop = useSafeTop(8);
  const { user, profile } = useAuth();
  const allowEdit = canEditBitacora(profile);
  const {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItems,
    reload,
    registerDone,
    registerDoneMany,
    fetchLogs,
  } = useBitacora();
  const [filter, setFilter] = useState<BitacoraFilter>('todas');
  const [selected, setSelected] = useState<BitacoraItem | null>(null);
  const [logs, setLogs] = useState<BitacoraLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerNotes, setRegisterNotes] = useState('');
  const [registerBulk, setRegisterBulk] = useState(false);
  const [registerDate, setRegisterDate] = useState('');
  const [registerTime, setRegisterTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BitacoraItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArea, setFormArea] = useState<BitacoraArea>('piscina');
  const [formInterval, setFormInterval] = useState('7');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteBulk, setConfirmDeleteBulk] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = filter === 'todas' ? items : items.filter((i) => i.area === filter);
    return q ? base.filter((i) => i.title.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)) : base;
  }, [items, filter, query]);

  const counts = useMemo(() => {
    let vencido = 0;
    let pronto = 0;
    for (const i of items) {
      const st = bitacoraStatus(i);
      if (st === 'vencido') vencido += 1;
      else if (st === 'pronto') pronto += 1;
    }
    return { vencido, pronto, total: items.length };
  }, [items]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  function openRegister(bulk: boolean) {
    const now = new Date();
    setRegisterBulk(bulk);
    setRegisterNotes('');
    setRegisterDate(format(now, 'yyyy-MM-dd'));
    setRegisterTime(format(now, 'HH:mm'));
    setRegisterOpen(true);
  }

  const selectedCount = selectedIds.size;

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

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function toggleSelectMode() {
    if (selectMode) {
      exitSelectMode();
    } else {
      setSelectMode(true);
      setSelected(null);
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onCardPress(item: BitacoraItem) {
    if (selectMode) {
      toggleId(item.id);
      return;
    }
    void openDetail(item);
  }

  function onCardLongPress(item: BitacoraItem) {
    if (!selectMode) {
      setSelectMode(true);
      setSelected(null);
      setSelectedIds(new Set([item.id]));
      return;
    }
    toggleId(item.id);
  }

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
        const refreshed = {
          ...editing,
          title,
          area: formArea,
          interval_days: Math.floor(interval),
          description: formDescription || null,
        };
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
    if (saving) return;
    const doneAt = registerDate
      ? new Date(`${registerDate}T${registerTime || '12:00'}:00`)
      : new Date();
    if (isAfter(doneAt, new Date(Date.now() + 5 * 60_000))) {
      setActionError('La fecha del registro no puede ser futura.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      if (registerBulk) {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        await registerDoneMany(ids, user?.id, registerNotes, doneAt);
        setRegisterOpen(false);
        setRegisterNotes('');
        setRegisterBulk(false);
        exitSelectMode();
      } else {
        if (!selected) return;
        await registerDone(selected.id, user?.id, registerNotes, doneAt);
        const rows = await fetchLogs(selected.id);
        setLogs(rows);
        setRegisterOpen(false);
        setRegisterNotes('');
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  }

  async function confirmBulkDelete() {
    setSaving(true);
    setActionError(null);
    try {
      await deleteItems(Array.from(selectedIds));
      setConfirmDeleteBulk(false);
      exitSelectMode();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo eliminar');
      setConfirmDeleteBulk(false);
    } finally {
      setSaving(false);
    }
  }

  function closeDetail() {
    setSelected(null);
    setActionError(null);
  }

  return (
    <TropicalBackground>
      <ScreenFocusFade style={styles.flex}>
        <KeyboardAwareFlatList
          style={styles.flex}
          data={loading ? [] : visible}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} colors={[colors.teal]} />}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={100}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: 120 + insets.bottom + (selectedCount > 0 ? 72 : 0),
          }}
          ListHeaderComponent={
            <View>
              <View style={[styles.head, { paddingTop: safeTop }]}>
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
                {allowEdit ? (
                  <Pressable onPress={openCreate} style={styles.addBtn}>
                    <Ionicons name="add" size={22} color={colors.white} />
                    <Text style={styles.addBtnText}>Nuevo ítem</Text>
                  </Pressable>
                ) : null}
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
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{counts.total} ítems</Text>
                {counts.vencido ? <Text style={[styles.summaryText, { color: colors.coralSoft }]}>{counts.vencido} vencidos</Text> : null}
                {counts.pronto ? <Text style={[styles.summaryText, { color: colors.gold }]}>{counts.pronto} pronto</Text> : null}
              </View>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={colors.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar en bitácora…"
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                />
                {query ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              {selectMode ? (
                <Text style={styles.selectHint}>
                  Mantén pulsada una tarjeta o tócala para marcar varias. Así puedes registrar o
                  administrar varias a la vez.
                </Text>
              ) : null}

              {error ? (
                <GlassCard style={{ marginHorizontal: 16, marginBottom: 8 }} padding={12}>
                  <Text style={styles.error}>{error}</Text>
                </GlassCard>
              ) : null}

              {actionError && !selected ? (
                <GlassCard style={{ marginHorizontal: 16, marginBottom: 8 }} padding={12}>
                  <Text style={styles.error}>{actionError}</Text>
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
            const checked = selectedIds.has(item.id);
            return (
              <Pressable
                onPress={() => onCardPress(item)}
                onLongPress={() => onCardLongPress(item)}
                delayLongPress={350}
                style={{ paddingHorizontal: 16, marginBottom: 10 }}
              >
                <View
                  style={[
                    styles.card,
                    shadow.card,
                    checked && styles.cardSelected,
                    selectMode && styles.cardSelectMode,
                  ]}
                >
                  <View style={styles.cardTop}>
                    {selectMode ? (
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked ? (
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        ) : null}
                      </View>
                    ) : null}
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

        {selectedCount > 0 ? (
          <View style={[styles.bulkBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Text style={styles.bulkCount}>
              {selectedCount === 1 ? '1 seleccionado' : `${selectedCount} seleccionados`}
            </Text>
            <View style={styles.bulkActions}>
              {allowEdit ? (
                <Pressable
                  style={styles.bulkPrimary}
                  onPress={() => openRegister(true)}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                  <Text style={styles.bulkPrimaryText}>Registrar</Text>
                </Pressable>
              ) : null}
              {allowEdit ? (
                <Pressable style={styles.bulkDanger} onPress={() => setConfirmDeleteBulk(true)}>
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

        {/* Detail modal — sheet sizes to content (no flex:1 collapse) */}
        <Modal
          visible={!!selected}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={closeDetail}
        >
          <KeyboardModalRoot style={styles.modalRoot}>
            <Pressable style={styles.backdropPress} onPress={closeDetail} accessibilityRole="button" />
            <View style={styles.sheet} pointerEvents="box-none">
              <View style={[styles.sheetInner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                {selected ? (
                  <KeyboardScreen
                    fill={false}
                    bottomPadding={24}
                    extraScrollHeight={120}
                    style={styles.sheetScroll}
                    contentContainerStyle={styles.sheetContent}
                  >
                    <View style={styles.modalHead}>
                      <Text style={styles.modalTitle}>{selected.title}</Text>
                      <Pressable onPress={closeDetail} hitSlop={10}>
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

                    {allowEdit ? (
                      <Pressable
                        style={styles.primaryBtn}
                        onPress={() => openRegister(false)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                        <Text style={styles.primaryBtnText}>Registrar mantenimiento</Text>
                      </Pressable>
                    ) : null}
                    {allowEdit ? (
                      <Pressable style={styles.secondaryBtn} onPress={() => openEdit(selected)}>
                        <Ionicons name="create-outline" size={18} color={colors.tealDeep} />
                        <Text style={styles.secondaryBtnText}>Editar ítem</Text>
                      </Pressable>
                    ) : null}

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
          </KeyboardModalRoot>
        </Modal>

        {/* Register done modal */}
        <Modal
          visible={registerOpen}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => {
            setRegisterOpen(false);
            setRegisterBulk(false);
          }}
        >
          <KeyboardModalRoot style={styles.modalRoot}>
            <Pressable
              style={styles.backdropPress}
              onPress={() => {
                setRegisterOpen(false);
                setRegisterBulk(false);
              }}
            />
            <View style={styles.sheet} pointerEvents="box-none">
              <View style={styles.sheetInner}>
                <KeyboardScreen
                  fill={false}
                  bottomPadding={28}
                  extraScrollHeight={140}
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                >
                  <Text style={styles.formTitle}>
                    {registerBulk
                      ? `Registrar mantenimiento (${selectedCount})`
                      : 'Registrar mantenimiento'}
                  </Text>
                  <Text style={styles.formHint}>
                    {registerBulk
                      ? 'Se marcarán todos los ítems elegidos como hechos. Las notas (opcionales) se aplican a todos.'
                      : 'Quedará en el historial. Cambia la fecha si se hizo antes.'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1.35 }}>
                      <DateTimePickerField label="Fecha" mode="date" value={registerDate} onChange={setRegisterDate} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DateTimePickerField label="Hora" mode="time" value={registerTime} onChange={setRegisterTime} />
                    </View>
                  </View>
                  {actionError && registerOpen ? <Text style={styles.error}>{actionError}</Text> : null}
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
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => {
                        setRegisterOpen(false);
                        setRegisterBulk(false);
                      }}
                    >
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={styles.okBtn} onPress={submitRegister} disabled={saving}>
                      <Text style={styles.okText}>{saving ? 'Guardando…' : 'Registrar'}</Text>
                    </Pressable>
                  </View>
                </KeyboardScreen>
              </View>
            </View>
          </KeyboardModalRoot>
        </Modal>

        {/* Create / edit modal */}
        <Modal
          visible={formOpen}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => setFormOpen(false)}
        >
          <KeyboardModalRoot style={styles.modalRoot}>
            <Pressable style={styles.backdropPress} onPress={() => setFormOpen(false)} />
            <View style={styles.sheet} pointerEvents="box-none">
              <View style={styles.sheetInner}>
                <KeyboardScreen
                  fill={false}
                  bottomPadding={28}
                  extraScrollHeight={140}
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                >
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
                </KeyboardScreen>
              </View>
            </View>
          </KeyboardModalRoot>
        </Modal>

        <ConfirmDialog
          visible={confirmDeleteBulk}
          title="¿Eliminar seleccionados?"
          message={
            selectedCount === 1
              ? 'Se quitará este ítem de la bitácora. El historial se conserva.'
              : `Se quitarán ${selectedCount} ítems de la bitácora. El historial se conserva.`
          }
          confirmLabel="Eliminar"
          destructive
          onCancel={() => setConfirmDeleteBulk(false)}
          onConfirm={() => {
            void confirmBulkDelete();
          }}
        />
      </ScreenFocusFade>
    </TropicalBackground>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 18, marginBottom: 8 },
  summaryText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.glass,
    borderRadius: 999,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 15, color: '#0B1F3A' },
  flex: { flex: 1 },
  head: { paddingHorizontal: 16 },
  title: { marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 10, marginLeft: 6 },
  tabs: { paddingHorizontal: 16, marginBottom: 10 },
  toolbar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
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
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  selectBtnOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  selectBtnText: { color: colors.tealDeep, fontWeight: '800', fontSize: 13 },
  selectBtnTextOn: { color: colors.white },
  selectHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardSelectMode: { paddingLeft: 12 },
  cardSelected: {
    borderColor: colors.teal,
    backgroundColor: 'rgba(20,196,200,0.18)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.tealDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.teal, borderColor: colors.teal },
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
  modalRoot: { flex: 1, justifyContent: 'center' },
  backdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11,31,58,0.55)',
  },
  sheet: {
    maxHeight: '90%',
    width: '92%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  sheetInner: {
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    maxHeight: '100%',
    ...shadow.card,
  },
  sheetScroll: { flexGrow: 0 },
  sheetContent: { padding: 16, paddingBottom: 20 },
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
    backgroundColor: colors.white,
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
