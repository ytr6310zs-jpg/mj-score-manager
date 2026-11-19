-- Issue #292: allow one decimal place for game scores (2027-01+ rules).
-- Existing integer values cast cleanly to NUMERIC(6,1).

ALTER TABLE games
  ALTER COLUMN score1 TYPE NUMERIC(6, 1) USING score1::numeric(6, 1),
  ALTER COLUMN score2 TYPE NUMERIC(6, 1) USING score2::numeric(6, 1),
  ALTER COLUMN score3 TYPE NUMERIC(6, 1) USING score3::numeric(6, 1),
  ALTER COLUMN score4 TYPE NUMERIC(6, 1) USING score4::numeric(6, 1),
  ALTER COLUMN score_total TYPE NUMERIC(6, 1) USING score_total::numeric(6, 1);
