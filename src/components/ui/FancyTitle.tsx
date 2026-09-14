import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '@/src/theme';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
  color?: string;
  size?: number;
  tilt?: number;
};

export function FancyTitle({
  children,
  style,
  color = colors.white,
  size = 28,
  tilt = -4,
}: Props) {
  const y = useSharedValue(0);
  const rot = useSharedValue(tilt);
  const pulse = useSharedValue(1);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    rot.value = withRepeat(
      withSequence(
        withTiming(tilt - 1.1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(tilt + 1.1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [y, rot, pulse, tilt]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { translateY: y.value }],
    opacity: 0.88 + pulse.value * 0.12,
  }));

  return (
    <Animated.Text
      style={[
        styles.title,
        { color, fontSize: size, lineHeight: size * 1.25, fontFamily: fonts.display },
        animStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  title: {
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },
});
