const fs = require('fs');
const path = require('path');
const assert = require('node:assert');
const { test } = require('node:test');

test('supabase migration seeds expected yakuman codes', () => {
  const migration = path.join(__dirname, '..', 'supabase', 'migrations', '20260406000000_create_yakuman_types.sql');
  const file = fs.readFileSync(migration, 'utf8');

  const expected = [
    'DA', 'DS', 'TS', 'CH', 'KY', 'SS', 'ZN',
    'CHUUREN', 'SUUKANTSU', 'CHINROUTOU', 'RYUISOU', 'TSUUIISOU', 'RENHOU', 'S4'
  ];

  for (const code of expected) {
    assert.ok(file.includes(`'${code}'`), `Expected migration to include code '${code}'`);
  }
});
