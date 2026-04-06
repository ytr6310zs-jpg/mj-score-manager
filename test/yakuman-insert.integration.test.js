require('ts-node/register');
const assert = require('node:assert');
const { test } = require('node:test');

const { insertYakumanOccurrences } = require('../lib/insert-yakuman');

function createMockSupabase({ playersRows = [], yakTypesRows = [] } = {}) {
  const state = {};
  return {
    from(table) {
      const ctx = {};
      ctx.select = (cols) => {
        ctx._cols = cols;
        return ctx;
      };
      ctx.in = (col, vals) => {
        if (table === 'players') return Promise.resolve({ data: playersRows, error: null });
        if (table === 'yakuman_types') return Promise.resolve({ data: yakTypesRows, error: null });
        return Promise.resolve({ data: null, error: null });
      };
      ctx.insert = (rows) => {
        state.inserted = rows;
        return Promise.resolve({ error: null });
      };
      return ctx;
    },
    _state: state,
  };
}

test('insertYakumanOccurrences resolves yakuman_types and inserts occurrences', async () => {
  const playersRows = [{ id: 1, name: 'Alice' }];
  const yakTypesRows = [{ code: 'DA', name: '大三元', points: 32000 }];
  const mock = createMockSupabase({ playersRows, yakTypesRows });

  const newGameId = 123;
  const raw = JSON.stringify([{ playerName: 'Alice', yakumanCode: 'DA', yakumanName: '大三元' }]);

  await insertYakumanOccurrences(mock, newGameId, raw);

  const inserted = mock._state.inserted;
  assert.ok(Array.isArray(inserted), 'expected inserted to be an array');
  assert.strictEqual(inserted.length, 1);
  const row = inserted[0];
  assert.strictEqual(row.game_id, newGameId);
  assert.strictEqual(row.player_id, 1);
  assert.strictEqual(row.yakuman_code, 'DA');
  assert.strictEqual(row.yakuman_name, '大三元');
  assert.strictEqual(row.points, 32000);
  assert.deepStrictEqual(row.meta, { source: 'yakuman_types' });
});

test('insertYakumanOccurrences falls back when yakuman_types missing', async () => {
  const playersRows = [{ id: 2, name: 'Bob' }];
  const yakTypesRows = []; // nothing seeded
  const mock = createMockSupabase({ playersRows, yakTypesRows });

  const newGameId = 555;
  const raw = JSON.stringify([{ playerName: 'Bob', yakumanCode: 'ZZ', yakumanName: '未知役満' }]);

  await insertYakumanOccurrences(mock, newGameId, raw);

  const inserted = mock._state.inserted;
  assert.ok(Array.isArray(inserted), 'expected inserted to be an array');
  assert.strictEqual(inserted.length, 1);
  const row = inserted[0];
  assert.strictEqual(row.game_id, newGameId);
  assert.strictEqual(row.player_id, 2);
  assert.strictEqual(row.yakuman_code, 'ZZ');
  assert.strictEqual(row.yakuman_name, '未知役満');
  assert.strictEqual(row.points, null);
  assert.strictEqual(row.meta, null);
});
