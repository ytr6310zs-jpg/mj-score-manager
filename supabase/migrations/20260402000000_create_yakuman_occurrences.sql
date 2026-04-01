-- 20260402000000_create_yakuman_occurrences.sql
-- Stores occurrences of yakuman (kazoe/role) in games
CREATE TABLE public.yakuman_occurrences (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  yakuman_code TEXT NOT NULL,
  yakuman_name TEXT NOT NULL,
  points INTEGER,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yakuman_occurrences_player_id ON public.yakuman_occurrences (player_id);
CREATE INDEX IF NOT EXISTS idx_yakuman_occurrences_game_id ON public.yakuman_occurrences (game_id);

-- Optional: for fast aggregate counts per player
CREATE INDEX IF NOT EXISTS idx_yakuman_occurrences_player_code ON public.yakuman_occurrences (player_id, yakuman_code);
