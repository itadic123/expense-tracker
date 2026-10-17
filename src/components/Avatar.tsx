import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function Avatar({ url, name, size = 52 }: { url: string | null | undefined; name: string; size?: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={[shape, styles.border]} />;
  return (
    <View style={[shape, styles.border, styles.fallback]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name) || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  border: { borderWidth: 2, borderColor: colors.white },
  fallback: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.bold, color: colors.white },
});
