ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS tournament_id BIGINT NULL;

UPDATE public.games
SET tournament_id = t.id
FROM public.tournaments t
WHERE t.name = '大会1'
  AND public.games.tournament_id IS NULL;

ALTER TABLE public.games
  ALTER COLUMN tournament_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'games_tournament_id_fkey'
  ) THEN
    ALTER TABLE public.games
      ADD CONSTRAINT games_tournament_id_fkey
      FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON public.games (tournament_id);