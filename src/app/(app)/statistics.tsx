import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { formatRSD, monthName } from '../../lib/format';
import { useIsWide } from '../../lib/layout';
import { fetchStatistics, monthKey, Statistics } from '../../lib/receipts';
import { colors, fonts, radius } from '../../theme';

const TREND_MONTHS = 6;

export default function StatisticsScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const wide = useIsWide();
  const t = sr.statistics;

  const load = useCallback(async (forYear: number) => {
    try {
      setStats(await fetchStatistics(forYear));
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

  function changeYear(next: number) {
    setYear(next);
    setStats(null);
    setMonth(next === now.getFullYear() ? now.getMonth() : 11);
  }

  const monthTotal = (m: number) => stats?.[monthKey(year, m)]?.total ?? 0;
  const yearTotal = Array.from({ length: 12 }, (_, m) => monthTotal(m)).reduce((a, b) => a + b, 0);
  const maxMonth = Math.max(1, ...Array.from({ length: 12 }, (_, m) => monthTotal(m)));

  const current = stats?.[monthKey(year, month)];
  const previous = stats?.[monthKey(year, month - 1)];
  const categories = Array.from(new Set([...Object.keys(current?.byCategory ?? {}), ...Object.keys(previous?.byCategory ?? {})]))
    .map((name) => ({
      name,
      amount: current?.byCategory[name] ?? 0,
      previous: previous?.byCategory[name] ?? 0,
      trend: Array.from(
        { length: TREND_MONTHS },
        (_, i) => stats?.[monthKey(year, month - TREND_MONTHS + 1 + i)]?.byCategory[name] ?? 0,
      ),
    }))
    .sort((a, b) => b.amount - a.amount || b.previous - a.previous);
  const categoryTotal = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Screen
      withNav
      wide
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <Text style={styles.title}>{t.title}</Text>

      <View style={wide ? styles.topRow : undefined}>
        <View style={[styles.yearCard, wide && styles.yearCardWide]}>
          <View style={styles.yearRow}>
            <Pressable onPress={() => changeYear(year - 1)} hitSlop={12} accessibilityLabel={t.previousYear}>
              <Text style={styles.yearArrow}>‹</Text>
            </Pressable>
            <Text style={styles.yearText}>{year}.</Text>
            <Pressable
              onPress={() => changeYear(year + 1)}
              hitSlop={12}
              disabled={year >= now.getFullYear()}
              accessibilityLabel={t.nextYear}
            >
              <Text style={[styles.yearArrow, year >= now.getFullYear() && styles.disabled]}>›</Text>
            </Pressable>
          </View>
          <Text style={styles.yearLabel}>{t.yearTotal}</Text>
          <Text style={styles.yearAmount}>{formatRSD(yearTotal)}</Text>
        </View>

        <View style={wide ? styles.chartColumn : undefined}>
          <Text style={[styles.sectionTitle, wide && styles.sectionTitleTop]}>{t.byMonth}</Text>
          <View style={styles.card}>
            <View style={styles.chart}>
              {Array.from({ length: 12 }, (_, m) => {
                const selected = m === month;
                const value = monthTotal(m);
                return (
                  <Pressable key={m} style={styles.barSlot} onPress={() => setMonth(m)} accessibilityLabel={monthName(m)}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${value > 0 ? Math.max(4, (value / maxMonth) * 100) : 0}%` },
                          selected ? styles.barSelected : null,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, selected && styles.barLabelSelected]}>{monthName(m).slice(0, 3)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.monthSummary}>
              <Text style={styles.monthName}>
                {monthName(month)} {year}.
              </Text>
              <Text style={styles.monthAmount}>{formatRSD(monthTotal(month))}</Text>
            </View>
          </View>
        </View>
      </View>

      {loadError && <Text style={styles.error}>{t.loadError}</Text>}

      <Text style={styles.sectionTitle}>{t.byCategory}</Text>
      {categories.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>{t.noData}</Text>
        </View>
      ) : (
        <>
          <View style={wide ? styles.grid : undefined}>
            {categories.map((c) => (
              <View key={c.name} style={wide ? styles.gridCell : undefined}>
                <CategoryRow {...c} share={categoryTotal > 0 ? c.amount / categoryTotal : 0} />
              </View>
            ))}
          </View>
          <Text style={styles.hint}>{t.trendHint}</Text>
        </>
      )}
    </Screen>
  );
}

function CategoryRow(props: { name: string; amount: number; previous: number; share: number; trend: number[] }) {
  const t = sr.statistics;
  const maxTrend = Math.max(1, ...props.trend);
  let change: { text: string; color: string } | null = null;
  if (props.previous === 0 && props.amount > 0) change = { text: t.newThisMonth, color: colors.textMuted };
  else if (props.previous > 0) {
    const pct = Math.round(((props.amount - props.previous) / props.previous) * 100);
    // More spending is bad news (red), less is good news (green).
    if (pct > 0) change = { text: `▲ ${pct}%`, color: colors.danger };
    else if (pct < 0) change = { text: `▼ ${Math.abs(pct)}%`, color: colors.income };
    else change = { text: '0%', color: colors.textMuted };
  }

  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryTop}>
        <View style={styles.categoryText}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {props.name}
          </Text>
          <Text style={styles.categoryAmount}>{formatRSD(props.amount)}</Text>
          {change && (
            <Text style={[styles.change, { color: change.color }]}>
              {change.text} <Text style={styles.changeHint}>{change.text === t.newThisMonth ? '' : t.vsLastMonth}</Text>
            </Text>
          )}
        </View>
        <View style={styles.trend}>
          {props.trend.map((v, i) => (
            <View
              key={i}
              style={[
                styles.trendBar,
                { height: `${v > 0 ? Math.max(8, (v / maxTrend) * 100) : 4}%` },
                i === props.trend.length - 1 ? styles.trendBarCurrent : null,
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.shareTrack}>
        <View style={[styles.shareFill, { width: `${Math.round(props.share * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
  yearCardWide: { width: 320, marginBottom: 0, justifyContent: 'center' },
  chartColumn: { flex: 1 },
  sectionTitleTop: { marginTop: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridCell: { width: '50%', paddingHorizontal: 6 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, marginBottom: 16 },
  yearCard: { backgroundColor: colors.black, borderRadius: radius.lg, padding: 22, marginBottom: 8 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  yearArrow: { fontFamily: fonts.bold, fontSize: 30, color: colors.accentBright, paddingHorizontal: 8, lineHeight: 32 },
  disabled: { opacity: 0.25 },
  yearText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  yearLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.white, opacity: 0.8 },
  yearAmount: { fontFamily: fonts.bold, fontSize: 30, color: colors.accentBright, marginTop: 4 },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, marginTop: 8 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  chart: { flexDirection: 'row', height: 150, gap: 4 },
  barSlot: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.accent, opacity: 0.35, borderRadius: 6 },
  barSelected: { backgroundColor: colors.black, opacity: 1 },
  barLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.textMuted },
  barLabelSelected: { fontFamily: fonts.bold, color: colors.text },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monthName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, textTransform: 'capitalize' },
  monthAmount: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2, marginLeft: 4 },
  categoryRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, marginBottom: 10, gap: 12 },
  categoryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryText: { flex: 1, gap: 2 },
  categoryName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  categoryAmount: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  change: { fontFamily: fonts.bold, fontSize: 13 },
  changeHint: { fontFamily: fonts.regular, color: colors.textMuted },
  trend: { flexDirection: 'row', alignItems: 'flex-end', height: 40, width: 72, gap: 3 },
  trendBar: { flex: 1, backgroundColor: colors.accent, opacity: 0.35, borderRadius: 3 },
  trendBarCurrent: { backgroundColor: colors.accentBright, opacity: 1 },
  shareTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  shareFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
});
