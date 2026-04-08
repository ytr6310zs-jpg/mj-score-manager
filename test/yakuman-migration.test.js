const fs = require('fs');
const path = require('path');
const assert = require('node:assert');
const { test } = require('node:test');

test('canonical yakuman codes are defined in migration or seed script', () => {
  const migration = path.join(__dirname, '..', 'supabase', 'migrations', '20260406000000_create_yakuman_types.sql');
  const file = fs.readFileSync(migration, 'utf8');

  // Allow codes to be present either in the migration seed or in the
  // repository seed script (`scripts/seed-yakuman-types.mjs`). This supports
  // moving canonical seed data out of migrations while keeping tests green.
  const seedScriptPath = path.join(__dirname, '..', 'scripts', 'seed-yakuman-types.mjs');
  let seedFile = '';
  try {
    seedFile = fs.readFileSync(seedScriptPath, 'utf8');
  } catch {
    seedFile = '';
  }

  const expected = [
    'DA', 'DS', 'TS', 'CH', 'KY', 'SS', 'ZN',
    'CHUUREN', 'SUUKANTSU', 'CHINROUTOU', 'RYUISOU', 'TSUUIISOU', 'RENHOU', 'S4'
  ];

  for (const code of expected) {
    const inMigration = file.includes(`'${code}'`);
    const inSeedScript = seedFile.includes(`'${code}'`) || seedFile.includes(`code: '${code}'`);
    assert.ok(inMigration || inSeedScript, `Expected canonical yakuman code '${code}' to be defined in migration or seed script`);
  }
});
