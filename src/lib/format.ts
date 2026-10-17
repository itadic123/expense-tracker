// RSD formatting done by hand so it looks the same on Android (Hermes) and every browser.
export function formatRSD(amount: number, { withDecimals = true } = {}): string {
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(withDecimals ? 2 : 0);
  const [whole, decimals] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const body = decimals ? `${grouped},${decimals}` : grouped;
  return `${negative ? '-' : ''}${body} дин.`;
}

const MONTHS = [
  'јануар', 'фебруар', 'март', 'април', 'мај', 'јун',
  'јул', 'август', 'септембар', 'октобар', 'новембар', 'децембар',
];

export function formatDate(date: Date): string {
  return `${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}.`;
}

export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex];
}

// "15.03.1990" -> "1990-03-15"; undefined if the date is not real.
export function parseSerbianDate(input: string): string | undefined {
  const m = input.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (!m) return undefined;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return undefined;
  if (year < 1900 || d > new Date()) return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// "1990-03-15" -> "15.03.1990."
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}.`;
}

// Accepts "85.000", "85000", "85.000,50" or "85000.50"; undefined if not a non-negative amount.
export function parseAmount(input: string): number | undefined {
  let s = input.replace(/\s|дин\.?|rsd/gi, '');
  if (!s) return undefined;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  return Number(s);
}
