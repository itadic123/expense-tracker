import { StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '../theme';

export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return <Text style={[styles.base, error ? styles.error : styles.info]}>{error ?? info}</Text>;
}

const styles = StyleSheet.create({
  base: { fontFamily: fonts.medium, fontSize: 14, padding: 12, borderRadius: radius.sm, overflow: 'hidden' },
  error: { color: colors.danger, backgroundColor: '#FDECEC' },
  info: { color: colors.accentDark, backgroundColor: '#E3F5DE' },
});
