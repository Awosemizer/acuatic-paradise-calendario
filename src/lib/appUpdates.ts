import { AppState, Linking, Platform, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

export const GITHUB_OWNER = 'Awosemizer';
export const GITHUB_REPO = 'acuatic-paradise-calendario';
export const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
export const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
export const APK_ASSET_NAME = 'AcuaticParadise-Calendario.apk';

const PENDING_KEY = '@acuatic/pending-apk-install';
const APK_FILE_NAME = 'AcuaticParadise-Calendario-update.apk';

export type ApkRelease = {
  tag: string;
  version: string;
  notes: string;
  apkUrl: string;
  htmlUrl: string;
  publishedAt: string | null;
};

export type PendingApkInstall = {
  fileUri: string;
  apkUrl: string;
  version: string;
  tag: string;
  notes: string;
  htmlUrl: string;
  savedAt: string;
};

function stripTag(tag: string) {
  return tag.replace(/^v/i, '').replace(/-apk$/i, '');
}

export function parseSemver(version: string): [number, number, number] | null {
  const m = stripTag(version).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function getAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    Constants.manifest2?.extra?.expoClient?.version ??
    '0.0.0'
  );
}

export function getAndroidPackageId(): string {
  return Constants.expoConfig?.android?.package ?? 'mx.acuaticparadise.calendario';
}

function apkDestPath(): string {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('No hay carpeta local disponible para descargar el APK.');
  }
  return `${dir}${APK_FILE_NAME}`;
}

export async function fetchLatestApkRelease(): Promise<ApkRelease | null> {
  const res = await fetch(RELEASES_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'AcuaticParadise-Calendario',
    },
  });
  if (!res.ok) {
    throw new Error(`No se pudo consultar GitHub (${res.status}).`);
  }
  const releases = (await res.json()) as Array<{
    tag_name: string;
    body?: string | null;
    html_url: string;
    published_at?: string | null;
    draft?: boolean;
    prerelease?: boolean;
    assets?: Array<{ name: string; browser_download_url: string }>;
  }>;

  let best: ApkRelease | null = null;
  for (const rel of releases) {
    if (rel.draft) continue;
    const tag = rel.tag_name ?? '';
    if (!/-apk$/i.test(tag)) continue;
    const version = stripTag(tag);
    if (!parseSemver(version)) continue;
    const asset = (rel.assets ?? []).find((a) => a.name === APK_ASSET_NAME);
    if (!asset?.browser_download_url) continue;
    const candidate: ApkRelease = {
      tag,
      version,
      notes: (rel.body ?? '').trim(),
      apkUrl: asset.browser_download_url,
      htmlUrl: rel.html_url,
      publishedAt: rel.published_at ?? null,
    };
    if (!best || compareSemver(candidate.version, best.version) > 0) {
      best = candidate;
    }
  }
  return best;
}

export async function getPendingApkInstall(): Promise<PendingApkInstall | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingApkInstall;
    if (!parsed?.fileUri) return null;
    const info = await FileSystem.getInfoAsync(parsed.fileUri);
    if (!info.exists) {
      await clearPendingApkInstall();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function savePendingApkInstall(pending: PendingApkInstall): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export async function clearPendingApkInstall(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

/** Opens Android settings so the user can allow installs from this app. */
export async function openUnknownAppSourcesSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const pkg = getAndroidPackageId();
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES,
      { data: `package:${pkg}` },
    );
  } catch {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${pkg}` },
      );
    } catch {
      try {
        await Linking.openSettings();
      } catch {
        // ignore
      }
    }
  }
}

/** Launch the package installer for a local APK file URI. */
export async function launchApkInstaller(fileUri: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('La instalación automática solo está disponible en Android.');
  }
  const contentUri = await FileSystem.getContentUriAsync(fileUri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}

/**
 * Re-fire install for a previously downloaded APK (no re-download).
 * Optionally open unknown-sources settings first.
 */
export async function continuePendingApkInstall(options?: {
  openSettingsFirst?: boolean;
}): Promise<PendingApkInstall | null> {
  const pending = await getPendingApkInstall();
  if (!pending) return null;
  if (options?.openSettingsFirst) {
    await openUnknownAppSourcesSettings();
  }
  await launchApkInstaller(pending.fileUri);
  return pending;
}

/**
 * Download APK to a stable cache path, persist pending install metadata,
 * then open the Android package installer (VIEW intent).
 * If the installer cannot start (often missing "instalar apps desconocidas"),
 * opens MANAGE_UNKNOWN_APP_SOURCES and keeps pending so the user can continue.
 */
export async function downloadAndInstallApk(
  release: ApkRelease,
  onProgress?: (ratio: number) => void,
): Promise<PendingApkInstall> {
  if (Platform.OS !== 'android') {
    throw new Error('La instalación automática solo está disponible en Android.');
  }
  const dest = apkDestPath();

  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch {
    // ignore
  }

  const download = FileSystem.createDownloadResumable(
    release.apkUrl,
    dest,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite;
      if (total > 0 && onProgress) {
        onProgress(progress.totalBytesWritten / total);
      }
    },
  );

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error('La descarga del APK falló.');
  }

  const pending: PendingApkInstall = {
    fileUri: result.uri,
    apkUrl: release.apkUrl,
    version: release.version,
    tag: release.tag,
    notes: release.notes,
    htmlUrl: release.htmlUrl,
    savedAt: new Date().toISOString(),
  };
  await savePendingApkInstall(pending);

  try {
    await launchApkInstaller(result.uri);
  } catch {
    // Likely needs unknown-sources permission — guide the user there.
    try {
      await openUnknownAppSourcesSettings();
    } catch {
      // ignore
    }
  }

  return pending;
}

/**
 * When the app resumes and a pending APK still exists, re-launch the installer once
 * (debounced). Returns an unsubscribe function.
 */
export function watchPendingApkInstallOnResume(
  onPending: (pending: PendingApkInstall) => void,
): () => void {
  if (Platform.OS !== 'android') return () => undefined;

  let lastFiredAt = 0;
  const DEBOUNCE_MS = 2500;

  const handler = (next: AppStateStatus) => {
    if (next !== 'active') return;
    const now = Date.now();
    if (now - lastFiredAt < DEBOUNCE_MS) return;
    lastFiredAt = now;
    void (async () => {
      const pending = await getPendingApkInstall();
      if (!pending) return;
      onPending(pending);
      try {
        await launchApkInstaller(pending.fileUri);
      } catch {
        // Still blocked — UI offers Continuar instalación / abrir permiso.
      }
    })();
  };

  const sub = AppState.addEventListener('change', handler);
  return () => sub.remove();
}
