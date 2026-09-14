import { useEffect, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  animKey: string | number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
};

/** Light fade + short upward slide when `animKey` changes. */
export function FadeSlide({ animKey, children, style, duration = 240 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 12;
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
  }, [animKey, duration, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.fill, animStyle, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
