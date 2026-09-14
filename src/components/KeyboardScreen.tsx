import { type ReactNode } from 'react';
import {
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Kept for API compat; unused with KeyboardAwareScrollView. */
  keyboardVerticalOffset?: number;
  /** Extra scroll padding under content. */
  bottomPadding?: number;
  extraScrollHeight?: number;
} & Pick<ScrollViewProps, 'keyboardShouldPersistTaps' | 'keyboardDismissMode' | 'onScroll'>;

/**
 * Keyboard-safe screen for Expo RN Android + iOS.
 * Uses KeyboardAwareScrollView with enableOnAndroid so focused TextInputs
 * (e.g. date/time/notes, perfil rol) scroll above the soft keyboard.
 * Pair with android.softwareKeyboardLayoutMode: "resize" / adjustResize.
 */
export function KeyboardScreen({
  children,
  style,
  contentContainerStyle,
  bottomPadding = 80,
  extraScrollHeight = 100,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  onScroll,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={[styles.flex, style]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(bottomPadding, 40) + insets.bottom },
        contentContainerStyle,
      ]}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={extraScrollHeight}
      extraHeight={extraScrollHeight}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={false}
      enableResetScrollToCoords={false}
      onScroll={onScroll}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
