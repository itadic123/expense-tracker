// Keep in sync with CATEGORIES in supabase/functions/scan-receipt/index.ts.
export const CATEGORIES = [
  'Храна',
  'Пиће',
  'Хигијена и козметика',
  'Домаћинство',
  'Гориво и превоз',
  'Здравље и апотека',
  'Одећа и обућа',
  'Техника',
  'Ресторани и кафићи',
  'Остало',
] as const;

export type Category = (typeof CATEGORIES)[number];
