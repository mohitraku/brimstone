-- Global events table for the bell system
-- Stores only anonymous completion pings — no user_id, no task data
CREATE TABLE IF NOT EXISTS public.global_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL DEFAULT 'completion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_events;

-- RLS: anonymous access (no PII in this table)
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_events_insert" ON public.global_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_events_select" ON public.global_events
  FOR SELECT USING (true);
