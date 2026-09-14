import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, shadow } from '@/src/theme';

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
};

/**
 * Solid frosted/white glass pill track so inactive labels stay readable
 * on tropical photo backgrounds (dark-on-dark no longer happens).
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={[styles.track, shadow.card]}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.teal,
  },
  text: {
    color: colors.navy,
    fontFamily: fonts.semiBold,
    fontWeight: '700',
    fontSize: 14,
  },
  textActive: {
    color: colors.white,
  },
});
