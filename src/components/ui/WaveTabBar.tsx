import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '@/src/theme';

type TabRoute = { key: string; name: string; params?: object };

type Props = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  calendario: 'calendar',
  tareas: 'checkbox',
  bitacora: 'clipboard',
  mas: 'ellipsis-horizontal',
};

const LABELS: Record<string, string> = {
  index: 'Inicio',
  calendario: 'Calendario',
  tareas: 'Tareas',
  bitacora: 'Bitácora',
  mas: 'Más',
};

export function WaveTabBar({ state, descriptors, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <Svg
        width="100%"
        height={28}
        viewBox="0 0 390 28"
        preserveAspectRatio="none"
        style={styles.wave}
      >
        <Path
          d="M0,28 L0,14 Q48,0 97.5,12 T195,12 T292.5,12 T390,14 L390,28 Z"
          fill={colors.tabBar}
        />
      </Svg>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = LABELS[route.name] ?? options.title ?? route.name;
          const icon = ICONS[route.name] ?? 'ellipse';
          const outline = `${icon}-outline` as keyof typeof Ionicons.glyphMap;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.item}
            >
              <Ionicons
                name={focused ? icon : outline}
                size={22}
                color={focused ? colors.aquaLight : 'rgba(255,255,255,0.55)'}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
              {focused ? <View style={styles.underline} /> : <View style={styles.underlineSpacer} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.tabBar,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    top: -26,
    left: 0,
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontFamily: fonts.semiBold,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.aquaLight,
  },
  underline: {
    marginTop: 2,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.aqua,
  },
  underlineSpacer: {
    marginTop: 2,
    height: 3,
  },
});
