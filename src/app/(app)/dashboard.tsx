import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Avatar } from '../../components/Avatar';
import { Logo } from '../../components/Logo';
import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { formatDate, formatRSD } from '../../lib/format';
import { fetchSpendingTotals, SpendingTotals } from '../../lib/receipts';
import { useProfile } from '../../profile/ProfileProvider';
import { colors, fonts, radius } from '../../theme';

export default function Dashboard() {
  const { session } = useAuth();
  const { profile, reload: reloadProfile } = useProfile();
  const [totals, setTotals] = useState<SpendingTotals | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = sr.dashboard;

  const loadTotals = useCallback(async () => {
    try {
      setTotals(await fetchSpendingTotals());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTotals();
    }, [loadTotals]),
  );

  async function refresh() {
    setRefreshing(true);
    await Promise.all([loadTotals(), reloadProfile()]);
    setRefreshing(false);
  }

  const name = profile?.full_name || session?.user.email || '';
  const earnings = profile?.monthly_earnings;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}>
      <View style={styles.header}>
        <Pressable style={styles.user} onPress={() => router.push('/profile')} accessibilityRole="button">
          <Avatar url={profile?.avatar_url} name={name} />
          <View style={styles.userText}>
            <Text style={styles.small}>{t.welcomeBack}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </Pressable>
        <Logo />
      </View>

      <LinearGradient
        colors={[colors.accentBright, colors.accent, colors.accentDark, colors.black]}
        locations={[0, 0.35, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardLabel}>{t.spendingThisMonth}</Text>
        <Text style={styles.cardAmount}>{formatRSD(totals?.month ?? 0)}</Text>
        <View style={styles.cardYear}>
          <Text style={styles.cardLabel}>{t.thisYear}</Text>
          <Text style={styles.cardYearAmount}>{formatRSD(totals?.year ?? 0)}</Text>
        </View>
        <Pressable style={styles.scanButton} onPress={() => router.push('/scan')} accessibilityRole="button">
          <Text style={styles.scanText}>{t.scan}</Text>
        </Pressable>
      </LinearGradient>

      {loadError && <Text style={styles.error}>{t.loadError}</Text>}

      <View style={styles.tiles}>
        <Tile
          label={t.earnings}
          value={earnings != null ? formatRSD(earnings, { withDecimals: false }) : t.earningsNotSet}
          caption={t.thisMonth}
          muted={earnings == null}
          onPress={() => router.push('/profile')}
        />
        <Tile label={t.expenses} value={formatRSD(totals?.month ?? 0, { withDecimals: false })} caption={t.thisMonth} />
      </View>

      <Text style={styles.sectionTitle}>{t.recent}</Text>
      {totals?.recent.length ? (
        totals.recent.map((r) => (
          <Pressable
            key={r.id}
            style={styles.row}
            onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: r.id } })}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {r.store_name ?? '—'}
              </Text>
              <Text style={styles.rowSub}>{formatDate(new Date(r.issued_at))}</Text>
            </View>
            <Text style={styles.rowAmount}>-{formatRSD(r.total)}</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.row}>
          <Text style={styles.rowSub}>{t.noReceipts}</Text>
        </View>
      )}
    </Screen>
  );
}

function Tile(props: { label: string; value: string; caption: string; muted?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={props.onPress} disabled={!props.onPress}>
      <Text style={styles.tileLabel}>{props.label}</Text>
      <Text style={[styles.tileValue, props.muted && styles.tileMuted]} numberOfLines={1}>
        {props.value}
      </Text>
      <Text style={styles.rowSub}>{props.caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  user: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  userText: { flexShrink: 1 },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  card: { borderRadius: radius.lg, padding: 22, marginBottom: 16 },
  cardLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.white, opacity: 0.9 },
  cardAmount: { fontFamily: fonts.bold, fontSize: 34, color: colors.white, marginTop: 6 },
  cardYear: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 },
  cardYearAmount: { fontFamily: fonts.semibold, fontSize: 18, color: colors.white },
  scanButton: {
    marginTop: 20,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  error: { fontFamily: fonts.medium, color: colors.danger, marginBottom: 12, textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 8 },
  tileLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  tileValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  tileMuted: { fontFamily: fonts.medium, fontSize: 14, color: colors.accent },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  rowAmount: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
});
