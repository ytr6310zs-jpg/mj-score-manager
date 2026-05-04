-- Backfill tobashi_player_ids from legacy tobashi_player_id column
-- Records created before the multi-tobashi migration have tobashi_player_ids = '[]'
-- but may have tobashi_player_id set (single tobashi player).
-- This migration copies the single ID into the array for backward compatibility.

-- Step 1: Backfill from legacy tobashi_player_id (single tobashi, pre-multi-tobashi data)
UPDATE games
SET tobashi_player_ids = jsonb_build_array(tobashi_player_id)
WHERE tobashi_player_id IS NOT NULL
  AND (tobashi_player_ids IS NULL OR tobashi_player_ids = '[]'::jsonb);

-- Step 2: Fix records where tobashi_player_ids was stored as a JSON string (e.g. '"[4,5]"')
-- instead of a proper jsonb array. This happened when JSON.stringify was called before INSERT.
UPDATE games
SET tobashi_player_ids = (tobashi_player_ids #>> '{}')::jsonb
WHERE jsonb_typeof(tobashi_player_ids) = 'string';
