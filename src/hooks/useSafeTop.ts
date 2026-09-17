import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Top inset that clears the status bar / notch.
 * Falls back to StatusBar.currentHeight on Android when insets.top is 0
 * (common when edge-to-edge + decorFits conflict leaves insets empty).
 */
export function useSafeTop(extra = 0) {
  const insets = useSafeAreaInsets();
  const androidFallback =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;
  return Math.max(insets.top, androidFallback) + extra;
}
