import { test, expect } from '@playwright/test';

const SHARED_KEY = 'mj-score-manager:shared-filter';

test.describe('Filter state header + navigation', () => {
  test('header links reflect saved shared state and navigation preserves it', async ({ page, baseURL }) => {
    const state = { filter: 'custom', start: '2024-01-05', end: '2024-01-10', tournamentId: '7', minGames: '20' };

    // perform login (if app requires auth)
    const BASE = baseURL || '';
    await page.goto(`${BASE}/login`);
    const userInput = page.locator('input[name="userId"], input#userId').first();
    const passInput = page.locator('input[name="password"], input#password').first();
    if (await userInput.count() > 0) {
      await userInput.fill(process.env.E2E_LOGIN_USER_ID || 'admin');
      await passInput.fill(process.env.E2E_LOGIN_PASSWORD || 'ChangeMe_184');
      const loginButton = page.locator('button[type="submit"], button:has-text("ログイン")').first();
      await loginButton.click();
      await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/matches', { timeout: 10000 });
    }

    // open stats page with explicit query (URL is authoritative and will be saved)
    const statsUrl = `${BASE}/stats?filter=custom&start=${state.start}&end=${state.end}&minGames=${state.minGames}`;
    await page.goto(statsUrl);

    const statsLink = page.getByRole('link', { name: '成績集計' });
    const matchesLink = page.getByRole('link', { name: '対局履歴' });

    // stats link should include minGames (allow longer wait for client update)
    await expect(statsLink).toHaveAttribute('href', /minGames=20/, { timeout: 10000 });

    // matches link should be updated to include filter and a tournamentId (no minGames)
    await expect(matchesLink).toHaveAttribute('href', /filter=custom/, { timeout: 10000 });
    const mHref = await matchesLink.getAttribute('href');
    expect(mHref).toBeTruthy();
    expect(mHref).not.toMatch(/minGames=/);
    const parsed = new URL(mHref as string, baseURL || 'http://localhost:3000');
    const actualTournamentId = parsed.searchParams.get('tournamentId');
    expect(actualTournamentId).toBeTruthy();

    // Navigate to score input and back to matches via header
    const inputLink = page.getByRole('link', { name: 'スコア入力' });
    await inputLink.click();
    await page.waitForURL(/\/$/);

    // click matches link on header (should preserve stored state)
    await matchesLink.click();
    // Wait until router.replace updates the URL with query params (FilterStateSync)
    await page.waitForURL(/\/matches\?filter=/, { timeout: 10000 });
    const url = page.url();
    expect(url).toMatch(/filter=custom/);
    expect(url).toMatch(new RegExp(`tournamentId=${actualTournamentId}`));
    expect(url).not.toMatch(/minGames=/);

    // ensure localStorage still contains the saved state
    const stored = await page.evaluate((k) => localStorage.getItem(k), SHARED_KEY);
    expect(stored).not.toBeNull();
    const storedParsed = JSON.parse(stored as string);
    expect(storedParsed.filter).toBe(state.filter);
    expect(storedParsed.start).toBe(state.start);
    expect(storedParsed.end).toBe(state.end);
    expect(storedParsed.minGames).toBe(state.minGames);
    // tournamentId should match the actual one chosen by the app
    expect(storedParsed.tournamentId).toBe(actualTournamentId);
  });
});
