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

COMMIT;
