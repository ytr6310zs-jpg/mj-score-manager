import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeStatsResponse, parseMinGames, resolveStatsExportParams } from '../app/api/export/stats/handler.js';

describe('stats export handler rules', () => {
  it('parses minGames safely', () => {
    assert.strictEqual(parseMinGames('20'), 20);
    assert.strictEqual(parseMinGames('0'), 0);
    assert.strictEqual(parseMinGames(''), undefined);
    assert.strictEqual(parseMinGames(null), undefined);
    assert.strictEqual(parseMinGames('-1'), undefined);
    assert.strictEqual(parseMinGames('abc'), undefined);
    assert.strictEqual(parseMinGames('1.5'), undefined);
  });

  it('resolves export params from URL', () => {
    const url = new URL('http://localhost/api/export/stats?start=2026-01-01&end=2026-12-31&minGames=20');
    const params = resolveStatsExportParams(url);
    assert.deepStrictEqual(params, {
      start: '2026-01-01',
      end: '2026-12-31',
      minGames: 20,
    });

    const noMinUrl = new URL('http://localhost/api/export/stats?start=2026-01-01&end=2026-12-31&minGames=');
    const noMinParams = resolveStatsExportParams(noMinUrl);
    assert.strictEqual(noMinParams.minGames, undefined);
  });

  it('builds CSV payload and response headers', () => {
    const stats = [
      {
        name: 'Alice',
        rank: 1,
        totalScore: 12345,
        games: 24,
        topCount: 10,
        lastCount: 2,
        secondRate: 0.3,
        thirdRate: 0.2,
        tobashiCount: 1,
        tobiCount: 0,
        yakitoriCount: 2,
        yakumanCount: 1,
        topRate: 0.4,
        lastAvoidanceRate: 0.916,
        tobashiRate: 0.04,
        tobiAvoidanceRate: 1,
        yakitoriAvoidanceRate: 0.916,
        setaiRate: 0.5,
      },
    ];

    const { csv, filename, headers } = makeStatsResponse(stats, {
      start: '2026-01-01',
      end: '2026-12-31',
    });

    assert.strictEqual(filename, 'player-stats_2026-01-01_2026-12-31.csv');
    assert.strictEqual(headers['Content-Type'], 'text/csv; charset=utf-8');
    assert.ok(headers['Content-Disposition'].includes(filename));
    assert.ok(csv.includes('name,rank,totalScore,games'), 'CSV header exists');
    assert.ok(csv.includes('Alice,1,12345,24'), 'CSV row exists');
  });
});
