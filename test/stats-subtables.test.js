import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeSubtablesFromMatches } from '../lib/stats-subtables.js';

describe('computeSubtablesFromMatches', () => {
  it('extracts yakuman events and ranks correctly', () => {
    const matches = [
      {
        id: 1,
        date: '2026-04-01',
        createdAt: '2026-04-01T10:00:00Z',
        gameType: '4p',
        players: [
          { slot: 1, name: 'Alice', score: 30000, rank: 1, isTobi: false, isTobashi: false, isYakitori: false, yakumans: [{ code: 'DA', name: '大三元', points: 32000 }] },
          { slot: 2, name: 'Bob', score: 15000, rank: 2, isTobi: false, isTobashi: false, isYakitori: false },
          { slot: 3, name: 'Carol', score: -5000, rank: 3, isTobi: false, isTobashi: false, isYakitori: false },
          { slot: 4, name: 'Dave', score: -10000, rank: 4, isTobi: false, isTobashi: false, isYakitori: false },
        ],
      },
      {
        id: 2,
        date: '2026-03-30',
        createdAt: '2026-03-30T10:00:00Z',
        gameType: '3p',
        players: [
          { slot: 1, name: 'Eve', score: 20000, rank: 1, isTobi: false, isTobashi: false, isYakitori: false },
          { slot: 2, name: 'Frank', score: -10000, rank: 3, isTobi: false, isTobashi: false, isYakitori: false },
          { slot: 3, name: 'Grace', score: -10000, rank: 2, isTobi: false, isTobashi: false, isYakitori: false },
        ],
      },
    ];

    const { yakumanEvents, highestScores, lowestScores, largestSpreads } = computeSubtablesFromMatches(matches, 5);

    // yakuman
    assert.strictEqual(yakumanEvents.length, 1);
    assert.strictEqual(yakumanEvents[0].playerName, 'Alice');
    assert.strictEqual(yakumanEvents[0].yakumanName, '大三元');

    // highest
    assert.strictEqual(highestScores.length, 7);
    assert.strictEqual(highestScores[0].playerName, 'Alice');
    assert.strictEqual(highestScores[0].score, 30000);
    assert.strictEqual(highestScores[1].playerName, 'Eve');

    // lowest (player-level minima sorted by higher minima first -> Alice has min 30000)
    assert.strictEqual(lowestScores.length, 7);
    assert.strictEqual(lowestScores[0].playerName, 'Alice');
    assert.strictEqual(lowestScores[0].score, 30000);

    // largest spread
    assert.strictEqual(largestSpreads[0].topPlayerName, 'Alice');
    assert.strictEqual(largestSpreads[0].lastPlayerName, 'Dave');
    assert.strictEqual(largestSpreads[0].spread, 40000);
  });
});
