-- 20260406000000_create_yakuman_types.sql
-- Create yakuman_types table and seed with canonical yakuman definitions.
BEGIN;

CREATE TABLE public.yakuman_types (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  points INTEGER,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yakuman_types_code ON public.yakuman_types (code);

-- Seed: include existing short codes from lib/yakumans and common yakuman variants
INSERT INTO public.yakuman_types (code, name, points, description, sort_order)
VALUES
  ('DA','大三元',32000,'大三元 (Dai Sangen)',10),
  ('DS','大四喜',32000,'大四喜 (Dai Suushi)',11),
  ('TS','天和',32000,'天和 (Tenhou)',5),
  ('CH','地和',32000,'地和 (Chiho)',6),
  ('KY','国士無双',32000,'国士無双 (Kokushi Musou)',12),
  ('SS','四暗刻',32000,'四暗刻 (Su Anko)',13),
  ('ZN','純正九蓮宝燈',32000,'純正九蓮宝燈 (Junsei Chuuren Poutou)',14),
  ('CHUUREN','九連宝燈',32000,'九連宝燈 (Chuuren Poutou)',15),
  ('SUUKANTSU','四槓子',32000,'四槓子 (Suu Kantsu)',16),
  ('S4','小四喜',32000,'小四喜 (Shou Suushi / Little Four Winds)',17),
  ('CHINROUTOU','清老頭',32000,'清老頭 (Chinroutou)',18),
  ('RYUISOU','緑一色',32000,'緑一色 (Ryuuisou, all green)',19),
  ('TSUUIISOU','字一色',32000,'字一色 (Tsuuiisou, all honors)',20),
  ('RENHOU','人和',32000,'人和 (Renhou — local rule)',21),
  ('KZ','数え役満',32000,'数え役満 (Kazoe Yakuman)',8),
  ('ST','四暗刻単騎',32000,'四暗刻単騎 (Su Anko Tanki)',22);

COMMIT;
