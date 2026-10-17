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
