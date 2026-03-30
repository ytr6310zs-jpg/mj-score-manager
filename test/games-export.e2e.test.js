import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeGamesResponse } from '../app/api/export/games/handler.js';

describe('games export handler (integration-like)', () => {
  it('returns csv payload and headers', () => {
    const matches = [
      {
        createdAt: 'M-INT-1',
        date: '2026-03-28',
        playerCount: 4,
        players: [
          { id: 'p1', name: '田宮', slot: 1, score: 42000 },
          { id: 'p2', name: '佐藤', slot: 2, score: 12000 },
          { id: 'p3', name: '鈴木', slot: 3, score: 8000 },
          { id: 'p4', name: '高橋', slot: 4, score: 4000 },
        ],
        notes: 'テスト統合',
      },
    ];

    const { csv, filename, headers } = makeGamesResponse(matches, { start: '2026-03-28', end: '2026-03-28' });
    assert.strictEqual(headers['Content-Type'], 'text/csv; charset=utf-8');
    assert.ok(headers['Content-Disposition'].includes(filename));
    assert.ok(csv.includes('M-INT-1'));
    assert.ok(csv.includes('田宮'));
  });
});
