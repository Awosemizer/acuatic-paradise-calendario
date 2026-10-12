import { isHighContrast, isHugeFont } from '@/src/lib/settingsStore';
import { PressableScale } from './PressableScale';
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

export function WaveTabBar({ state, descriptors, navigation, rail }: Props & { rail?: boolean }) {
  const insets = useSafeAreaInsets();
  if (rail) return <SideRail state={state} descriptors={descriptors} navigation={navigation} />;
  const bottom = Math.max(insets.bottom, 8);
  const huge = isHugeFont();
  const hc = isHighContrast();

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
            <PressableScale
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
                size={huge ? 34 : 24}
                color={focused ? colors.aquaLight : hc ? '#FFFFFF' : 'rgba(255,255,255,0.8)'}
              />
              {huge && !focused ? null : (
                <Text style={[styles.label, focused && styles.labelActive, huge && { fontSize: 14 }]} numberOfLines={1}>
                  {label}
                </Text>
              )}
              {focused ? <View style={styles.underline} /> : <View style={styles.underlineSpacer} />}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

/** Tablet / landscape: vertical navigation rail on the left. */
function SideRail({ state, descriptors, navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[railStyles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, paddingLeft: insets.left }]}>
      <View style={railStyles.logo}>
        <Ionicons name="water" size={24} color={colors.aquaLight} />
      </View>
      <View style={railStyles.items}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = LABELS[route.name] ?? options.title ?? route.name;
          const icon = ICONS[route.name] ?? 'ellipse';
          const outline = `${icon}-outline` as keyof typeof Ionicons.glyphMap;
          return (
            <PressableScale
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={railStyles.item}
            >
              <View style={[railStyles.pill, focused && railStyles.pillOn]}>
                <Ionicons name={focused ? icon : outline} size={22} color={focused ? colors.white : 'rgba(255,255,255,0.82)'} />
              </View>
              <Text style={[railStyles.label, focused && railStyles.labelOn]} numberOfLines={1}>
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const railStyles = StyleSheet.create({
  wrap: { width: 92, backgroundColor: colors.tabBar, alignItems: 'center' },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  items: { gap: 10, alignItems: 'center', width: '100%' },
  item: { alignItems: 'center', gap: 4, width: '100%', paddingVertical: 4 },
  pill: { width: 56, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.teal },
  label: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '700' },
  labelOn: { color: colors.aquaLight },
});

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
    minHeight: 56,
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
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
