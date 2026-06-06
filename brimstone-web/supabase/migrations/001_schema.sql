-- Brimstone schema v1. Run in Supabase SQL Editor or via supabase db push.
-- Enables RLS on every table as a safety net (API routes enforce auth).

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase auth.users) ────────────────────────

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  polar_customer_id text unique,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

-- ── Subscriptions ──────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  polar_subscription_id text unique,
  polar_price_id text,
  status text not null default 'inactive',
    -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
    -- | 'incomplete' | 'incomplete_expired' | 'inactive'
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ── Flame State (one per user) ─────────────────────────────────

create table if not exists public.flame_state (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  flame_intensity real not null default 0.5,
  streak_days integer not null default 0,
  longest_streak integer not null default 0,
  death_count integer not null default 0,
  last_decay_date date,
  last_completion_date timestamptz
);

-- ── Commitments (oaths) ────────────────────────────────────────

create table if not exists public.commitments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  frequency text not null default 'daily',
    -- 'daily' | 'weekdays' | 'weekly'
  icon text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Embers (completion records) ────────────────────────────────

create table if not exists public.embers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  gain real not null default 0,
  completed_date date not null
);

-- ── Decay Log (audit trail) ────────────────────────────────────

create table if not exists public.decay_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  decay_date date not null,
  amount real not null,
  reason text not null
);

-- ── Row-Level Security ─────────────────────────────────────────

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.flame_state enable row level security;
alter table public.commitments enable row level security;
alter table public.embers enable row level security;
alter table public.decay_log enable row level security;

-- Each user can only see their own rows
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'users') then
    create policy user_isolation on public.users for all using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'subscriptions') then
    create policy user_isolation on public.subscriptions for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'flame_state') then
    create policy user_isolation on public.flame_state for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'commitments') then
    create policy user_isolation on public.commitments for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'embers') then
    create policy user_isolation on public.embers for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'user_isolation' and tablename = 'decay_log') then
    create policy user_isolation on public.decay_log for all using (auth.uid() = user_id);
  end if;
end;
$$;

-- ── Auto-create user row + flame_state on signup ───────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  insert into public.flame_state (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists to avoid duplicate trigger errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
