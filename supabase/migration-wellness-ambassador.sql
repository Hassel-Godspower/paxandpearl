-- Wellness Ambassador titles + post-treat feedback
-- Run once in the Supabase SQL editor (after schema.sql).

-- 1. Title stored on the profile (updated by the server when earned)
alter table public.profiles add column if not exists wellness_title text;

-- 2. One reflection per booking. Written only by the server (service role).
create table if not exists public.booking_feedback (
  booking_id  uuid primary key references public.bookings(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mood        smallint not null check (mood between 1 and 5),
  comment     text check (char_length(comment) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists booking_feedback_user on public.booking_feedback (user_id, created_at desc);

alter table public.booking_feedback enable row level security;
drop policy if exists "own feedback" on public.booking_feedback;
create policy "own feedback" on public.booking_feedback for select using (user_id = auth.uid());
