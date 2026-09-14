import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fill, radius, shadow } from '@/src/theme';

type Props = ViewProps & {
  intensity?: number;
  padding?: number;
  style?: ViewStyle;
  strong?: boolean;
};

export function GlassCard({
  children,
  intensity = 40,
  padding = 16,
  style,
  strong,
  ...rest
}: Props) {
  const body = (
    <View style={[styles.inner, { padding }, style]} {...rest}>
      {children}
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webGlass,
          strong && styles.webStrong,
          shadow.card,
          { borderRadius: radius.lg },
        ]}
      >
        {body}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, shadow.card]}>
      <BlurView intensity={intensity} tint="light" style={fill} />
      <View style={[styles.nativeGlass, strong && styles.webStrong]} />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  nativeGlass: {
    ...fill,
    backgroundColor: colors.glassSoft,
  },
  webGlass: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  webStrong: {
    backgroundColor: colors.glassStrong,
  },
  inner: {
    position: 'relative',
  },
});
