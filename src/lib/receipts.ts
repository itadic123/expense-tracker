import { supabase } from './supabase';

export type ReceiptSummary = {
  id: string;
  store_name: string | null;
  total: number;
  issued_at: string;
};

export type SpendingTotals = { month: number; year: number; recent: ReceiptSummary[] };

export async function fetchSpendingTotals(now = new Date()): Promise<SpendingTotals> {
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const { data, error } = await supabase!
    .from('receipts')
    .select('id, store_name, total, issued_at')
    .gte('issued_at', yearStart.toISOString())
    .order('issued_at', { ascending: false });
  if (error) throw error;

  const receipts = data.map((r) => ({ ...r, total: Number(r.total) }));
  let month = 0;
  let year = 0;
  for (const r of receipts) {
    year += r.total;
    const d = new Date(r.issued_at);
    if (d.getMonth() === now.getMonth()) month += r.total;
  }
  return { month, year, recent: receipts.slice(0, 5) };
}

export type ReceiptItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit_price: number | null;
  total: number;
  category: string | null;
};

export type ReceiptDetail = ReceiptSummary & { receipt_number: string | null; items: ReceiptItem[] };

export type ScanResult =
  | { ok: true; id: string; duplicate: boolean }
  | { ok: false; error: 'not_fiscal_receipt' | 'read_failed' | 'save_failed' | 'unknown'; detail?: string };

export function isFiscalReceiptUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'https:' && url.hostname === 'suf.purs.gov.rs';
  } catch {
    return false;
  }
}

// The scan-receipt edge function reads the tax authority's page, saves the receipt and categorizes items.
export async function scanReceipt(url: string): Promise<ScanResult> {
  const { data, error } = await supabase!.functions.invoke('scan-receipt', { body: { url: url.trim() } });
  if (!error && data?.id) return { ok: true, id: data.id, duplicate: Boolean(data.duplicate) };

  // On non-2xx responses the error carries the original Response with our { error } body.
  let code: string | undefined;
  let status: number | undefined;
  try {
    const context = (error as { context?: Response } | null)?.context;
    status = context?.status;
    code = context ? (await context.json()).error : undefined;
  } catch {}
  if (code === 'not_fiscal_receipt' || code === 'read_failed' || code === 'save_failed') return { ok: false, error: code };
  // Shown to the user so a missing or failing server function can be diagnosed from a screenshot.
  const detail = [status && `HTTP ${status}`, code, error?.message].filter(Boolean).join(' · ');
  return { ok: false, error: 'unknown', detail: detail || undefined };
}

export async function fetchReceipt(id: string): Promise<ReceiptDetail | null> {
  const { data, error } = await supabase!
    .from('receipts')
    .select('id, store_name, total, issued_at, receipt_number, receipt_items (id, name, quantity, unit_price, total, category)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { receipt_items, ...receipt } = data;
  return {
    ...receipt,
    total: Number(receipt.total),
    items: (receipt_items ?? []).map((i) => ({
      ...i,
      quantity: i.quantity === null ? null : Number(i.quantity),
      unit_price: i.unit_price === null ? null : Number(i.unit_price),
      total: Number(i.total),
    })),
  };
}

export async function updateItemCategory(itemId: string, category: string): Promise<void> {
  const { error } = await supabase!.from('receipt_items').update({ category }).eq('id', itemId);
  if (error) throw error;
}

// Spending per month ("2026-03") with a per-category split, for the statistics screen.
export type MonthStats = { total: number; byCategory: Record<string, number> };
export type Statistics = Record<string, MonthStats>;

export function monthKey(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Loads the given year plus the 6 months before it, so January can be compared with December
// and every month has a 6-month trend.
export async function fetchStatistics(year: number): Promise<Statistics> {
  const from = new Date(year, -6, 1).toISOString();
  const to = new Date(year + 1, 0, 1).toISOString();
  const [receipts, items] = await Promise.all([
    supabase!.from('receipts').select('total, issued_at').gte('issued_at', from).lt('issued_at', to),
    supabase!
      .from('receipt_items')
      .select('total, category, receipts!inner(issued_at)')
      .gte('receipts.issued_at', from)
      .lt('receipts.issued_at', to),
  ]);
  if (receipts.error) throw receipts.error;
  if (items.error) throw items.error;

  const stats: Statistics = {};
  const month = (iso: string) => {
    const d = new Date(iso);
    return (stats[monthKey(d.getFullYear(), d.getMonth())] ??= { total: 0, byCategory: {} });
  };
  for (const r of receipts.data) month(r.issued_at).total += Number(r.total);
  for (const item of items.data) {
    // Supabase types an embedded row as an array or object depending on the relation; handle both.
    const parent = Array.isArray(item.receipts) ? item.receipts[0] : item.receipts;
    if (!parent) continue;
    const m = month(parent.issued_at);
    const category = item.category ?? 'Остало';
    m.byCategory[category] = (m.byCategory[category] ?? 0) + Number(item.total);
  }
  return stats;
}

export type ReceiptListItem = ReceiptSummary & { item_count: number };

// Every receipt of the year, newest first, for the receipts page.
export async function fetchReceiptsForYear(year: number): Promise<ReceiptListItem[]> {
  const { data, error } = await supabase!
    .from('receipts')
    .select('id, store_name, total, issued_at, receipt_items(count)')
    .gte('issued_at', new Date(year, 0, 1).toISOString())
    .lt('issued_at', new Date(year + 1, 0, 1).toISOString())
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    store_name: r.store_name,
    total: Number(r.total),
    issued_at: r.issued_at,
    item_count: (r.receipt_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}
