-- 20260403000000_create_players_from_ddl.sql
-- Imported from ddl/001_create_players.sql to ensure migration source parity
CREATE TABLE IF NOT EXISTS public.players (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_name ON public.players (name);
