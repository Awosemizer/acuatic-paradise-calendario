import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Root for transparent Modals / bottom sheets. Android modals do not always resize with
 * the soft keyboard (statusBarTranslucent dialogs), so we pad the bottom by the part of
 * the keyboard the window did not already absorb. Keeps the focused field visible.
 */
export function KeyboardModalRoot({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const baseHeight = useRef(height);
  const [kb, setKb] = useState(0);

  useEffect(() => {
    if (kb === 0) baseHeight.current = Math.max(baseHeight.current, height);
  }, [height, kb]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKb(e.endCoordinates?.height ?? 0));
    const h = Keyboard.addListener(hideEvt, () => setKb(0));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const absorbed = Math.max(0, baseHeight.current - height);
  const pad = Math.max(0, kb - absorbed);
  return <View style={[style, pad ? { paddingBottom: pad } : null]}>{children}</View>;
}
