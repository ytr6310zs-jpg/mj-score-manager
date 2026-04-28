import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGamesCsv } from '../app/api/export/games/csv-builder.js';

describe('games CSV builder', () => {
  it('builds CSV with header and rows', () => {
    const matches = [
      {
        createdAt: 'M-1',
        date: '2026-03-28',
        playerCount: 4,
        players: [
          { id: 'p1', name: '田宮', slot: 1, score: 42000 },
          { id: 'p2', name: '佐藤', slot: 2, score: 12000 },
          { id: 'p3', name: '鈴木', slot: 3, score: 8000 },
          { id: 'p4', name: '高橋', slot: 4, score: 4000 },
        ],
        notes: '国士（無双）あり',
      },
    ];

    const { csv, filename } = buildGamesCsv(matches, { start: '2026-03-28', end: '2026-03-28' });
    assert.ok(csv.includes('match_id,match_date'), "CSV should include correct header row");
    assert.ok(csv.includes('M-1'), "CSV should include match ID M-1");
    assert.ok(csv.includes('田宮'), "CSV should include player name 田宮");
    assert.strictEqual(filename, 'games_2026-03-28_2026-03-28.csv', "filename should use date range format");
  });
});
