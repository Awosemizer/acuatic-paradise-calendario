import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { colors, fonts } from '@/src/theme';

const logoSrc = require('@/assets/brand/logo-oficial.png');

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  fallback?: boolean;
};

const SIZES = { sm: 48, md: 88, lg: 148 };

export function WoodLogo({ size = 'md', showSubtitle = true, style, imageStyle, fallback }: Props) {
  const d = SIZES[size];

  if (!fallback) {
    return (
      <View style={[styles.wrap, style]}>
        <Image
          source={logoSrc}
          style={[{ height: d, width: d, resizeMode: 'contain' }, imageStyle]}
          accessibilityLabel="Aquatic Paradise, Salón de Eventos"
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.icon}>🌴</Text>
      <View>
        <Text style={styles.brand}>Aquatic Paradise</Text>
        {showSubtitle ? <Text style={styles.sub}>SALÓN · PACHUCA</Text> : null}
      </View>
    </View>
  );
}

export const BrandLogo = WoodLogo;

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#5C3A1E',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5A2B',
  },
  icon: { fontSize: 22 },
  brand: { color: colors.white, fontFamily: fonts.bold, fontWeight: '800', fontSize: 16 },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
});
