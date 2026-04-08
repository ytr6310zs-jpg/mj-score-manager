import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeTopSets, METRIC_DIRECTION } from '../lib/metric-ranks.js';

describe('computeTopSets', () => {
  it('handles descending metrics', () => {
    const stats = [
      { name: 'A', games: 5 },
      { name: 'B', games: 3 },
      { name: 'C', games: 2 },
    ];
    const s = computeTopSets(stats, ['games'], METRIC_DIRECTION);
    assert.deepStrictEqual(s.games.first.sort(), ['A'].sort());
    assert.deepStrictEqual(s.games.second.sort(), ['B'].sort());
    assert.deepStrictEqual(s.games.third, ['C']);
  });

  it('handles ties correctly', () => {
    const stats = [
      { name: 'A', games: 5 },
      { name: 'B', games: 5 },
      { name: 'C', games: 3 },
      { name: 'D', games: 1 },
    ];
    const s = computeTopSets(stats, ['games'], METRIC_DIRECTION);
    assert.deepStrictEqual(new Set(s.games.first), new Set(['A', 'B']));
    assert.deepStrictEqual(s.games.second, ['C']);
  });

  it('respects asc direction for lastCount', () => {
    const stats = [
      { name: 'A', lastCount: 1 },
      { name: 'B', lastCount: 0 },
      { name: 'C', lastCount: 2 },
    ];
    const s = computeTopSets(stats, ['lastCount'], METRIC_DIRECTION);
    assert.deepStrictEqual(s.lastCount.first, ['B']);
    assert.deepStrictEqual(s.lastCount.second, ['A']);
    assert.deepStrictEqual(s.lastCount.third, ['C']);
  });
});
