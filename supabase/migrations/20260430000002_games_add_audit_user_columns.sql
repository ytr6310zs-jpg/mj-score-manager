ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_games_created_by_user_id ON public.games (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_games_updated_by_user_id ON public.games (updated_by_user_id);
