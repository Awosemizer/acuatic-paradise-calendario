/**
 * Makes every StyleSheet.create() result theme-aware (font scale + accent colour)
 * without touching each screen. Must be imported before any other module (see index.js).
 */
import { StyleSheet } from 'react-native';
import { getFontScale, getStyleVersion, isHighContrast, isHugeFont, mapColor } from '@/src/lib/settingsStore';

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

const BUMP: Record<string, string> = {
  Poppins_400Regular: 'Poppins_500Medium',
  Poppins_500Medium: 'Poppins_600SemiBold',
  Poppins_600SemiBold: 'Poppins_700Bold',
};
const WEIGHT_BUMP: Record<string, string> = { '400': '500', normal: '600', '500': '600', '600': '700', '700': '800' };

function transform(style: Record<string, unknown>) {
  const scale = getFontScale();
  const hc = isHighContrast();
  const huge = isHugeFont();
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(style)) {
    const v = style[key];
    if (key === 'fontSize' && typeof v === 'number') {
      // Legibility floor: nothing below 12 at normal size.
      out[key] = Math.round(Math.max(v, 12) * scale * 10) / 10;
    } else if (key === 'lineHeight' && typeof v === 'number') {
      const fs = typeof style.fontSize === 'number' ? Math.max(style.fontSize as number, 12) : 0;
      out[key] = Math.round(Math.max(v, fs * 1.22) * scale * 10) / 10;
    } else if (COLOR_KEYS.has(key) && typeof v === 'string') {
      out[key] = mapColor(v, key);
    } else if (key === 'fontFamily' && typeof v === 'string' && (hc || huge) && v.startsWith('Pacifico')) {
      // Decorative script falls back to a bold sans when readability matters.
      out[key] = 'Poppins_700Bold';
    } else if (key === 'fontFamily' && typeof v === 'string' && hc && BUMP[v]) {
      out[key] = BUMP[v];
    } else if (key === 'fontWeight' && hc && WEIGHT_BUMP[String(v)]) {
      out[key] = WEIGHT_BUMP[String(v)];
    } else if (huge && key === 'letterSpacing' && typeof v === 'number') {
      out[key] = Math.min(v, 0.3);
    } else if (huge && key === 'minHeight' && typeof v === 'number' && v >= 36 && v < 56) {
      // Touch targets: buttons/chips grow to >= 56dp.
      out[key] = 56;
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
