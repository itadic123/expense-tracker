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
