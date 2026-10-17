import { StyleSheet, Text, View } from 'react-native';

import { sr } from '../i18n/sr';
import { colors, fonts } from '../theme';

export function Logo() {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{sr.appName.toUpperCase()}</Text>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  text: { fontFamily: fonts.bold, fontSize: 22, letterSpacing: 0.5, color: colors.text },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginBottom: 6 },
});
