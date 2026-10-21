import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { useProfile } from '../profile/ProfileProvider';
import { colors, fonts, radius } from '../theme';
import { Avatar } from './Avatar';
import { Logo } from './Logo';
import { isActive, NAV_ITEMS } from './navItems';

// Side menu for wide screens (desktop browser); phones use BottomNav instead.
export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const { profile } = useProfile();
  const name = profile?.full_name || session?.user.email || '';

  return (
    <View style={styles.sidebar}>
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.items}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => pathname !== item.href && router.navigate(item.href)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              // react-native-web adds `hovered` to the press state.
              style={(state) => [
                styles.item,
                (state as { hovered?: boolean }).hovered && !active && styles.itemHover,
                active && styles.itemActive,
              ]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? colors.accentBright : colors.text}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.user} onPress={() => router.navigate('/profile')}>
        <Avatar url={profile?.avatar_url} name={name} size={40} />
        <Text style={styles.userName} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 248,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  logo: { paddingHorizontal: 12, marginBottom: 32 },
  items: { gap: 6, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 48, borderRadius: radius.pill },
  itemHover: { backgroundColor: colors.background },
  itemActive: { backgroundColor: colors.black },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  labelActive: { color: colors.white },
  user: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: radius.pill },
  userName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
