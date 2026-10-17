import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FormMessage } from '../../../components/FormMessage';
import { Screen } from '../../../components/Screen';
import { sr } from '../../../i18n/sr';
import { CATEGORIES } from '../../../lib/categories';
import { formatDate, formatRSD } from '../../../lib/format';
import { fetchReceipt, ReceiptDetail, updateItemCategory } from '../../../lib/receipts';
import { colors, fonts, radius } from '../../../theme';

const OTHER = 'Остало';

export default function Receipt() {
  const { id, duplicate } = useLocalSearchParams<{ id: string; duplicate?: string }>();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>();
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<string | null>(null);
  const t = sr.receipt;

  useEffect(() => {
    let active = true;
    fetchReceipt(id)
      .then((r) => active && setReceipt(r))
      .catch(() => active && setError(sr.dashboard.loadError));
    return () => {
      active = false;
    };
  }, [id]);

  async function setCategory(itemId: string, category: string) {
    setEditing(null);
    const previous = receipt;
    setReceipt((r) => r && { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, category } : i)) });
    try {
      await updateItemCategory(itemId, category);
    } catch {
      setReceipt(previous);
      setError(sr.profile.errors.save);
    }
  }

  const byCategory = new Map<string, number>();
  for (const item of receipt?.items ?? []) {
    const key = item.category ?? OTHER;
    byCategory.set(key, (byCategory.get(key) ?? 0) + item.total);
  }
  const categoryTotals = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Screen>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))} hitSlop={10}>
        <Text style={styles.back}>‹ {sr.profile.back}</Text>
      </Pressable>

      {duplicate ? <FormMessage info={sr.scan.duplicate} /> : null}
      <FormMessage error={error} />

      {receipt === undefined && !error && <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />}
      {receipt === null && <Text style={styles.muted}>{t.notFound}</Text>}

      {receipt && (
        <>
          <Text style={styles.store}>{receipt.store_name ?? t.title}</Text>
          <Text style={styles.muted}>{formatDate(new Date(receipt.issued_at))}</Text>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t.total}</Text>
            <Text style={styles.totalAmount}>{formatRSD(receipt.total)}</Text>
          </View>

          {categoryTotals.length > 0 && (
            <>
              <Text style={styles.section}>{t.byCategory}</Text>
              <View style={styles.card}>
                {categoryTotals.map(([name, total]) => (
                  <View key={name} style={styles.catRow}>
                    <Text style={styles.catName}>{name}</Text>
                    <Text style={styles.catTotal}>{formatRSD(total)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.section}>{t.items}</Text>
          {receipt.items.length === 0 && <Text style={styles.muted}>{t.noItems}</Text>}
          {receipt.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemText}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.quantity != null && item.unit_price != null && (
                    <Text style={styles.muted}>
                      {item.quantity} {t.quantity} × {formatRSD(item.unit_price)}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemTotal}>{formatRSD(item.total)}</Text>
              </View>
              <Pressable
                onPress={() => setEditing(editing === item.id ? null : item.id)}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel={t.changeCategory}
              >
                <Text style={styles.chipText}>{item.category ?? OTHER} ▾</Text>
              </Pressable>
              {editing === item.id && (
                <View style={styles.choices}>
                  {CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(item.id, c)}
                      style={[styles.choice, c === item.category && styles.choiceActive]}
                    >
                      <Text style={[styles.choiceText, c === item.category && styles.choiceTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accent, marginBottom: 12 },
  store: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  totalCard: { backgroundColor: colors.black, borderRadius: radius.lg, padding: 20, marginTop: 16, marginBottom: 8 },
  totalLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.accentBright },
  totalAmount: { fontFamily: fonts.bold, fontSize: 30, color: colors.white, marginTop: 4 },
  section: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 10 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  catName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, flexShrink: 1 },
  catTotal: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  item: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 10, gap: 10 },
  itemTop: { flexDirection: 'row', gap: 12 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  itemTotal: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F5DE',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accentDark },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  choiceActive: { backgroundColor: colors.black, borderColor: colors.black },
  choiceText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  choiceTextActive: { color: colors.white },
});
