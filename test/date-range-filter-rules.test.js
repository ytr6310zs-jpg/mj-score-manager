import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getDefaultMinGamesForFilter,
  getLoadingIndicatorPlacement,
  shouldAutoSubmitOnMinGamesChange,
  shouldShowMinGames,
} from '../components/date-range-filter-rules.js';

describe('date-range filter screen rules', () => {
  it('shows minGames only for year/custom when enabled', () => {
    assert.strictEqual(shouldShowMinGames(true, 'year'), true);
    assert.strictEqual(shouldShowMinGames(true, 'custom'), true);
    assert.strictEqual(shouldShowMinGames(true, '2026-04-01'), false);
    assert.strictEqual(shouldShowMinGames(false, 'year'), false);
  });

  it('uses correct minGames default by filter', () => {
    assert.strictEqual(getDefaultMinGamesForFilter('year'), '20');
    assert.strictEqual(getDefaultMinGamesForFilter('custom'), '');
    assert.strictEqual(getDefaultMinGamesForFilter('2026-04-01'), '');
  });

  it('auto-submits minGames change only for year', () => {
    assert.strictEqual(shouldAutoSubmitOnMinGamesChange('year'), true);
    assert.strictEqual(shouldAutoSubmitOnMinGamesChange('custom'), false);
    assert.strictEqual(shouldAutoSubmitOnMinGamesChange('2026-04-01'), false);
  });

  it('places loading indicator by filter mode', () => {
    assert.strictEqual(getLoadingIndicatorPlacement('year'), 'minGamesRight');
    assert.strictEqual(getLoadingIndicatorPlacement('custom'), 'submitButtonRight');
    assert.strictEqual(getLoadingIndicatorPlacement('2026-04-01'), 'filterRight');
  });
});
