import { useEffect, useRef, type ReactNode } from 'react';
import { useModalAnim } from './AnimatedModal';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 'up' = bottom sheet slide, 'pop' = centered dialog scale. */
  variant?: 'up' | 'pop';
};

const native = Platform.OS !== 'web';

/** Spring entry animation for modal sheets / dialogs (mounts with the Modal). */
export function SheetIn({ children, style, variant = 'pop' }: Props) {
  const own = useRef(new Animated.Value(0)).current;
  const shared = useModalAnim();
  const v = shared ?? own;

  useEffect(() => {
    if (shared) return;
    Animated.spring(v, {
      toValue: 1,
      useNativeDriver: native,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    }).start();
  }, [v, shared]);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [variant === 'up' ? 60 : 24, 0] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [variant === 'up' ? 1 : 0.94, 1] });
  const opacity = v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}
