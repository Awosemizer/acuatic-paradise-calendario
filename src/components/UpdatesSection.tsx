import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  compareSemver,
  downloadAndInstallApk,
  fetchLatestApkRelease,
  getAppVersion,
  RELEASES_PAGE,
  type ApkRelease,
} from '@/src/lib/appUpdates';
import { colors, radius, shadow } from '@/src/theme';
import { GlassCard } from '@/src/components/ui';

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'upToDate' }
  | { kind: 'available'; release: ApkRelease }
  | { kind: 'downloading'; progress: number }
  | { kind: 'installing' }
  | { kind: 'error'; message: string };

export function UpdatesSection() {
  const version = getAppVersion();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const openReleases = useCallback(() => {
    Linking.openURL(RELEASES_PAGE).catch(() => {});
  }, []);

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
      await downloadAndInstallApk(release.apkUrl, (ratio) => {
        setStatus({ kind: 'downloading', progress: ratio });
      });
      setStatus({ kind: 'installing' });
    } catch (e) {
      setStatus({
        kind: 'error',
        message:
          e instanceof Error
            ? e.message
            : 'No se pudo descargar o instalar el APK. Revisa el permiso de instalar apps desconocidas.',
      });
    }
  }, []);

  const isWeb = Platform.OS === 'web';

  return (
    <GlassCard padding={18} style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="cloud-download-outline" size={22} color={colors.tealDeep} />
        <Text style={styles.title}>Actualizaciones</Text>
      </View>
      <Text style={styles.version}>Versión instalada: {version}</Text>

      {isWeb ? (
        <>
          <Text style={styles.hint}>
            En la web no se instalan APKs. Revisa los releases en GitHub para descargar la app
            Android.
          </Text>
          <Pressable onPress={openReleases} style={[styles.btn, styles.btnSecondary]}>
            <Ionicons name="open-outline" size={18} color={colors.tealDeep} />
            <Text style={styles.btnSecondaryText}>Ver releases en GitHub</Text>
          </Pressable>
        </>
      ) : (
        <>
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

          {status.kind === 'error' ? <Text style={styles.err}>{status.message}</Text> : null}
        </>
      )}
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
  btnSecondary: {
    backgroundColor: colors.aquaMist,
    borderWidth: 1,
    borderColor: 'rgba(15,168,168,0.35)',
  },
  btnSecondaryText: { color: colors.tealDeep, fontWeight: '800', fontSize: 14 },
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
