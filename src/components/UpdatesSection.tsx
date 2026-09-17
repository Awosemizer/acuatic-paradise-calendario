import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  clearPendingApkInstall,
  compareSemver,
  continuePendingApkInstall,
  downloadAndInstallApk,
  fetchLatestApkRelease,
  getAppVersion,
  getPendingApkInstall,
  openUnknownAppSourcesSettings,
  watchPendingApkInstallOnResume,
  type ApkRelease,
  type PendingApkInstall,
} from '@/src/lib/appUpdates';
import { colors, radius, shadow } from '@/src/theme';
import { GlassCard } from '@/src/components/ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'upToDate' }
  | { kind: 'available'; release: ApkRelease }
  | { kind: 'downloading'; progress: number }
  | { kind: 'installing'; pending: PendingApkInstall }
  | { kind: 'permissionNeeded'; pending: PendingApkInstall }
  | { kind: 'error'; message: string };

export function UpdatesSection() {
  const version = getAppVersion();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const restorePending = useCallback(async () => {
    const pending = await getPendingApkInstall();
    if (!pending) return;
    // If we already installed a newer/same version, clear stale pending.
    if (compareSemver(version, pending.version) >= 0) {
      await clearPendingApkInstall();
      return;
    }
    setStatus({ kind: 'permissionNeeded', pending });
  }, [version]);

  useEffect(() => {
    void restorePending();
  }, [restorePending]);

  useEffect(() => {
    return watchPendingApkInstallOnResume((pending) => {
      if (compareSemver(version, pending.version) >= 0) {
        void clearPendingApkInstall();
        return;
      }
      setStatus({ kind: 'permissionNeeded', pending });
    });
  }, [version]);

  const check = useCallback(async () => {
    setStatus({ kind: 'checking' });
    try {
      const latest = await fetchLatestApkRelease();
      if (!latest) {
        setStatus({
          kind: 'error',
          message: 'No se encontró un release APK en GitHub.',
        });
        return;
      }
      if (compareSemver(latest.version, version) > 0) {
        setStatus({ kind: 'available', release: latest });
      } else {
        await clearPendingApkInstall();
        setStatus({ kind: 'upToDate' });
      }
    } catch (e) {
      setStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Error al buscar actualizaciones.',
      });
    }
  }, [version]);

  const install = useCallback(async (release: ApkRelease) => {
    setStatus({ kind: 'downloading', progress: 0 });
    try {
      const pending = await downloadAndInstallApk(release, (ratio) => {
        setStatus({ kind: 'downloading', progress: ratio });
      });
      setStatus({ kind: 'permissionNeeded', pending });
    } catch (e) {
      const pending = await getPendingApkInstall();
      if (pending) {
        setStatus({ kind: 'permissionNeeded', pending });
        return;
      }
      setStatus({
        kind: 'error',
        message:
          e instanceof Error
            ? e.message
            : 'No se pudo descargar o instalar el APK. Revisa el permiso de instalar apps desconocidas.',
      });
    }
  }, []);

  const continueInstall = useCallback(async (openSettingsFirst = false) => {
    try {
      const pending = await continuePendingApkInstall({ openSettingsFirst });
      if (!pending) {
        setStatus({ kind: 'idle' });
        return;
      }
      setStatus({ kind: 'installing', pending });
      // After launching installer, keep permissionNeeded UI so user can retry.
      setTimeout(() => {
        setStatus((s) =>
          s.kind === 'installing' ? { kind: 'permissionNeeded', pending: s.pending } : s,
        );
      }, 800);
    } catch (e) {
      const pending = await getPendingApkInstall();
      if (pending) {
        setStatus({ kind: 'permissionNeeded', pending });
      } else {
        setStatus({
          kind: 'error',
          message:
            e instanceof Error
              ? e.message
              : 'No se pudo continuar la instalación.',
        });
      }
    }
  }, []);

  const cancelPending = useCallback(async () => {
    await clearPendingApkInstall();
    setStatus({ kind: 'idle' });
  }, []);

  // Actualizaciones is Android/APK only — never show on web.
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <GlassCard padding={18} style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="cloud-download-outline" size={22} color={colors.tealDeep} />
        <Text style={styles.title}>Actualizaciones</Text>
      </View>
      <Text style={styles.version}>Versión instalada: {version}</Text>

      {status.kind === 'idle' || status.kind === 'upToDate' || status.kind === 'error' ? (
        <Pressable onPress={check} style={[styles.btn, styles.btnPrimary]}>
          <Ionicons name="refresh" size={18} color={colors.white} />
          <Text style={styles.btnPrimaryText}>Buscar actualizaciones</Text>
        </Pressable>
      ) : null}

      {status.kind === 'checking' ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.hint}>Buscando en GitHub…</Text>
        </View>
      ) : null}

      {status.kind === 'upToDate' ? (
        <Text style={styles.ok}>Ya tienes la última versión.</Text>
      ) : null}

      {status.kind === 'available' ? (
        <View style={styles.available}>
          <Text style={styles.newVer}>Nueva versión: {status.release.version}</Text>
          {status.release.notes ? (
            <Text style={styles.notes} numberOfLines={8}>
              {status.release.notes}
            </Text>
          ) : null}
          <Pressable
            onPress={() => install(status.release)}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Ionicons name="download-outline" size={18} color={colors.white} />
            <Text style={styles.btnPrimaryText}>Descargar e instalar</Text>
          </Pressable>
        </View>
      ) : null}

      {status.kind === 'downloading' ? (
        <View style={styles.progressWrap}>
          <Text style={styles.hint}>
            Descargando… {Math.round(status.progress * 100)}%
          </Text>
          <View style={styles.barBg}>
            <View
              style={[styles.barFill, { width: `${Math.round(status.progress * 100)}%` }]}
            />
          </View>
        </View>
      ) : null}

      {status.kind === 'installing' ? (
        <Text style={styles.hint}>
          Abriendo el instalador de Android… Confirma la instalación cuando aparezca.
        </Text>
      ) : null}

      {status.kind === 'permissionNeeded' ? (
        <View style={styles.available}>
          <Text style={styles.warnTitle}>Permiso necesario</Text>
          <Text style={styles.hint}>
            Versión {status.pending.version} ya descargada. Si Android pidió permitir
            «instalar apps desconocidas», actívalo y vuelve aquí — o toca Continuar
            instalación. No hace falta volver a descargar.
          </Text>
          <Pressable
            onPress={() => continueInstall(false)}
            style={[styles.btn, styles.btnPrimary]}
          >
            <Ionicons name="construct-outline" size={18} color={colors.white} />
            <Text style={styles.btnPrimaryText}>Continuar instalación</Text>
          </Pressable>
          <Pressable
            onPress={() => void openUnknownAppSourcesSettings()}
            style={[styles.btn, styles.btnSecondary]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.navy} />
            <Text style={styles.btnSecondaryText}>Abrir permiso de instalación</Text>
          </Pressable>
          <Pressable onPress={cancelPending} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancelar instalación pendiente</Text>
          </Pressable>
        </View>
      ) : null}

      {status.kind === 'error' ? <Text style={styles.err}>{status.message}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontWeight: '800', fontSize: 16, color: colors.navy },
  version: { color: colors.muted, fontSize: 14, marginBottom: 12 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 10, flexShrink: 1 },
  ok: { color: colors.success, fontWeight: '700', marginTop: 8 },
  err: { color: colors.danger, marginTop: 8, fontSize: 13, lineHeight: 18 },
  warnTitle: { fontWeight: '800', color: colors.coral, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  available: { gap: 10 },
  newVer: { fontWeight: '800', color: colors.tealDeep, fontSize: 15 },
  notes: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...shadow.card,
  },
  btnPrimary: { backgroundColor: colors.teal },
  btnPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  btnSecondary: { backgroundColor: colors.skyMist },
  btnSecondaryText: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  cancelLink: { alignItems: 'center', paddingVertical: 4 },
  cancelLinkText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  progressWrap: { marginTop: 4, gap: 8 },
  barBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
});
