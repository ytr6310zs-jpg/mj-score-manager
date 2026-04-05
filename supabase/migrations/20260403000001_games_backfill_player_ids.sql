-- 20260403000001_games_backfill_player_ids.sql
-- Issue #57: 既存の games 行に player ID を players.name 完全一致で埋める。
-- 一致しない name・空文字・欠損は NULL のまま残す（非破壊）。

-- player1_id .. player4_id のバックフィル
UPDATE public.games g
SET player1_id = p.id
FROM public.players p
WHERE g.player1_id IS NULL
  AND g.player1 IS NOT NULL
  AND g.player1 <> ''
  AND p.name = g.player1;

UPDATE public.games g
SET player2_id = p.id
FROM public.players p
WHERE g.player2_id IS NULL
  AND g.player2 IS NOT NULL
  AND g.player2 <> ''
  AND p.name = g.player2;

UPDATE public.games g
SET player3_id = p.id
FROM public.players p
WHERE g.player3_id IS NULL
  AND g.player3 IS NOT NULL
  AND g.player3 <> ''
  AND p.name = g.player3;

UPDATE public.games g
SET player4_id = p.id
FROM public.players p
WHERE g.player4_id IS NULL
  AND g.player4 IS NOT NULL
  AND g.player4 <> ''
  AND p.name = g.player4;

-- top_player_id / last_player_id / tobi_player_id / tobashi_player_id のバックフィル
UPDATE public.games g
SET top_player_id = p.id
FROM public.players p
WHERE g.top_player_id IS NULL
  AND g.top_player IS NOT NULL
  AND g.top_player <> ''
  AND p.name = g.top_player;

UPDATE public.games g
SET last_player_id = p.id
FROM public.players p
WHERE g.last_player_id IS NULL
  AND g.last_player IS NOT NULL
  AND g.last_player <> ''
  AND p.name = g.last_player;

UPDATE public.games g
SET tobi_player_id = p.id
FROM public.players p
WHERE g.tobi_player_id IS NULL
  AND g.tobi_player IS NOT NULL
  AND g.tobi_player <> ''
  AND p.name = g.tobi_player;

UPDATE public.games g
SET tobashi_player_id = p.id
FROM public.players p
WHERE g.tobashi_player_id IS NULL
  AND g.tobashi_player IS NOT NULL
  AND g.tobashi_player <> ''
  AND p.name = g.tobashi_player;

-- yakitori_player_ids のバックフィル
-- yakitori_players はカンマ区切り文字列。players と完全一致する名前のみ ID を収集して jsonb 配列にする。
UPDATE public.games g
SET yakitori_player_ids = (
  SELECT jsonb_agg(p.id ORDER BY idx)
  FROM (
    SELECT trim(name_val) AS name_val, ordinality - 1 AS idx
    FROM unnest(string_to_array(g.yakitori_players, ',')) WITH ORDINALITY AS t(name_val, ordinality)
    WHERE trim(name_val) <> ''
  ) parts
  JOIN public.players p ON p.name = parts.name_val
)
WHERE g.yakitori_player_ids IS NULL
  AND g.yakitori_players IS NOT NULL
  AND g.yakitori_players <> '';

-- 検証用クエリ（migration 後に手動実行して残件を確認する。migration 本体には影響しない）
-- SELECT
--   COUNT(*) FILTER (WHERE player1 IS NOT NULL AND player1_id IS NULL) AS player1_unresolved,
--   COUNT(*) FILTER (WHERE player2 IS NOT NULL AND player2_id IS NULL) AS player2_unresolved,
--   COUNT(*) FILTER (WHERE player3 IS NOT NULL AND player3_id IS NULL) AS player3_unresolved,
--   COUNT(*) FILTER (WHERE player4 IS NOT NULL AND player4_id IS NULL) AS player4_unresolved,
--   COUNT(*) FILTER (WHERE top_player IS NOT NULL AND top_player_id IS NULL)      AS top_unresolved,
--   COUNT(*) FILTER (WHERE last_player IS NOT NULL AND last_player_id IS NULL)     AS last_unresolved,
--   COUNT(*) FILTER (WHERE tobi_player IS NOT NULL AND tobi_player_id IS NULL)     AS tobi_unresolved,
--   COUNT(*) FILTER (WHERE tobashi_player IS NOT NULL AND tobashi_player_id IS NULL) AS tobashi_unresolved
-- FROM public.games;
