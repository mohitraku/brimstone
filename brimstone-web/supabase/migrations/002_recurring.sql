-- Brimstone schema v2 — recurring commitments + remove iconography.
-- Run in Supabase SQL Editor or via supabase db push after 001_schema.sql.

-- 1. Add new recurrence columns
alter table public.commitments
  add column if not exists recurrence_days smallint[],
  add column if not exists recurrence_dates smallint[];

-- 2. Migrate existing frequency data
-- weekdays → recurring with Mon-Fri (days 1-5 where 0=Sun)
update public.commitments
set recurrence_days = array[1,2,3,4,5], frequency = 'recurring'
where frequency = 'weekdays';

-- weekly → recurring with Sunday only (day 0)
update public.commitments
set recurrence_days = array[0], frequency = 'recurring'
where frequency = 'weekly';

-- 3. Drop the icon column (user wants no emoji sigils)
alter table public.commitments
  drop column if exists icon;

-- 4. Enforce frequency to only 'daily' or 'recurring'
alter table public.commitments
  drop constraint if exists commitments_frequency_check;

alter table public.commitments
  add constraint commitments_frequency_check
  check (frequency in ('daily', 'recurring'));

-- 5. RLS policy already covers commitments — no new tables, no policy update needed.
-- The existing user_isolation policy on commitments still applies.
