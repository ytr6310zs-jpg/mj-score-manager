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
    assert.deepStrictEqual(s.games.first.sort(), ['A'].sort(), "first rank should be A (highest games count)");
    assert.deepStrictEqual(s.games.second.sort(), ['B'].sort(), "second rank should be B");
    assert.deepStrictEqual(s.games.third, ['C'], "third rank should be C");
  });

  it('handles ties with competition rank semantics', () => {
    const stats = [
      { name: 'A', games: 5 },
      { name: 'B', games: 5 },
      { name: 'C', games: 3 },
      { name: 'D', games: 1 },
    ];
    const s = computeTopSets(stats, ['games'], METRIC_DIRECTION);
    assert.deepStrictEqual(new Set(s.games.first), new Set(['A', 'B']), "A and B should both be first rank (tied at 5)");
    assert.deepStrictEqual(s.games.second, [], "second rank should be empty (no competition rank gap)");
    assert.deepStrictEqual(s.games.third, ['C'], "third rank should be C (next non-tied value)");
  });

  it('respects asc direction for lastCount', () => {
    const stats = [
      { name: 'A', lastCount: 1 },
      { name: 'B', lastCount: 0 },
      { name: 'C', lastCount: 2 },
    ];
    const s = computeTopSets(stats, ['lastCount'], METRIC_DIRECTION);
    assert.deepStrictEqual(s.lastCount.first, ['B'], "B should be first (lowest lastCount in ascending direction)");
    assert.deepStrictEqual(s.lastCount.second, ['A'], "A should be second");
    assert.deepStrictEqual(s.lastCount.third, ['C'], "C should be third (highest lastCount)");
  });
});
