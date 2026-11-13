-- Top-up reminder emails (every 3 weeks)
-- Run once in the Supabase SQL editor.

alter table public.profiles add column if not exists last_topup_reminder_at timestamptz;

-- Existing clients start their 3-week cycle now, so nobody is emailed the moment this goes live.
update public.profiles set last_topup_reminder_at = now() where last_topup_reminder_at is null;
