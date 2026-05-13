import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

test('lib/yakumans.ts contains canonical yakuman codes', () => {
  const file = fs.readFileSync(path.join(process.cwd(), 'lib', 'yakumans.ts'), 'utf8');
  const expected = ['DA', 'DS', 'TS', 'CH', 'KY', 'SS', 'ZN'];
  for (const code of expected) {
    assert.ok(file.includes(`code: "${code}"`) || file.includes(`'${code}'`) || file.includes(`"${code}"`), `Expected lib/yakumans.ts to include code ${code}`);
  }
});
