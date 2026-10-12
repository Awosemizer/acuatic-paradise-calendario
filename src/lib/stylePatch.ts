/**
 * Makes every StyleSheet.create() result theme-aware (font scale + accent colour)
 * without touching each screen. Must be imported before any other module (see index.js).
 */
import { StyleSheet } from 'react-native';
import { getFontScale, getStyleVersion, mapColor } from '@/src/lib/settingsStore';

const COLOR_KEYS = new Set([
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'shadowColor',
  'tintColor',
  'textDecorationColor',
]);

function transform(style: Record<string, unknown>) {
  const scale = getFontScale();
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(style)) {
    const v = style[key];
    if (scale !== 1 && (key === 'fontSize' || key === 'lineHeight') && typeof v === 'number') {
      out[key] = Math.round(v * scale * 10) / 10;
    } else if (COLOR_KEYS.has(key) && typeof v === 'string') {
      out[key] = mapColor(v);
    } else {
      out[key] = v;
    }
  }
  return out;
}

const original = StyleSheet.create;
const patched = function create<T extends Record<string, unknown>>(styles: T): T {
  const result = {} as Record<string, unknown>;
  for (const key of Object.keys(styles)) {
    const raw = styles[key];
    if (raw == null || typeof raw !== 'object') {
      result[key] = raw;
      continue;
    }
    let cacheVersion = -1;
    let cached: unknown = raw;
    Object.defineProperty(result, key, {
      enumerable: true,
      get() {
        const v = getStyleVersion();
        if (v !== cacheVersion) {
          cacheVersion = v;
          cached = transform(raw as Record<string, unknown>);
        }
        return cached;
      },
    });
  }
  return result as T;
};

try {
  (StyleSheet as unknown as { create: unknown }).create = patched;
} catch {
  try {
    Object.defineProperty(StyleSheet, 'create', { value: patched, configurable: true, writable: true });
  } catch {
    (StyleSheet as unknown as { create: unknown }).create = original;
  }
}
