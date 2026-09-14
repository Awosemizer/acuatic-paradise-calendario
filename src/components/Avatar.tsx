import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/src/theme';

type Props = {
  name?: string | null;
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ name, uri, size = 36, style }: Props) {
  const initial = (name ?? 'E').trim().charAt(0).toUpperCase() || 'E';
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.75)',
            backgroundColor: colors.teal,
          },
          style as any,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  text: { color: colors.white, fontWeight: '800' },
});
