-- Wellness Wallet: auto top-up, receipts, gift notes, birthdays.
-- Run once in the Supabase SQL editor (after schema.sql and earlier migrations).

-- Receipts: remember when a top-up receipt was sent, so retries never send it twice.
alter table public.paystack_payments add column if not exists receipt_sent_at timestamptz;

-- Special dates for the "Gift moments" reminders.
alter table public.profiles add column if not exists birthday date;

-- Saved card for auto top-up. Clients can't read this table directly (it holds a card authorization code).
create table if not exists public.wallet_cards (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  authorization_code text not null,
  card_last4         text,
  card_brand         text,
  created_at         timestamptz not null default now()
);
alter table public.wallet_cards enable row level security;

-- Monthly auto top-up settings. Clients may read their own row.
create table if not exists public.wallet_autopay (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  amount_kobo   bigint not null check (amount_kobo between 100000 and 100000000),  -- ₦1,000 to ₦1,000,000
  active        boolean not null default false,
  next_run_on   date,
  failures      int not null default 0,
  updated_at    timestamptz not null default now()
);
alter table public.wallet_autopay enable row level security;
drop policy if exists "own autopay" on public.wallet_autopay;
create policy "own autopay" on public.wallet_autopay for select using (user_id = auth.uid());

-- Gifts: a shareable card with a personal note, created when a beneficiary is funded from the wallet.
create table if not exists public.gifts (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references public.profiles(id) on delete cascade,
  to_user      uuid not null references public.profiles(id) on delete cascade,
  amount_kobo  bigint not null check (amount_kobo > 0),
  note         text check (char_length(note) <= 280),
  share_token  text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at   timestamptz not null default now()
);
alter table public.gifts enable row level security;   -- served only by the API (service role)
