-- 20260428000000_seed_yakuman_types.sql
-- Seed yakuman_types table with canonical yakuman definitions.
-- These entries serve as the default reference data.
-- On conflict (same code), do nothing so existing customizations are preserved.
BEGIN;

INSERT INTO public.yakuman_types (code, name, points, sort_order, is_active)
VALUES
  ('DA', '大三元',              32000,  10, TRUE),
  ('DS', '大四喜',              32000,  20, TRUE),
  ('TS', '天和',                32000,  30, TRUE),
  ('CH', '地和',                32000,  40, TRUE),
  ('KY', '国士無双',            32000,  50, TRUE),
  ('SS', '四暗刻',              32000,  60, TRUE),
  ('ZN', '純正九蓮宝燈',        32000,  70, TRUE),
  ('HN', '混一色大三元(例)',    32000,  80, TRUE)
ON CONFLICT (code) DO NOTHING;

COMMIT;
