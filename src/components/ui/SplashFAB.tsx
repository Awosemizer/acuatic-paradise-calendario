import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fill, shadow } from '@/src/theme';

type Props = {
  onPress: () => void;
  bottom?: number;
};

export function SplashFAB({ onPress, bottom = 24 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }

  return (
    <Animated.View style={[styles.wrap, { bottom, transform: [{ scale }] }]}>
      <View style={styles.splash} pointerEvents="none">
        <Svg width={96} height={96} viewBox="0 0 96 96">
          <Circle cx="48" cy="48" r="40" fill="rgba(20,196,200,0.18)" />
          <Path
            d="M12 50 C20 30, 30 70, 40 46 C48 28, 55 72, 68 44 C78 28, 86 58, 92 48"
            stroke="rgba(94,232,236,0.55)"
            strokeWidth="3"
            fill="none"
          />
          <Circle cx="22" cy="38" r="4" fill="rgba(255,255,255,0.55)" />
          <Circle cx="74" cy="58" r="5" fill="rgba(255,255,255,0.4)" />
          <Circle cx="80" cy="34" r="3" fill="rgba(94,232,236,0.7)" />
        </Svg>
      </View>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel="Agregar al calendario"
        style={styles.fab}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  splash: {
    ...fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.65)',
    ...shadow.fab,
  },
});
