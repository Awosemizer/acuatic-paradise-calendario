import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle> | ((s: PressableStateCallbackType) => StyleProp<ViewStyle>);
  children?: ReactNode | ((s: PressableStateCallbackType) => ReactNode);
  /** Scale while pressed (default 0.96). */
  scaleTo?: number;
};

/** Drop-in Pressable with a subtle spring scale + opacity on press. */
export const PressableScale = forwardRef<View, Props>(function PressableScale(
  { style, children, scaleTo = 0.96, onPressIn, onPressOut, disabled, ...rest },
  ref,
) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handleIn = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
      onPressIn?.(e);
    },
    [onPressIn, scale, scaleTo],
  );
  const handleOut = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  const state = { pressed, hovered: false } as PressableStateCallbackType;
  const resolved = typeof style === 'function' ? style(state) : style;
  const content = typeof children === 'function' ? children(state) : children;

  return (
    <AnimatedPressable
      ref={ref as never}
      {...rest}
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[resolved, { transform: [{ scale }] }, pressed && !disabled ? { opacity: 0.9 } : null] as never}
    >
      {content}
    </AnimatedPressable>
  );
});
