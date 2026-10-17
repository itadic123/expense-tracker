# Трошкомер — expense tracker

Expense tracking app for Android and web, in Serbian Cyrillic with amounts in RSD. One Expo (React Native) codebase builds both; Supabase provides accounts and data.

## Status

- [x] Step 1: welcome, sign up and login (email + Google)
- [ ] Step 2: profile (photo, full name, date of birth, monthly earnings) and dashboard (monthly and annual totals)
- [ ] Step 3: fiscal receipt QR scanning, saved receipts and items, categorization with Claude Haiku
- [ ] Step 4: web deploy, Android build, visual polish

## Run it

```bash
npm install
cp .env.example .env   # then fill in the Supabase URL and anon key
npm run web            # or: npm run android
```

## Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_profiles.sql`.
3. Copy the project URL and anon key (Project Settings → API) into `.env`.
4. For Google login: Authentication → Providers → Google, add a Google OAuth client ID and secret, and add `expensetracker://` and your web URL under Authentication → URL Configuration → Redirect URLs.

## Layout

- `src/app/` — screens (Expo Router)
- `src/i18n/sr.ts` — all user-facing text
- `src/lib/format.ts` — RSD and date formatting
- `src/theme.ts` — colors and fonts from the design reference
- `supabase/migrations/` — database schema
