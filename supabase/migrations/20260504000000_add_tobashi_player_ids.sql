-- Add tobashi_player_ids column to support multiple tobashi players (issue #210)
-- Backward compatible: existing tobashi_player and tobashi_player_id columns are preserved

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS tobashi_player_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN games.tobashi_player_ids IS 'Array of player IDs who performed tobashi (飛ばし). Replaces single tobashi_player_id for multi-player support.';
