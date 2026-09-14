import { forwardRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra offset above the keyboard (defaults to safe-area top + 8). */
  keyboardVerticalOffset?: number;
  /** Extra scroll padding under content when keyboard may be open. */
  bottomPadding?: number;
} & Pick<ScrollViewProps, 'keyboardShouldPersistTaps' | 'keyboardDismissMode' | 'onScroll'>;

/**
 * Reusable keyboard-safe screen: KeyboardAvoidingView (padding on iOS + Android)
 * wrapping a ScrollView so focused TextInputs stay visible.
 * Place inside TropicalBackground / SafeAreaView — not outside ImageBackground.
 */
export const KeyboardScreen = forwardRef<ScrollView, Props>(function KeyboardScreen(
  {
    children,
    style,
    contentContainerStyle,
    keyboardVerticalOffset,
    bottomPadding = 80,
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = 'on-drag',
    onScroll,
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const offset = keyboardVerticalOffset ?? insets.top + 8;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        ref={ref}
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(bottomPadding, 40) + insets.bottom },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
