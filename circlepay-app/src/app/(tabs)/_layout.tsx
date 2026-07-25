import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useRouter } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCoachMark } from '@/lib/coachTour';
import { colors, fonts, shadow } from '@/theme/tokens';
import { CoachMark } from '@/ui';

const TAB_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  circles: { icon: 'people', label: 'Circles' },
  support: { icon: 'heart', label: 'Support' },
  more: { icon: 'grid', label: 'More' },
};

/** Custom tab bar: 4 tabs + raised center "Scan & Pay" button, as in the designs. */
function CirclePayTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // The tour's first stop points at the Scan & Pay button, which lives here in
  // the tab bar rather than on the Home screen — so the Home mark is mounted
  // here too, where a ref can actually reach it.
  const scanRef = useRef<View | null>(null);
  // `useIsFocused` covers the tab group as a whole (false while a screen like
  // /scan is pushed over it); `state` narrows that to the Home tab specifically.
  const tabsFocused = useIsFocused();
  const onHomeTab = state.routes[state.index]?.name === 'index';
  const homeMark = useCoachMark('home', tabsFocused && onHomeTab);

  const routes = state.routes.filter((r) => TAB_ICONS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const meta = TAB_ICONS[route.name]!;
    const focused = state.routes[state.index]?.key === route.key;
    return (
      <Pressable
        key={route.key}
        onPress={() => navigation.navigate(route.name)}
        style={styles.tab}
        hitSlop={8}>
        <Ionicons
          name={focused ? meta.icon : (`${meta.icon}-outline` as keyof typeof Ionicons.glyphMap)}
          size={22}
          color={focused ? colors.primary : colors.faint}
        />
        <Text style={[styles.label, focused && styles.labelFocused]}>{meta.label}</Text>
      </Pressable>
    );
  };

  return (
    <>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {left.map(renderTab)}
        <Pressable
          ref={scanRef}
          collapsable={false}
          onPress={() => router.push('/scan')}
          style={styles.fabWrap}
          hitSlop={8}>
          <View style={styles.fab}>
            <Ionicons name="scan" size={24} color={colors.onPrimary} />
          </View>
          <Text style={styles.fabLabel}>Scan & Pay</Text>
        </Pressable>
        {right.map(renderTab)}
      </View>

      <CoachMark
        visible={homeMark.visible}
        targetRef={scanRef}
        title={homeMark.title}
        body={homeMark.body}
        onDismiss={homeMark.onDismiss}
        onSkipAll={homeMark.onSkipAll}
      />
    </>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props: BottomTabBarProps) => <CirclePayTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="circles" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: 6,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  label: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.faint },
  labelFocused: { color: colors.primary },
  fabWrap: { flex: 1.2, alignItems: 'center', marginTop: -26 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.card,
    ...shadow.raised,
  },
  fabLabel: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.primary, marginTop: 3 },
});
