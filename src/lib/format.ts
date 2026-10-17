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
