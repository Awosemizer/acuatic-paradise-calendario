import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/src/components/Avatar';
import { KeyboardScreen } from '@/src/components/KeyboardScreen';
import { GlassCard } from '@/src/components/ui';
import { useAuth } from '@/src/context/AuthContext';
import { isAdmin, roleLabel } from '@/src/lib/permissions';
import { supabase } from '@/src/lib/supabase';
import { colors, radius, shadow } from '@/src/theme';
import type { Profile } from '@/src/types';

type Draft = {
  username: string;
  password: string;
  full_name: string;
  job_title: string;
  role: 'staff' | 'admin' | 'ceo';
  can_edit_calendar: boolean;
  can_edit_bitacora: boolean;
  can_edit_tasks: boolean;
};

function emptyDraft(): Draft {
  return {
    username: '',
    password: '',
    full_name: '',
    job_title: '',
    role: 'staff',
    can_edit_calendar: false,
    can_edit_bitacora: false,
    can_edit_tasks: false,
  };
}

export function TeamUsersSection() {
  const { profile, user } = useAuth();
  const admin = isAdmin(profile);
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data as Profile[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate() {
    const username = draft.username.trim().toLowerCase();
    if (!username || !draft.password) {
      Alert.alert('Usuario', 'Usuario y contraseña son obligatorios.');
      return;
    }
    if (draft.password.length < 6) {
      Alert.alert('Contraseña', 'Mínimo 6 caracteres.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.rpc('admin_create_user', {
      p_username: username,
      p_password: draft.password,
      p_full_name: draft.full_name.trim() || username,
      p_job_title: draft.job_title.trim() || null,
      p_role: draft.role,
      p_can_edit_calendar: draft.can_edit_calendar,
      p_can_edit_bitacora: draft.can_edit_bitacora,
      p_can_edit_tasks: draft.can_edit_tasks,
    });
    setSaving(false);
    if (err) {
      Alert.alert('No se pudo crear', err.message);
      return;
    }
    setCreateOpen(false);
    setDraft(emptyDraft());
    void load();
  }

  async function onSaveEdit() {
    if (!editUser) return;
    setSaving(true);
    const { error: err } = await supabase.rpc('admin_update_user', {
      p_user_id: editUser.id,
      p_full_name: editDraft.full_name.trim() || editUser.full_name,
      p_job_title: editDraft.job_title.trim() || null,
      p_role: editDraft.role,
      p_can_edit_calendar: editDraft.can_edit_calendar,
      p_can_edit_bitacora: editDraft.can_edit_bitacora,
      p_can_edit_tasks: editDraft.can_edit_tasks,
      p_is_active: true,
    });
    if (err) {
      setSaving(false);
      Alert.alert('No se pudo guardar', err.message);
      return;
    }
    if (editDraft.password.trim().length >= 6) {
      const { error: pwErr } = await supabase.rpc('admin_set_password', {
        p_user_id: editUser.id,
        p_password: editDraft.password.trim(),
      });
      if (pwErr) {
        setSaving(false);
        Alert.alert('Perfil guardado, pero la contraseña falló', pwErr.message);
        void load();
        return;
      }
    }
    setSaving(false);
    setEditUser(null);
    void load();
  }

  function confirmDelete(row: Profile) {
    if (row.id === user?.id) {
      Alert.alert('No permitido', 'No puedes eliminarte a ti mismo.');
      return;
    }
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a @${row.username || 'usuario'}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await supabase.rpc('admin_delete_user', {
              p_user_id: row.id,
            });
            if (err) Alert.alert('No se pudo eliminar', err.message);
            else void load();
          },
        },
      ],
    );
  }

  function openEdit(row: Profile) {
    const role = String(row.role ?? 'staff').toLowerCase();
    setEditUser(row);
    setEditDraft({
      username: row.username ?? '',
      password: '',
      full_name: row.full_name ?? '',
      job_title: row.job_title ?? '',
      role: role === 'ceo' || role === 'admin' ? (role as 'ceo' | 'admin') : 'staff',
      can_edit_calendar: !!row.can_edit_calendar,
      can_edit_bitacora: !!row.can_edit_bitacora,
      can_edit_tasks: !!row.can_edit_tasks,
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Lista de usuarios del equipo</Text>
      {loading ? <ActivityIndicator color={colors.teal} style={{ marginVertical: 12 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rows.map((row) => {
        const name = row.full_name || row.username || 'Sin nombre';
        const title = row.job_title || roleLabel(row.role);
        return (
          <View key={row.id} style={[styles.row, shadow.card]}>
            <Avatar name={name} uri={row.avatar_url} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              {row.username ? <Text style={styles.username}>@{row.username}</Text> : null}
              <Text style={styles.meta}>{title}</Text>
            </View>
            {admin ? (
              <View style={styles.rowActions}>
                <Pressable onPress={() => openEdit(row)} hitSlop={8}>
                  <Ionicons name="create-outline" size={20} color={colors.tealDeep} />
                </Pressable>
                {row.id !== user?.id ? (
                  <Pressable onPress={() => confirmDelete(row)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}

      {admin ? (
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            setDraft(emptyDraft());
            setCreateOpen(true);
          }}
        >
          <Ionicons name="person-add-outline" size={18} color={colors.white} />
          <Text style={styles.addText}>Agregar usuario</Text>
        </Pressable>
      ) : null}

      <UserFormModal
        visible={createOpen}
        title="Nuevo usuario"
        draft={draft}
        setDraft={setDraft}
        saving={saving}
        showUsername
        onCancel={() => setCreateOpen(false)}
        onSubmit={onCreate}
        submitLabel="Crear"
      />

      <UserFormModal
        visible={!!editUser}
        title="Editar usuario"
        subtitle={editUser?.username ? `@${editUser.username}` : undefined}
        draft={editDraft}
        setDraft={setEditDraft}
        saving={saving}
        showUsername={false}
        passwordOptional
        onCancel={() => setEditUser(null)}
        onSubmit={onSaveEdit}
        submitLabel="Guardar"
      />
    </View>
  );
}

function UserFormModal(props: {
  visible: boolean;
  title: string;
  subtitle?: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  saving: boolean;
  showUsername: boolean;
  passwordOptional?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const {
    visible,
    title,
    subtitle,
    draft,
    setDraft,
    saving,
    showUsername,
    passwordOptional,
    onCancel,
    onSubmit,
    submitLabel,
  } = props;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <GlassCard strong padding={16} style={styles.sheet}>
          <KeyboardScreen bottomPadding={40} extraScrollHeight={140}>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle ? <Text style={styles.username}>{subtitle}</Text> : null}
            {showUsername ? (
              <Field
                label="Usuario"
                value={draft.username}
                onChangeText={(v) => setDraft({ ...draft, username: v })}
                autoCapitalize="none"
              />
            ) : null}
            <Field
              label={passwordOptional ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              value={draft.password}
              onChangeText={(v) => setDraft({ ...draft, password: v })}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label="Nombre"
              value={draft.full_name}
              onChangeText={(v) => setDraft({ ...draft, full_name: v })}
            />
            <Field
              label="Cargo"
              value={draft.job_title}
              onChangeText={(v) => setDraft({ ...draft, job_title: v })}
              placeholder="Ej. Mesero, Recepción…"
            />
            <Text style={styles.label}>Rol</Text>
            <View style={styles.chips}>
              {(['staff', 'admin', 'ceo'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setDraft({ ...draft, role: r })}
                  style={[styles.chip, draft.role === r && styles.chipOn]}
                >
                  <Text style={[styles.chipText, draft.role === r && styles.chipTextOn]}>
                    {roleLabel(r)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {draft.role === 'staff' ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                <Toggle
                  label="Editar calendario"
                  value={draft.can_edit_calendar}
                  onChange={(v) => setDraft({ ...draft, can_edit_calendar: v })}
                />
                <Toggle
                  label="Editar bitácora"
                  value={draft.can_edit_bitacora}
                  onChange={(v) => setDraft({ ...draft, can_edit_bitacora: v })}
                />
                <Toggle
                  label="Editar tareas del equipo"
                  value={draft.can_edit_tasks}
                  onChange={(v) => setDraft({ ...draft, can_edit_tasks: v })}
                />
              </View>
            ) : (
              <Text style={styles.hint}>CEO/Admin tienen todos los permisos.</Text>
            )}
            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.ok} onPress={onSubmit} disabled={saving}>
                <Text style={styles.okText}>{saving ? '…' : submitLabel}</Text>
              </Pressable>
            </View>
          </KeyboardScreen>
        </GlassCard>
      </View>
    </Modal>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize ?? 'sentences'}
        style={styles.input}
      />
    </View>
  );
}

function Toggle(props: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{props.label}</Text>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ true: colors.teal, false: colors.line }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 8 },
  sectionTitle: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.glassStrong,
    borderRadius: radius.lg,
    padding: 12,
  },
  name: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  username: { color: colors.muted, fontSize: 13 },
  meta: { color: colors.tealDeep, fontWeight: '700', fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 12 },
  addBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  error: { color: colors.danger, marginBottom: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: { maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  label: { color: colors.navy, fontWeight: '700', marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: colors.skyMist,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.skyMist,
  },
  chipOn: { backgroundColor: colors.teal },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: colors.white },
  hint: { color: colors.muted, marginTop: 10, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.skyMist,
    alignItems: 'center',
  },
  cancelText: { color: colors.navy, fontWeight: '700' },
  ok: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
  },
  okText: { color: colors.white, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { color: colors.ink, fontWeight: '600', flex: 1, paddingRight: 8 },
});
