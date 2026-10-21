# Трошкомер — expense tracker

Expense tracking app for Android and web, in Serbian Cyrillic with amounts in RSD. One Expo (React Native) codebase builds both; Supabase provides accounts and data.

## Status

- [x] Step 1: welcome, sign up and login (email + Google)
- [x] Step 2: profile (photo, full name, date of birth, monthly earnings) and dashboard (monthly and annual totals)
- [x] Step 3: fiscal receipt QR scanning, saved receipts and items, categorization with Claude Haiku
- [ ] Step 4: web deploy, Android build, visual polish

## Run it

```bash
npm install
cp .env.example .env   # then fill in the Supabase URL and anon key
npm run web            # or: npm run android
```

Testing on a phone with Expo Go, step by step: [docs/expo-go-testing.md](docs/expo-go-testing.md).

## Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run each file in `supabase/migrations/` in order (`0001_…`, then `0002_…`).
3. Copy the project URL and anon key (Project Settings → API) into `.env`.
4. Receipt scanning: Edge Functions → Deploy a new function → Via editor. Name it `scan-receipt`, paste `supabase/functions/scan-receipt/index.ts`, and deploy. Then Edge Functions → Secrets → add `ANTHROPIC_API_KEY` (from console.anthropic.com) so Claude Haiku categorizes items; without it, keyword rules are used.
5. For Google login: Authentication → Providers → Google, add a Google OAuth client ID and secret, and add `expensetracker://` and your web URL under Authentication → URL Configuration → Redirect URLs.

## Layout

- `src/app/` — screens (Expo Router)
- `src/i18n/sr.ts` — all user-facing text
- `src/lib/format.ts` — RSD and date formatting
- `src/theme.ts` — colors and fonts from the design reference
- `supabase/migrations/` — database schema
