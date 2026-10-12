import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';

export type FontSizeId = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
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
  highContrast: boolean;
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
  highContrast: false,
};

export const FONT_SCALES: Record<FontSizeId, number> = { sm: 0.92, md: 1, lg: 1.15, xl: 1.3, xxl: 1.65 };

type AccentPalette = { teal: string; tealDeep: string; aqua: string; aquaLight: string; aquaMist: string };

const BASE_ACCENT: AccentPalette = {
  teal: '#0A7F86',
  tealDeep: '#08636D',
  aqua: '#14C4C8',
  aquaLight: '#5EE8EC',
  aquaMist: '#D9FBFC',
};

export const ACCENTS: Record<AccentId, { label: string; palette: AccentPalette }> = {
  turquesa: { label: 'Turquesa', palette: BASE_ACCENT },
  oceano: {
    label: 'Océano',
    palette: { teal: '#1F6BAE', tealDeep: '#174F82', aqua: '#4CA3E0', aquaLight: '#8CCBF2', aquaMist: '#E3F1FB' },
  },
  coral: {
    label: 'Coral',
    palette: { teal: '#C2452A', tealDeep: '#9E3520', aqua: '#FF7F5C', aquaLight: '#FFB39E', aquaMist: '#FFEDE7' },
  },
  flamenco: {
    label: 'Flamenco',
    palette: { teal: '#C2306E', tealDeep: '#962456', aqua: '#F06BA0', aquaLight: '#F7B6D4', aquaMist: '#FDE9F2' },
  },
  palmera: {
    label: 'Palmera',
    palette: { teal: '#1E7D52', tealDeep: '#17603F', aqua: '#3CC283', aquaLight: '#8FE3B9', aquaMist: '#E2F8EC' },
  },
};

const CORAL_EVENT = { event: '#E5532F', deep: '#B83A1F', mist: '#FFF0EB' };
export const EVENT_COLORS: Record<AccentId, { event: string; deep: string; mist: string }> = {
  turquesa: CORAL_EVENT,
  oceano: CORAL_EVENT,
  coral: { event: '#7C5CE0', deep: '#5136B0', mist: '#EFEAFD' },
  flamenco: { event: '#E08A00', deep: '#8F4A04', mist: '#FEF3D6' },
  palmera: CORAL_EVENT,
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
export function isHighContrast() {
  return !!current.highContrast;
}
export function isHugeFont() {
  return current.fontSize === 'xxl';
}
export function getFontScale() {
  return FONT_SCALES[current.fontSize] ?? 1;
}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const RGBA_RE = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i;
export function mapColor(value: string, key?: string) {
  if (current.highContrast) {
    const hc = mapHC(value, key);
    if (hc) return hc;
  }
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

const HC_TEXT: Record<string, string> = {
  '#5C6B7A': '#1A2533',
  '#4A5866': '#1A2533',
  '#A9B6C2': '#3A4756',
  '#A8B6C3': '#4A5866',
  '#7D8A97': '#3A4756',
  '#D5E3EE': '#5C6B7A',
};
/** Alto contraste: opaque surfaces, darker secondary text, stronger borders. */
function mapHC(value: string, key?: string): string | null {
  const up = value.toUpperCase();
  const m = RGBA_RE.exec(value);
  if (m) {
    const rgb = `${m[1]},${m[2]},${m[3]}`;
    const a = parseFloat(m[4]);
    if (rgb === '255,255,255') {
      if (key === 'color') return '#FFFFFF';
      if (key === 'backgroundColor' && a >= 0.4) return '#FFFFFF';
      if (key && key.startsWith('border')) return a >= 0.3 ? '#FFFFFF' : null;
    }
    if (rgb === '11,31,58' && key === 'backgroundColor' && a >= 0.3) return '#0B1F3A';
    return null;
  }
  if (key === 'color' || key === undefined) return HC_TEXT[up] ?? null;
  if (key && key.startsWith('border') && up === '#D5E3EE') return '#5C6B7A';
  return null;
}

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
  // Events always get a hue that contrasts with the accent (visits follow the accent).
  const ev = EVENT_COLORS[current.accent] ?? EVENT_COLORS.turquesa;
  (colors as Record<string, string>).event = ev.event;
  (colors as Record<string, string>).eventDeep = ev.deep;
  (colors as Record<string, string>).eventMist = ev.mist;
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
