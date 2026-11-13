-- Welcome credit: every account starts with ₦1,000 in its wallet.
-- Run once in the Supabase SQL editor (after schema.sql).
-- Safe to run again: each account gets the credit only once (the reference is unique).

create or replace function public.grant_welcome_credit(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform credit_wallet(p_user_id, 100000, 'welcome_' || p_user_id::text, 'topup');   -- 100000 kobo = ₦1,000
end $$;

-- New accounts (sign-ups, imports, invited beneficiaries) get the credit when their wallet is created.
create or replace function public.create_wallet_for_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into wallets (user_id) values (new.id);
  perform grant_welcome_credit(new.id);
  return new;
end $$;

-- Existing accounts get the credit too.
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.grant_welcome_credit(r.id);
  end loop;
end $$;
