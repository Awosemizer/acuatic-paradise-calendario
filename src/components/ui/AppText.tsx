import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '@/src/theme';

type Weight = 'regular' | 'medium' | 'semiBold' | 'bold';

type Props = TextProps & {
  weight?: Weight;
};

const weightMap: Record<Weight, string> = {
  regular: fonts.regular,
  medium: fonts.medium,
  semiBold: fonts.semiBold,
  bold: fonts.bold,
};

/** Thin Text wrapper that applies Poppins by default. */
export function AppText({ weight = 'regular', style, ...rest }: Props) {
  return <RNText {...rest} style={[{ fontFamily: weightMap[weight], color: colors.ink }, style]} />;
}

export const textStyles = StyleSheet.create({
  body: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  semiBold: { fontFamily: fonts.semiBold },
  bold: { fontFamily: fonts.bold },
  display: { fontFamily: fonts.display },
});
