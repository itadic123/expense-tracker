import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { sr } from '../i18n/sr';
import { colors, fonts } from '../theme';

export default function Welcome() {
  const { session } = useAuth();
  if (session) return <Redirect href="/dashboard" />;

  const t = sr.welcome;
  return (
    <Screen>
      <View style={styles.hero}>
        {/* Placeholder for the mascot illustration; real artwork comes with the visuals pass. */}
        <LinearGradient colors={[colors.accentBright, colors.accent, colors.accentDark]} style={styles.badge}>
          <Text style={styles.badgeText}>дин.</Text>
        </LinearGradient>
      </View>

      <Text style={styles.title}>
        {t.titleStart} <Text style={styles.accent}>{t.titleAccent1}</Text>
        {'\n'}
        {t.titleMiddle} <Text style={styles.accent}>{t.titleAccent2}</Text> {t.titleEnd}
      </Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <View style={styles.actions}>
        <Button label={t.createAccount} onPress={() => router.push('/signup')} />
        <Button label={t.signIn} variant="secondary" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 56, color: colors.white },
  title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 42, textAlign: 'center', color: colors.text },
  accent: { color: colors.accent },
  subtitle: { fontFamily: fonts.regular, fontSize: 17, textAlign: 'center', color: colors.text, marginTop: 10 },
  actions: { gap: 12, marginTop: 28, marginBottom: 8 },
});
