import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

export const GITHUB_OWNER = 'Awosemizer';
export const GITHUB_REPO = 'acuatic-paradise-calendario';
export const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
export const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
export const APK_ASSET_NAME = 'AcuaticParadise-Calendario.apk';

export type ApkRelease = {
  tag: string;
  version: string;
  notes: string;
  apkUrl: string;
  htmlUrl: string;
  publishedAt: string | null;
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

export async function downloadAndInstallApk(
  apkUrl: string,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('La instalación automática solo está disponible en Android.');
  }
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) {
    throw new Error('No hay carpeta local disponible para descargar el APK.');
  }
  const dest = `${dir}AcuaticParadise-Calendario-update.apk`;

  try {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  } catch {
    // ignore
  }

  const download = FileSystem.createDownloadResumable(
    apkUrl,
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

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}
