-- Profile photos: public bucket, each user may only write inside their own folder (avatars/<user id>/...).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users upload own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Keep profiles.updated_at current.
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Scanned fiscal receipts. Filled by QR scanning in step 3; the dashboard already reads totals from here.
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  store_name text,
  total numeric(12, 2) not null,
  issued_at timestamptz not null,
  receipt_number text,
  verification_url text,
  created_at timestamptz not null default now(),
  unique (user_id, receipt_number)
);

create index receipts_user_issued_idx on public.receipts (user_id, issued_at desc);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  quantity numeric(12, 3),
  unit_price numeric(12, 2),
  total numeric(12, 2) not null,
  category text
);

create index receipt_items_receipt_idx on public.receipt_items (receipt_id);

alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;

create policy "Users manage own receipts" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own receipt items" on public.receipt_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
