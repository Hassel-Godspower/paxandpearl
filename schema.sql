-- Pax & Pearl Wellness Wallet: Supabase schema (v2, fitted to the existing site)
-- Run once in the Supabase SQL editor on a fresh project.
-- Amounts are stored in kobo (NGN x 100). Services are NOT stored here: prices come from
-- /catalog.json and are re-checked on the server for every booking.
--
-- Money only moves through the functions at the bottom, and only the server
-- (service role) can call them. The browser can read its own rows, never write balances.

create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text not null unique,          -- normalised: +2348012345678
  avatar_url  text,
  status      text not null default 'active' check (status in ('active','invited')),
  created_at  timestamptz not null default now()
);
create index on public.profiles (lower(email));

create table public.wallets (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  balance_kobo  bigint not null default 0 check (balance_kobo >= 0),
  updated_at    timestamptz not null default now()
);

create table public.wallet_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id),
  type             text not null check (type in ('topup','booking','transfer_in','transfer_out','refund')),
  amount_kobo      bigint not null check (amount_kobo > 0),
  balance_after    bigint not null,
  reference        text not null unique,    -- unique => retries can never double-apply
  counterparty_id  uuid references public.profiles(id),
  meta             jsonb not null default '{}',
  created_at       timestamptz not null default now()
);
create index on public.wallet_transactions (user_id, created_at desc);

create table public.beneficiaries (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  beneficiary_user_id  uuid not null references public.profiles(id),
  created_at           timestamptz not null default now(),
  unique (owner_id, beneficiary_user_id),
  check (owner_id <> beneficiary_user_id)
);

create table public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id),   -- null for guests paying directly
  customer_name      text not null,
  customer_email     text not null,
  customer_phone     text not null,
  items              jsonb not null,                         -- [{id,name,price,duration}] price in NGN
  preferred_date     date not null,
  preferred_time     time not null,
  amount_kobo        bigint not null check (amount_kobo > 0),
  payment_method     text not null check (payment_method in ('wallet','paystack')),
  status             text not null default 'pending_payment'
                     check (status in ('pending_payment','paid','confirmed','cancelled','completed')),
  paystack_reference text unique,
  created_at         timestamptz not null default now()
);
create index on public.bookings (user_id, created_at desc);

-- Every Paystack checkout we start is recorded first; the webhook trusts THIS row, not the client.
create table public.paystack_payments (
  reference       text primary key,
  purpose         text not null check (purpose in ('topup','fund_beneficiary','booking')),
  payer_id        uuid references public.profiles(id),
  target_user_id  uuid references public.profiles(id),   -- wallet to credit (topup / fund_beneficiary)
  booking_id      uuid references public.bookings(id),
  amount_kobo     bigint not null check (amount_kobo > 0),
  status          text not null default 'pending' check (status in ('pending','paid')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,       -- 'added_as_beneficiary' | 'wallet_funded'
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- ---------- Row level security ----------

alter table public.profiles            enable row level security;
alter table public.wallets             enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.beneficiaries       enable row level security;
alter table public.bookings            enable row level security;
alter table public.paystack_payments   enable row level security;  -- no policies: server only
alter table public.notifications       enable row level security;

create policy "own profile"        on public.profiles            for select using (id = auth.uid());
create policy "own wallet"         on public.wallets             for select using (user_id = auth.uid());
create policy "own transactions"   on public.wallet_transactions for select using (user_id = auth.uid());
create policy "own beneficiaries"  on public.beneficiaries       for select using (owner_id = auth.uid());
create policy "own bookings"       on public.bookings            for select using (user_id = auth.uid());
create policy "own notifications"  on public.notifications       for select using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Browser may only flip the "read" flag on notifications, and edit name/avatar on profiles.
revoke update on public.notifications from authenticated;
grant  update (read) on public.notifications to authenticated;
revoke update on public.profiles from authenticated;
grant  update (full_name, avatar_url) on public.profiles to authenticated;
create policy "edit own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- Money functions (service role only) ----------

-- Credit a wallet. A repeated reference is ignored, so webhook retries cannot double-credit.
create or replace function public.credit_wallet(
  p_user_id uuid, p_amount_kobo bigint, p_reference text, p_type text, p_payer_id uuid default null
) returns bigint language plpgsql security definer set search_path = public as $$
declare new_balance bigint; payer_name text;
begin
  if p_amount_kobo <= 0 then raise exception 'invalid amount'; end if;
  begin
    update wallets set balance_kobo = balance_kobo + p_amount_kobo, updated_at = now()
     where user_id = p_user_id returning balance_kobo into new_balance;
    if not found then raise exception 'wallet not found'; end if;

    insert into wallet_transactions (user_id, type, amount_kobo, balance_after, reference, counterparty_id)
    values (p_user_id, p_type, p_amount_kobo, new_balance, p_reference, p_payer_id);
  exception when unique_violation then
    -- same reference seen before: undo this attempt's update and report the current balance
    select balance_kobo into new_balance from wallets where user_id = p_user_id;
    return new_balance;
  end;

  if p_type = 'transfer_in' and p_payer_id is not null then
    select full_name into payer_name from profiles where id = p_payer_id;
    insert into notifications (user_id, type, message)
    values (p_user_id, 'wallet_funded',
            payer_name || ' added ₦' || to_char(p_amount_kobo / 100, 'FM999,999,999') || ' to your Wellness Wallet.');
  end if;
  return new_balance;
end $$;

-- Pay for a booking from the wallet. Atomic: fails if the balance is too low.
create or replace function public.book_with_wallet(
  p_user_id uuid, p_amount_kobo bigint, p_items jsonb,
  p_name text, p_email text, p_phone text, p_date date, p_time time
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_balance bigint; booking_id uuid := gen_random_uuid();
begin
  update wallets set balance_kobo = balance_kobo - p_amount_kobo, updated_at = now()
   where user_id = p_user_id and balance_kobo >= p_amount_kobo returning balance_kobo into new_balance;
  if not found then raise exception 'insufficient wallet balance'; end if;

  insert into bookings (id, user_id, customer_name, customer_email, customer_phone, items,
                        preferred_date, preferred_time, amount_kobo, payment_method, status)
  values (booking_id, p_user_id, p_name, p_email, p_phone, p_items, p_date, p_time, p_amount_kobo, 'wallet', 'paid');

  insert into wallet_transactions (user_id, type, amount_kobo, balance_after, reference, meta)
  values (p_user_id, 'booking', p_amount_kobo, new_balance, 'booking_' || booking_id,
          jsonb_build_object('booking_id', booking_id));
  return booking_id;
end $$;

-- Move money from the owner's wallet into a beneficiary's wallet; the beneficiary is notified.
create or replace function public.fund_beneficiary_from_wallet(
  p_owner_id uuid, p_beneficiary_user_id uuid, p_amount_kobo bigint
) returns void language plpgsql security definer set search_path = public as $$
declare owner_balance bigint; ref text := 'xfer_' || gen_random_uuid();
begin
  if p_amount_kobo <= 0 then raise exception 'invalid amount'; end if;
  if not exists (select 1 from beneficiaries
                  where owner_id = p_owner_id and beneficiary_user_id = p_beneficiary_user_id) then
    raise exception 'not a beneficiary';
  end if;

  update wallets set balance_kobo = balance_kobo - p_amount_kobo, updated_at = now()
   where user_id = p_owner_id and balance_kobo >= p_amount_kobo returning balance_kobo into owner_balance;
  if not found then raise exception 'insufficient wallet balance'; end if;

  insert into wallet_transactions (user_id, type, amount_kobo, balance_after, reference, counterparty_id)
  values (p_owner_id, 'transfer_out', p_amount_kobo, owner_balance, ref || '_out', p_beneficiary_user_id);

  perform credit_wallet(p_beneficiary_user_id, p_amount_kobo, ref || '_in', 'transfer_in', p_owner_id);
end $$;

-- Add a beneficiary and notify them (only the first time).
create or replace function public.add_beneficiary(p_owner_id uuid, p_beneficiary_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare owner_name text;
begin
  insert into beneficiaries (owner_id, beneficiary_user_id)
  values (p_owner_id, p_beneficiary_user_id) on conflict do nothing;
  if found then
    select full_name into owner_name from profiles where id = p_owner_id;
    insert into notifications (user_id, type, message)
    values (p_beneficiary_user_id, 'added_as_beneficiary',
            owner_name || ' added you as a Wellness Wallet beneficiary.');
  end if;
end $$;

-- Called by the Paystack webhook after the signature check. Idempotent.
create or replace function public.settle_payment(p_reference text, p_paid_kobo bigint)
returns void language plpgsql security definer set search_path = public as $$
declare pay paystack_payments%rowtype;
begin
  select * into pay from paystack_payments where reference = p_reference for update;
  if not found then raise exception 'unknown payment reference'; end if;
  if pay.status = 'paid' then return; end if;
  if p_paid_kobo <> pay.amount_kobo then raise exception 'amount mismatch'; end if;

  if pay.purpose = 'topup' then
    perform credit_wallet(pay.target_user_id, pay.amount_kobo, 'ps_' || pay.reference, 'topup');
  elsif pay.purpose = 'fund_beneficiary' then
    perform credit_wallet(pay.target_user_id, pay.amount_kobo, 'ps_' || pay.reference, 'transfer_in', pay.payer_id);
  elsif pay.purpose = 'booking' then
    update bookings set status = 'paid' where id = pay.booking_id and status = 'pending_payment';
  end if;

  update paystack_payments set status = 'paid', paid_at = now() where reference = p_reference;
end $$;

-- Cancel a wallet-paid booking and put the money back (run by you / future admin tool).
create or replace function public.refund_wallet_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found or b.payment_method <> 'wallet' or b.status not in ('paid','confirmed') then
    raise exception 'booking not refundable';
  end if;
  perform credit_wallet(b.user_id, b.amount_kobo, 'refund_' || b.id, 'refund');
  update bookings set status = 'cancelled' where id = b.id;
end $$;

-- Lock every money function to the server
revoke execute on function public.credit_wallet(uuid,bigint,text,text,uuid)                 from public, anon, authenticated;
revoke execute on function public.book_with_wallet(uuid,bigint,jsonb,text,text,text,date,time) from public, anon, authenticated;
revoke execute on function public.fund_beneficiary_from_wallet(uuid,uuid,bigint)            from public, anon, authenticated;
revoke execute on function public.add_beneficiary(uuid,uuid)                                from public, anon, authenticated;
revoke execute on function public.settle_payment(text,bigint)                               from public, anon, authenticated;
revoke execute on function public.refund_wallet_booking(uuid)                               from public, anon, authenticated;
grant  execute on function public.credit_wallet(uuid,bigint,text,text,uuid)                 to service_role;
grant  execute on function public.book_with_wallet(uuid,bigint,jsonb,text,text,text,date,time) to service_role;
grant  execute on function public.fund_beneficiary_from_wallet(uuid,uuid,bigint)            to service_role;
grant  execute on function public.add_beneficiary(uuid,uuid)                                to service_role;
grant  execute on function public.settle_payment(text,bigint)                               to service_role;
grant  execute on function public.refund_wallet_booking(uuid)                               to service_role;

-- ---------- Triggers ----------

-- Every new profile gets an empty wallet
create or replace function public.create_wallet_for_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into wallets (user_id) values (new.id); return new; end $$;
create trigger trg_profile_wallet after insert on public.profiles
for each row execute function public.create_wallet_for_profile();

-- An invited beneficiary becomes 'active' the first time they sign in
create or replace function public.activate_profile_on_login() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.last_sign_in_at is not null then
    update public.profiles set status = 'active' where id = new.id and status = 'invited';
  end if;
  return new;
end $$;
create trigger trg_activate_on_login after update of last_sign_in_at on auth.users
for each row execute function public.activate_profile_on_login();
