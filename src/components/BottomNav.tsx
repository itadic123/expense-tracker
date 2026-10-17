import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sr } from '../i18n/sr';
import { colors, radius } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Tab = { href: '/dashboard' | '/scan' | '/statistics' | '/profile'; label: string; icon: IconName; activeIcon: IconName };

const TABS: Tab[] = [
  { href: '/dashboard', label: sr.nav.home, icon: 'home-outline', activeIcon: 'home' },
  { href: '/scan', label: sr.nav.scan, icon: 'qr-code-outline', activeIcon: 'qr-code' },
  { href: '/statistics', label: sr.nav.statistics, icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { href: '/profile', label: sr.nav.profile, icon: 'person-outline', activeIcon: 'person' },
];

// Black pill with icon buttons, shown at the bottom of every signed-in screen.
export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Pressable
              key={tab.href}
              onPress={() => !active && router.navigate(tab.href)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              hitSlop={6}
              style={[styles.button, active && styles.active]}
            >
              <Ionicons name={active ? tab.activeIcon : tab.icon} size={22} color={active ? colors.black : colors.white} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 8 },
  bar: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.black,
    borderRadius: radius.pill,
    padding: 6,
  },
  button: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.accentBright },
});
