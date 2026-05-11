-- Issue #183: インポート重複判定を notes 依存から専用カラムへ移行する
-- 目的: 画面ノイズになる notes マーカーを廃止し、DB 制約で重複を防止する

BEGIN;

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS import_dedupe_key TEXT;

-- 既存データのうち、旧 notes 形式（SPREADSHEET_IMPORT gameNo=xx）を持つ行を backfill する。
-- 重複キーが既に存在する場合は created_at/id が最小の 1 行のみ採用し、残りは NULL のまま残す。
WITH computed AS (
  SELECT
    g.id,
    g.created_at,
    CONCAT_WS('|', g.tournament_id::text, g.date::text, m.game_no::text, p.players_key) AS dedupe_key
  FROM public.games g
  CROSS JOIN LATERAL (
    SELECT
      CASE
        WHEN COALESCE(g.notes, '') ~* 'SPREADSHEET_IMPORT\\s+gameNo=\\d+'
          THEN ((REGEXP_MATCH(COALESCE(g.notes, ''), 'SPREADSHEET_IMPORT\\s+gameNo=(\\d+)', 'i'))[1])::int
        ELSE NULL
      END AS game_no
  ) m
  CROSS JOIN LATERAL (
    SELECT STRING_AGG(normalized_name, ',' ORDER BY normalized_name) AS players_key
    FROM (
      SELECT LOWER(REGEXP_REPLACE(TRIM(name), '[[:space:]　]+', '', 'g')) AS normalized_name
      FROM UNNEST(ARRAY[g.player1, g.player2, g.player3, g.player4]) AS t(name)
      WHERE NULLIF(TRIM(COALESCE(name, '')), '') IS NOT NULL
    ) names
  ) p
  WHERE g.import_dedupe_key IS NULL
    AND g.tournament_id IS NOT NULL
    AND g.date IS NOT NULL
    AND m.game_no IS NOT NULL
    AND p.players_key IS NOT NULL
), ranked AS (
  SELECT
    id,
    dedupe_key,
    ROW_NUMBER() OVER (PARTITION BY dedupe_key ORDER BY created_at, id) AS rn
  FROM computed
)
UPDATE public.games g
SET import_dedupe_key = ranked.dedupe_key
FROM ranked
WHERE g.id = ranked.id
  AND ranked.rn = 1
  AND g.import_dedupe_key IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_games_import_dedupe_key
  ON public.games (import_dedupe_key)
  WHERE import_dedupe_key IS NOT NULL;

COMMIT;
