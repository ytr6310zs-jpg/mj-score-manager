-- Issue #221: Drop legacy tobashi columns after full application migration.
-- Prerequisite: application code must rely only on tobashi_player_ids.

BEGIN;

ALTER TABLE games
  DROP COLUMN IF EXISTS is_tobashi1,
  DROP COLUMN IF EXISTS is_tobashi2,
  DROP COLUMN IF EXISTS is_tobashi3,
  DROP COLUMN IF EXISTS is_tobashi4,
  DROP COLUMN IF EXISTS tobashi_player,
  DROP COLUMN IF EXISTS tobashi_player_id;

COMMIT;
