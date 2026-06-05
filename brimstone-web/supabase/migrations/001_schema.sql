-- Brimstone database schema for Supabase PostgreSQL
-- Run via: supabase db push, or paste into Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users (extends Supabase auth.users) ─────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  polar_customer_id TEXT UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Subscriptions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  polar_subscription_id TEXT UNIQUE,
  polar_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Flame state (one row per user) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.flame_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  flame_intensity REAL NOT NULL DEFAULT 0.5,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  death_count INTEGER NOT NULL DEFAULT 0,
  last_decay_date DATE,
  last_completion_date TIMESTAMPTZ
);

-- ── Commitments (oaths) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  icon TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Embers (completion records) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.embers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  gain REAL NOT NULL DEFAULT 0,
  completed_date DATE NOT NULL
);

-- ── Decay log (audit trail) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decay_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  decay_date DATE NOT NULL,
  amount REAL NOT NULL,
  reason TEXT NOT NULL
);

-- ══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (safety net)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flame_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decay_log ENABLE ROW LEVEL SECURITY;

-- Each user can only see their own rows
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'users') THEN
    CREATE POLICY user_isolation ON public.users FOR ALL USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'subscriptions') THEN
    CREATE POLICY user_isolation ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'flame_state') THEN
    CREATE POLICY user_isolation ON public.flame_state FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'commitments') THEN
    CREATE POLICY user_isolation ON public.commitments FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'embers') THEN
    CREATE POLICY user_isolation ON public.embers FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policname = 'user_isolation' AND tablename = 'decay_log') THEN
    CREATE POLICY user_isolation ON public.decay_log FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create user + flame_state on signup
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.flame_state (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
