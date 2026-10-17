import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sr } from '../i18n/sr';
import { colors, fonts } from '../theme';
import { Button } from './Button';
import { Logo } from './Logo';

// Shared header and Google button for the login and sign up screens.
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Logo />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function GoogleSection({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>{sr.auth.or}</Text>
        <View style={styles.line} />
      </View>
      <Button label={sr.auth.google} variant="secondary" onPress={onPress} loading={loading} />
    </>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export const authStyles = StyleSheet.create({
  form: { gap: 14 },
  footerText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent },
});

const styles = StyleSheet.create({
  header: { gap: 8, marginTop: 12, marginBottom: 28 },
  title: { fontFamily: fonts.bold, fontSize: 30, color: colors.text, marginTop: 28 },
  subtitle: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
});
