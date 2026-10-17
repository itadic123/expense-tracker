// Supabase Edge Function: reads a Serbian fiscal receipt from its QR link, saves it, and categorizes the items.
//
// The QR code on every fiscal receipt points at the tax authority's public verification page
// (https://suf.purs.gov.rs/v/?vl=...). That page shows the store, total, date and receipt number,
// and its item list loads from https://suf.purs.gov.rs/specifications. Browsers can't call it
// directly (CORS), so the app sends the link here.
//
// Secrets: ANTHROPIC_API_KEY (optional; without it items are categorized by keywords only).
// SUPABASE_URL and SUPABASE_ANON_KEY are provided by Supabase automatically.

import Anthropic from 'npm:@anthropic-ai/sdk';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod';

// Keep in sync with src/lib/categories.ts.
const CATEGORIES = [
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
type Category = (typeof CATEGORIES)[number];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Item = { name: string; quantity: number | null; unit_price: number | null; total: number };

type ParsedReceipt = {
  store_name: string | null;
  total: number;
  issued_at: string;
  receipt_number: string | null;
  items: Item[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function labelText(html: string, id: string): string | null {
  const m = html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`));
  return m ? decodeHtml(m[1]) || null : null;
}

// "1.234,56" -> 1234.56
function parseSerbianNumber(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// "17.10.2026. 18:45:12" (Belgrade time) -> ISO string
function parseSerbianDateTime(s: string | null): string | null {
  const m = s?.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, d, mo, y, h, mi, se] = m.map(Number);
  // Serbia is UTC+1 in winter and UTC+2 in summer; pick the offset that applies on that date.
  const probe = new Date(Date.UTC(y, mo - 1, d, h, mi, se));
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Belgrade', timeZoneName: 'shortOffset' })
    .formatToParts(probe)
    .find((p) => p.type === 'timeZoneName')?.value; // e.g. "GMT+2"
  const offsetHours = Number(tzName?.replace('GMT', '') || 1);
  return new Date(probe.getTime() - offsetHours * 3600_000).toISOString();
}

function isVerificationUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'https:' && url.hostname === 'suf.purs.gov.rs' ? url : null;
  } catch {
    return null;
  }
}

async function readReceipt(url: URL): Promise<ParsedReceipt> {
  const page = await fetch(url, { headers: { Accept: 'text/html', 'Accept-Language': 'sr' } });
  if (!page.ok) throw new Error(`verification page returned ${page.status}`);
  const html = await page.text();

  const total = parseSerbianNumber(labelText(html, 'totalAmountLabel'));
  const issued_at = parseSerbianDateTime(labelText(html, 'sdcDateTimeLabel'));
  if (total === null || !issued_at) throw new Error('could not read total or date from the verification page');

  const receipt_number = labelText(html, 'invoiceNumberLabel');
  const store_name = labelText(html, 'shopFullNameLabel') ?? labelText(html, 'businessNameLabel');

  let items: Item[] = [];
  const token = html.match(/viewModel\.Token\('([^']+)'\)/)?.[1];
  if (receipt_number && token) {
    const spec = await fetch('https://suf.purs.gov.rs/specifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ invoiceNumber: receipt_number, token }),
    });
    if (spec.ok) {
      const data = await spec.json();
      if (data?.success && Array.isArray(data.items)) {
        items = data.items.map((i: Record<string, unknown>) => ({
          name: String(i.name ?? '').trim(),
          quantity: typeof i.quantity === 'number' ? i.quantity : null,
          unit_price: typeof i.unitPrice === 'number' ? i.unitPrice : null,
          total: typeof i.total === 'number' ? i.total : 0,
        }));
      }
    }
  }

  return { store_name, total, issued_at, receipt_number, items };
}

// Fallback when Claude isn't configured or fails. Matches on lowercase Cyrillic and Latin stems.
const KEYWORDS: [Category, RegExp][] = [
  ['Пиће', /вода|сок|пиво|вино|ракиј|кафа|чај|кока|coca|pepsi|воде|напит|energy|енерги/i],
  ['Хигијена и козметика', /шампон|сапун|паста за зуб|четкиц|дезодоран|пелен|тоалет|папир|улошц|крем|гел за туш|maramic|марамиц/i],
  ['Домаћинство', /детерџ|омекшив|прашак|сунђер|кес[еа]|фолиј|салвет|сијалиц|батериј|средство/i],
  ['Гориво и превоз', /еуродизел|дизел|бмб|бензин|гас|тнг|lpg|eurodiesel|diesel|gorivo|паркинг|карта/i],
  ['Здравље и апотека', /таблет|сируп|капи|лек|витамин|бруфен|аспирин|андол|фластер|маст/i],
  ['Ресторани и кафићи', /пица|плескав|ћевап|сендвич|еспресо|капучино|кафа са|menu|мени/i],
  ['Храна', /хлеб|млеко|јогурт|сир|јаја|месо|пилећ|свињ|јунећ|кобас|шунк|паштет|брашно|шећер|со |уље|пиринач|тестен|банан|јабук|кромпир|парадајз|лук|чоколад|кекс|чипс|смоки|бурек|кифл|павлак|маргарин|путер|риба|туњевин/i],
];

function keywordCategory(name: string): Category {
  for (const [category, re] of KEYWORDS) if (re.test(name)) return category;
  return 'Остало';
}

// Claude Haiku sorts the item names into the fixed category list in one call.
async function categorize(items: Item[], storeName: string | null): Promise<Category[]> {
  const fallback = items.map((i) => keywordCategory(i.name));
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey || items.length === 0) return fallback;

  try {
    const client = new Anthropic({ apiKey });
    const schema = z.object({
      categories: z.array(z.object({ index: z.number().int(), category: z.enum(CATEGORIES) })),
    });
    const list = items.map((i, n) => `${n}: ${i.name}`).join('\n');
    const response = await client.messages.parse({
      model: 'claude-haiku-5-5',
      max_tokens: 4096,
      output_config: { effort: 'low', format: zodOutputFormat(schema) },
      system:
        'You categorize line items from Serbian fiscal receipts. Item names are abbreviated, in Serbian ' +
        '(Cyrillic or Latin), often with sizes, units and tax labels such as "/KOM" or "(Ђ)". ' +
        `Assign every item exactly one category from this list: ${CATEGORIES.join(', ')}. ` +
        'Use "Остало" only when nothing else fits.',
      messages: [
        {
          role: 'user',
          content: `Store: ${storeName ?? 'unknown'}\nItems (index: name):\n${list}`,
        },
      ],
    });
    const parsed = response.parsed_output;
    if (response.stop_reason === 'refusal' || !parsed) return fallback;
    const result = [...fallback];
    for (const { index, category } of parsed.categories) {
      if (index >= 0 && index < result.length) result[index] = category;
    }
    return result;
  } catch (err) {
    console.error('categorization failed, using keywords', err);
    return fallback;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  // Acts as the signed-in user, so row level security applies to every insert.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);

  const { url: rawUrl } = await req.json().catch(() => ({ url: null }));
  const url = typeof rawUrl === 'string' ? isVerificationUrl(rawUrl) : null;
  if (!url) return json({ error: 'not_fiscal_receipt' }, 400);

  let receipt: ParsedReceipt;
  try {
    receipt = await readReceipt(url);
  } catch (err) {
    console.error('reading receipt failed', err);
    return json({ error: 'read_failed' }, 502);
  }

  if (receipt.receipt_number) {
    const { data: existing } = await supabase
      .from('receipts')
      .select('id')
      .eq('receipt_number', receipt.receipt_number)
      .maybeSingle();
    if (existing) return json({ id: existing.id, duplicate: true });
  }

  const categories = await categorize(receipt.items, receipt.store_name);

  const { data: saved, error: insertError } = await supabase
    .from('receipts')
    .insert({
      store_name: receipt.store_name,
      total: receipt.total,
      issued_at: receipt.issued_at,
      receipt_number: receipt.receipt_number,
      verification_url: url.toString(),
    })
    .select('id')
    .single();
  if (insertError) {
    console.error('insert receipt failed', insertError);
    return json({ error: 'save_failed' }, 500);
  }

  if (receipt.items.length) {
    const { error: itemsError } = await supabase.from('receipt_items').insert(
      receipt.items.map((item, n) => ({ ...item, receipt_id: saved.id, category: categories[n] })),
    );
    if (itemsError) console.error('insert items failed', itemsError);
  }

  return json({ id: saved.id, duplicate: false, itemCount: receipt.items.length });
});
