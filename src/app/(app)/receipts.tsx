import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { formatDate, formatRSD, monthName } from '../../lib/format';
import { useIsWide } from '../../lib/layout';
import { fetchReceiptsForYear, ReceiptListItem } from '../../lib/receipts';
import { colors, fonts, radius } from '../../theme';

export default function Receipts() {
  const now = new Date();
  const wide = useIsWide();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [receipts, setReceipts] = useState<ReceiptListItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = sr.receipts;

  const load = useCallback(async (forYear: number) => {
    try {
      setReceipts(await fetchReceiptsForYear(forYear));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(year);
    }, [load, year]),
  );

  async function refresh() {
    setRefreshing(true);
    await load(year);
    setRefreshing(false);
  }

  const needle = query.trim().toLocaleLowerCase('sr');
  const shown = (receipts ?? []).filter(
    (r) =>
      (month === null || new Date(r.issued_at).getMonth() === month) &&
      (!needle || (r.store_name ?? '').toLocaleLowerCase('sr').includes(needle)),
  );
  const shownTotal = shown.reduce((sum, r) => sum + r.total, 0);
  const open = (id: string) => router.push({ pathname: '/receipt/[id]', params: { id } });

  return (
    <Screen
      withNav
      wide
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.yearRow}>
          <Pressable onPress={() => setYear(year - 1)} hitSlop={12} accessibilityLabel={sr.statistics.previousYear}>
            <Text style={styles.yearArrow}>‹</Text>
          </Pressable>
          <Text style={styles.yearText}>{year}.</Text>
          <Pressable
            onPress={() => setYear(year + 1)}
            hitSlop={12}
            disabled={year >= now.getFullYear()}
            accessibilityLabel={sr.statistics.nextYear}
          >
            <Text style={[styles.yearArrow, year >= now.getFullYear() && styles.disabled]}>›</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.search}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        <Chip label={t.allMonths} active={month === null} onPress={() => setMonth(null)} />
        {Array.from({ length: 12 }, (_, m) => (
          <Chip key={m} label={monthName(m).slice(0, 3)} active={month === m} onPress={() => setMonth(m)} />
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryCount}>{t.count(shown.length)}</Text>
        <Text style={styles.summaryTotal}>{formatRSD(shownTotal)}</Text>
      </View>

      {loadError && <Text style={styles.error}>{t.loadError}</Text>}
      {receipts && shown.length === 0 && <Text style={styles.empty}>{t.empty}</Text>}

      {wide && shown.length > 0 ? (
        <View style={styles.table}>
          <View style={[styles.tr, styles.th]}>
            <Text style={[styles.thText, styles.colDate]}>{t.date}</Text>
            <Text style={[styles.thText, styles.colStore]}>{t.store}</Text>
            <Text style={[styles.thText, styles.colItems]}>{t.items}</Text>
            <Text style={[styles.thText, styles.colTotal]}>{t.total}</Text>
          </View>
          {shown.map((r, i) => (
            <Pressable
              key={r.id}
              onPress={() => open(r.id)}
              style={(state) => [
                styles.tr,
                i % 2 === 1 && styles.trAlt,
                (state as { hovered?: boolean }).hovered && styles.trHover,
              ]}
            >
              <Text style={[styles.td, styles.colDate]}>{formatDate(new Date(r.issued_at))}</Text>
              <Text style={[styles.td, styles.tdStrong, styles.colStore]} numberOfLines={1}>
                {r.store_name ?? '—'}
              </Text>
              <Text style={[styles.td, styles.colItems]}>{r.item_count}</Text>
              <Text style={[styles.td, styles.tdStrong, styles.colTotal]}>{formatRSD(r.total)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        shown.map((r) => (
          <Pressable key={r.id} style={styles.row} onPress={() => open(r.id)}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {r.store_name ?? '—'}
              </Text>
              <Text style={styles.rowSub}>
                {formatDate(new Date(r.issued_at))} · {r.item_count} {t.items.toLowerCase()}
              </Text>
            </View>
            <Text style={styles.rowAmount}>{formatRSD(r.total)}</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearArrow: { fontFamily: fonts.bold, fontSize: 26, color: colors.accent, paddingHorizontal: 6, lineHeight: 28 },
  disabled: { opacity: 0.25 },
  yearText: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  search: {
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  chipsScroll: { marginTop: 12, flexGrow: 0 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.black, borderColor: colors.black },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginBottom: 12 },
  summaryCount: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  summaryTotal: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, marginBottom: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 8 },
  table: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52, gap: 16 },
  trAlt: { backgroundColor: colors.card },
  trHover: { backgroundColor: '#E3F5DE' },
  th: { backgroundColor: colors.black, height: 46 },
  thText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
  td: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  tdStrong: { fontFamily: fonts.semibold },
  colDate: { width: 180 },
  colStore: { flex: 1 },
  colItems: { width: 80, textAlign: 'right' },
  colTotal: { width: 160, textAlign: 'right' },
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
