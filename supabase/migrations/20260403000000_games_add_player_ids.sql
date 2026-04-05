-- 20260403000000_games_add_player_ids.sql
-- Issue #57: games テーブルにプレイヤー参照 ID 列を追加する。
-- 既存の player 名列はスナップショットとして残す（非破壊マイグレーション）。

-- player 参加者 ID 列
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS player1_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player2_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player3_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS player4_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL;

-- 派生参照 ID 列（トップ・ラス・飛び・飛ばし）
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS top_player_id    BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_player_id   BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tobi_player_id   BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tobashi_player_id BIGINT NULL REFERENCES public.players(id) ON DELETE SET NULL;

-- 焼き鳥は複数人を取りうるため jsonb 配列で管理する。
-- 既存の yakitori_players (text) はスナップショットとして残す。
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS yakitori_player_ids JSONB NULL;

-- インデックス（参加者 ID）
CREATE INDEX IF NOT EXISTS idx_games_player1_id ON public.games (player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2_id ON public.games (player2_id);
CREATE INDEX IF NOT EXISTS idx_games_player3_id ON public.games (player3_id);
CREATE INDEX IF NOT EXISTS idx_games_player4_id ON public.games (player4_id);

-- インデックス（派生参照）
CREATE INDEX IF NOT EXISTS idx_games_top_player_id      ON public.games (top_player_id);
CREATE INDEX IF NOT EXISTS idx_games_last_player_id     ON public.games (last_player_id);
CREATE INDEX IF NOT EXISTS idx_games_tobi_player_id     ON public.games (tobi_player_id);
CREATE INDEX IF NOT EXISTS idx_games_tobashi_player_id  ON public.games (tobashi_player_id);

-- GIN インデックス（焼き鳥 ID 配列）
CREATE INDEX IF NOT EXISTS idx_games_yakitori_player_ids ON public.games USING GIN (yakitori_player_ids);
