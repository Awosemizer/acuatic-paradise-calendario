import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';

export type FontSizeId = 'sm' | 'md' | 'lg' | 'xl';
export type AccentId = 'turquesa' | 'oceano' | 'coral' | 'flamenco' | 'palmera';
export type StartView = 'day' | 'week' | 'month';
export type TabletMode = 'auto' | 'always' | 'never';

export type AppSettings = {
  fontSize: FontSizeId;
  accent: AccentId;
  weekStartsOn: 0 | 1;
  startView: StartView;
  reminders: boolean;
  reminderMinutes: number;
  bitacoraAlerts: boolean;
  showCompleted: boolean;
  confirmDeletes: boolean;
  tabletMode: TabletMode;
};

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'md',
  accent: 'turquesa',
  weekStartsOn: 1,
  startView: 'day',
  reminders: true,
  reminderMinutes: 30,
  bitacoraAlerts: true,
  showCompleted: true,
  confirmDeletes: true,
  tabletMode: 'auto',
};

export const FONT_SCALES: Record<FontSizeId, number> = { sm: 0.9, md: 1, lg: 1.15, xl: 1.3 };

type AccentPalette = { teal: string; tealDeep: string; aqua: string; aquaLight: string; aquaMist: string };

const BASE_ACCENT: AccentPalette = {
  teal: '#0FA8A8',
  tealDeep: '#0B7C8A',
  aqua: '#14C4C8',
  aquaLight: '#5EE8EC',
  aquaMist: '#D9FBFC',
};

export const ACCENTS: Record<AccentId, { label: string; palette: AccentPalette }> = {
  turquesa: { label: 'Turquesa', palette: BASE_ACCENT },
  oceano: {
    label: 'Océano',
    palette: { teal: '#2B7BBF', tealDeep: '#1D5F99', aqua: '#4CA3E0', aquaLight: '#8CCBF2', aquaMist: '#E3F1FB' },
  },
  coral: {
    label: 'Coral',
    palette: { teal: '#F2643F', tealDeep: '#C9482A', aqua: '#FF7F5C', aquaLight: '#FFB39E', aquaMist: '#FFEDE7' },
  },
  flamenco: {
    label: 'Flamenco',
    palette: { teal: '#E84B8A', tealDeep: '#B8336A', aqua: '#F06BA0', aquaLight: '#F7B6D4', aquaMist: '#FDE9F2' },
  },
  palmera: {
    label: 'Palmera',
    palette: { teal: '#2FA36B', tealDeep: '#1F7A4F', aqua: '#3CC283', aquaLight: '#8FE3B9', aquaMist: '#E2F8EC' },
  },
};

const KEY = 'ap.settings.v1';

let current: AppSettings = { ...DEFAULT_SETTINGS };
let version = 0;
let colorMap: Record<string, string> = {};
const listeners = new Set<() => void>();

export function getSettings() {
  return current;
}
export function getStyleVersion() {
  return version;
}
export function getFontScale() {
  return FONT_SCALES[current.fontSize] ?? 1;
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const RGBA_RE = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i;
export function mapColor(value: string) {
  const direct = colorMap[value.toUpperCase()];
  if (direct) return direct;
  const m = RGBA_RE.exec(value);
  if (m) {
    const mapped = rgbaMap[`${m[1]},${m[2]},${m[3]}`];
    if (mapped) return `rgba(${mapped},${m[4]})`;
  }
  return value;
}
/** Current accent colour with alpha, e.g. accentAlpha('aqua', 0.18). */
export function accentAlpha(key: keyof AccentPalette, alpha: number) {
  const pal = ACCENTS[current.accent]?.palette ?? BASE_ACCENT;
  return `rgba(${hexToRgb(pal[key]).join(',')},${alpha})`;
}
let rgbaMap: Record<string, string> = {};

function applyTheme() {
  const pal = ACCENTS[current.accent]?.palette ?? BASE_ACCENT;
  colorMap = {};
  rgbaMap = {};
  (Object.keys(BASE_ACCENT) as (keyof AccentPalette)[]).forEach((k) => {
    if (BASE_ACCENT[k] !== pal[k]) {
      colorMap[BASE_ACCENT[k].toUpperCase()] = pal[k];
      rgbaMap[hexToRgb(BASE_ACCENT[k]).join(',')] = hexToRgb(pal[k]).join(',');
    }
    (colors as Record<string, string>)[k] = pal[k];
  });
  (colors as Record<string, string>).visit = pal.aqua;
  version += 1;
}

function readSync(): Partial<AppSettings> | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Web: apply synchronously before first render.
const initial = readSync();
if (initial) current = { ...DEFAULT_SETTINGS, ...initial };
applyTheme();

export async function loadSettings() {
  if (Platform.OS === 'web') return current;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      current = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      applyTheme();
    }
  } catch {
    /* defaults */
  }
  return current;
}

export async function saveSettings(patch: Partial<AppSettings>) {
  current = { ...current, ...patch };
  applyTheme();
  listeners.forEach((l) => l());
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  return current;
}

export function subscribeSettings(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
