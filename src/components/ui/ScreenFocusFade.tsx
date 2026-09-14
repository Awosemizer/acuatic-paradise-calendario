import { useCallback, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Soft fade-in when a tab/screen gains focus. */
export function ScreenFocusFade({ children, style }: Props) {
  const opacity = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0.35;
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    }, [opacity]),
  );

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.fill, animStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
