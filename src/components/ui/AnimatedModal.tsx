import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Platform, type ModalProps } from 'react-native';

const native = Platform.OS !== 'web';

/** Shared progress (0 = hidden, 1 = shown) so SheetIn can animate both in and out. */
export const ModalAnim = createContext<Animated.Value | null>(null);
export function useModalAnim() {
  return useContext(ModalAnim);
}

/**
 * Drop-in replacement for transparent <Modal>: keeps the modal mounted while it
 * animates out (fade + slide), and freezes the last children so content that depends
 * on now-cleared state (e.g. `selected`) does not blank out mid-animation.
 */
export function AnimatedModal({ visible, children, ...rest }: ModalProps & { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(!!visible);
  const last = useRef<ReactNode>(children);
  if (visible) last.current = children;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      v.stopAnimation();
      Animated.spring(v, { toValue: 1, useNativeDriver: native, damping: 18, stiffness: 220, mass: 0.9 }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 170, useNativeDriver: native }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, v]);

  if (!mounted && !visible) return null;
  return (
    <Modal {...rest} visible animationType="none">
      <ModalAnim.Provider value={v}>
        <Animated.View style={{ flex: 1, opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }) }}>
          {visible ? children : last.current}
        </Animated.View>
      </ModalAnim.Provider>
    </Modal>
  );
}
