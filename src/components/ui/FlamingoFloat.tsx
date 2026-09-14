import { useEffect } from 'react';
import { Image, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const flamingo = require('@/assets/brand/flamingo-float.png');

type Props = {
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  size?: number;
};

export function FlamingoFloat({ style, imageStyle, size = 120 }: Props) {
  const y = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    rot.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(3, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [y, rot]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.wrap, style, animStyle]} pointerEvents="none">
      <Image
        source={flamingo}
        style={[{ width: size, height: size * 0.82, resizeMode: 'contain' }, imageStyle]}
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
});
