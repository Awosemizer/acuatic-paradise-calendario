import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fill } from '@/src/theme';
import { FlamingoFloat } from './FlamingoFloat';

const poolBg = require('@/assets/brand/bg-pool.png');

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  overlay?: 'light' | 'dark' | 'none';
};

export function TropicalBackground({ children, style, overlay = 'dark' }: Props) {
  return (
    <ImageBackground source={poolBg} style={[styles.bg, style]} resizeMode="cover">
      {overlay !== 'none' && (
        <LinearGradient
          colors={
            overlay === 'dark'
              ? ['rgba(11,31,58,0.72)', 'rgba(11,31,58,0.55)', 'rgba(11,31,58,0.78)']
              : ['rgba(11,31,58,0.45)', 'rgba(11,31,58,0.28)', 'rgba(11,31,58,0.55)']
          }
          style={fill}
          pointerEvents="none"
        />
      )}
      <View style={styles.flamLayer} pointerEvents="none">
        <FlamingoFloat size={170} opacity={0.22} delay={0} style={styles.flamA} />
        <FlamingoFloat size={120} opacity={0.18} delay={450} style={styles.flamB} />
        <FlamingoFloat size={96} opacity={0.16} delay={900} style={styles.flamC} />
        <FlamingoFloat size={78} opacity={0.14} delay={1300} style={styles.flamD} />
      </View>
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.tealDeep },
  flamLayer: {
    ...fill,
    zIndex: 0,
  },
  flamA: { top: 28, left: -36 },
  flamB: { top: 210, right: -40 },
  flamC: { bottom: 160, left: 8 },
  flamD: { bottom: 36, right: 12 },
  content: { flex: 1, zIndex: 1 },
});
