import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../theme';
import { isActive, NAV_ITEMS } from './navItems';

// Black pill with icon buttons, shown at the bottom of every signed-in screen on phones.
export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => pathname !== item.href && router.navigate(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              hitSlop={4}
              style={[styles.button, active && styles.active]}
            >
              <Ionicons name={active ? item.activeIcon : item.icon} size={22} color={active ? colors.black : colors.white} />
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
