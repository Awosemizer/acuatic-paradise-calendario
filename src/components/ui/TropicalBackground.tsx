import { ImageBackground, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme';

const poolBg = require('@/assets/brand/bg-pool.png');

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle;
  overlay?: 'light' | 'dark' | 'none';
};

export function TropicalBackground({ children, style, overlay = 'light' }: Props) {
  return (
    <ImageBackground source={poolBg} style={[styles.bg, style]} resizeMode="cover">
      {overlay !== 'none' && (
        <LinearGradient
          colors={
            overlay === 'dark'
              ? ['rgba(11,31,58,0.35)', 'rgba(11,31,58,0.15)', 'rgba(11,31,58,0.45)']
              : ['rgba(255,255,255,0.12)', 'rgba(11,31,58,0.08)', 'rgba(11,31,58,0.28)']
          }
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.tealDeep },
  content: { flex: 1 },
});
