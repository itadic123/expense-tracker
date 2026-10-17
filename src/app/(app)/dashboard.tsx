import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { formatRSD } from '../../lib/format';
import { colors, fonts, radius } from '../../theme';

// Placeholder so login has somewhere to land; the full dashboard is step 2.
export default function Dashboard() {
  const { session, signOut } = useAuth();
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';
  const t = sr.dashboard;

  return (
    <Screen>
      <View style={styles.top}>
        <Logo />
      </View>
      <LinearGradient
        colors={[colors.accentBright, colors.accent, colors.accentDark, colors.black]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardSmall}>{t.welcomeBack}</Text>
        <Text style={styles.cardName}>
          {t.hello}, {name.split(' ')[0]}
        </Text>
        <Text style={styles.cardAmount}>{formatRSD(0)}</Text>
        <Text style={styles.cardSmall}>
          {t.spending} · {t.thisMonth.toLowerCase()}
        </Text>
      </LinearGradient>
      <Text style={styles.note}>{t.comingSoon}</Text>
      <Button label={t.signOut} variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginBottom: 20 },
  card: { borderRadius: radius.lg, padding: 22, gap: 6, marginBottom: 20 },
  cardSmall: { fontFamily: fonts.medium, fontSize: 13, color: colors.white, opacity: 0.9 },
  cardName: { fontFamily: fonts.semibold, fontSize: 20, color: colors.white },
  cardAmount: { fontFamily: fonts.bold, fontSize: 32, color: colors.white, marginTop: 18 },
  note: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
});
