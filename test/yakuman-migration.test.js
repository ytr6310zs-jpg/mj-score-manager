import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

test('canonical yakuman codes are defined in migration or seed script', () => {
  const migration = path.join(process.cwd(), 'supabase', 'migrations', '20260406000000_create_yakuman_types.sql');
  const file = fs.readFileSync(migration, 'utf8');

  // Allow codes to be present either in the migration seed or in the
  // repository seed script (`scripts/seed-yakuman-types.mjs`). This supports
  // moving canonical seed data out of migrations while keeping tests green.
  const seedScriptPath = path.join(process.cwd(), 'scripts', 'seed-yakuman-types.mjs');
  let seedFile = '';
  try {
    seedFile = fs.readFileSync(seedScriptPath, 'utf8');
  } catch {
    seedFile = '';
  }

  const expected = [
    'DA', 'DS', 'TS', 'CH', 'KY', 'SS', 'ZN',
    'CHUUREN', 'SUUKANTSU', 'CHINROUTOU', 'RYUISOU', 'TSUUIISOU', 'RENHOU', 'S4',
    'ST', 'KZ'
  ];

  for (const code of expected) {
    const inMigration = file.includes(`'${code}'`);
    const inSeedScript = seedFile.includes(`'${code}'`) || seedFile.includes(`code: '${code}'`);
    assert.ok(inMigration || inSeedScript, `Expected canonical yakuman code '${code}' to be defined in migration or seed script`);
  }
});
