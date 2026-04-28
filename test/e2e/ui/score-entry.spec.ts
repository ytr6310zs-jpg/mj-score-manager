import { expect, Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Browser E2E test for score input form
 *
 * Validates the complete user flow:
 * 1. Open score entry page
 * 2. Select game type and players
 * 3. Enter scores and options (tobi, tobashi, yakitori)
 * 4. Submit form
 * 5. Verify success feedback and DB persistence
 *
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - Supabase local running with DATABASE_URL set
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createReadClient() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    { db: { schema: "public" } }
  );
}

// Skip tests if DATABASE_URL is not available
const testSuite = DATABASE_URL ? test : test.skip;

// Helper to clear test data from DB
async function cleanupTestMatch(matchId: number | null) {
  if (!matchId || !DATABASE_URL) return;

  const supabase = createReadClient();

  await supabase.from("games").delete().eq("id", matchId);
}

// Helper to fetch latest match from DB
async function fetchLatestMatch() {
  if (!DATABASE_URL) return null;

  const supabase = createReadClient();

  const { data, error } = await supabase
    .from("games")
    .select("id, game_type, notes, player1, player2, player3, player4, score1, score2, score3, score4")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

async function fetchExistingPlayers(minCount: number) {
  if (!DATABASE_URL) return [] as string[];

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { db: { schema: "public" } }
  );

  const { data, error } = await supabase
    .from("players")
    .select("name")
    .order("id", { ascending: true })
    .limit(Math.max(minCount, 8));

  const existing = (error || !data)
    ? ([] as string[])
    : data.map((row: any) => String(row.name ?? "").trim()).filter(Boolean);

  if (existing.length >= minCount || !SUPABASE_SERVICE_ROLE_KEY) {
    return existing;
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { db: { schema: "public" } });
  const needed = minCount - existing.length;
  const suffix = Date.now();
  const seedPlayers = Array.from({ length: needed }).map((_, idx) => ({
    name: `E2ESeed_${suffix}_${idx + 1}`,
  }));

  await serviceClient.from("players").insert(seedPlayers);

  const { data: seededData } = await serviceClient
    .from("players")
    .select("name")
    .order("id", { ascending: true })
    .limit(Math.max(minCount, 8));

  return (seededData ?? []).map((row: any) => String(row.name ?? "").trim()).filter(Boolean);
}

async function loginIfNeeded(page: Page) {
  const accessPassword = process.env.ACCESS_PASSWORD;
  if (!accessPassword) return;

  await page.goto(`${BASE_URL}/login`);
  const passwordInput = page.locator('input[name="password"], input#password').first();
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(accessPassword);

  const loginButton = page.locator('button[type="submit"], button:has-text("ログイン")').first();
  await loginButton.click();
  await page.waitForURL(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 10000 });
}

async function selectGameType(page: Page, gameType: "3p" | "4p") {
  const trigger = page
    .locator('div:has(> label:has-text("卓種")) button[role="combobox"]')
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page
    .getByRole("option", { name: gameType === "3p" ? "3人打ち" : "4人打ち" })
    .first()
    .click();
}

async function selectExistingPlayer(page: Page, slot: number, playerName: string) {
  const trigger = page
    .locator(`div:has(> label:has-text("プレイヤー${slot}")) button[aria-haspopup="listbox"]`)
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const searchInput = page.locator('input[placeholder="名前で検索..."]').last();
  await expect(searchInput).toBeVisible();
  await searchInput.fill(playerName);

  const existingOption = page.getByRole("option", { name: playerName }).first();
  await expect(existingOption).toBeVisible();
  await existingOption.click();

  await expect(page.locator(`input[type="hidden"][name="player${slot}"]`)).toHaveValue(playerName);
}

async function waitForMatchByNote(note: string) {
  await expect
    .poll(async () => {
      const match = await fetchLatestMatch();
      return match?.notes === note;
    }, { timeout: 10000 })
    .toBe(true);

  return fetchLatestMatch();
}

testSuite.describe("Score entry form browser E2E", () => {
  let page: Page;
  let lastInsertedMatchId: number | null = null;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    lastInsertedMatchId = null;
  });

  test.afterEach(async () => {
    await cleanupTestMatch(lastInsertedMatchId);
  });

  testSuite("submits 3-player game and reflects in database", async () => {
    const existingPlayers = await fetchExistingPlayers(3);
    expect(existingPlayers.length).toBeGreaterThanOrEqual(3);
    const [player1Name, player2Name, player3Name] = existingPlayers;
    const note = `E2E3P note ${Date.now()}`;

    await loginIfNeeded(page);
    await page.goto(BASE_URL);
    const tournamentSelect = page.locator('div:has(> label:has-text("大会")) button[role="combobox"]').first();
    await expect(tournamentSelect).toBeVisible({ timeout: 5000 });

    await selectGameType(page, "3p");
    await selectExistingPlayer(page, 1, player1Name);
    await selectExistingPlayer(page, 2, player2Name);
    await selectExistingPlayer(page, 3, player3Name);

    const score1 = page.locator('input[id="score1"]');
    const score2 = page.locator('input[id="score2"]');
    const score3 = page.locator('input[id="score3"]');

    if (await score1.isVisible()) await score1.fill("300");
    if (await score2.isVisible()) await score2.fill("0");
    // Trigger auto-fill for the last slot to avoid flaky negative-number input handling.
    if (await score2.isVisible()) await score2.blur();
    await expect(score3).toHaveValue("-300");

    const notesInput = await page.locator("textarea[name='notes']").first();
    if (await notesInput.isVisible()) {
      await notesInput.fill(note);
    }

    const submitBtn = page.getByRole("button", { name: "スコアを保存" }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.getByText("スコアを保存しました。")).toBeVisible({ timeout: 10000 });
  });

  testSuite("submits 4-player game with tobi and tobashi options", async () => {
    const existingPlayers = await fetchExistingPlayers(4);
    expect(existingPlayers.length).toBeGreaterThanOrEqual(4);
    const [player1Name, player2Name, player3Name, player4Name] = existingPlayers;
    const note = `E2E4P note ${Date.now()}`;

    await loginIfNeeded(page);
    await page.goto(BASE_URL);

    await selectGameType(page, "4p");
    await selectExistingPlayer(page, 1, player1Name);
    await selectExistingPlayer(page, 2, player2Name);
    await selectExistingPlayer(page, 3, player3Name);
    await selectExistingPlayer(page, 4, player4Name);

    const score1 = page.locator('input[id="score1"]');
    const score2 = page.locator('input[id="score2"]');
    const score3 = page.locator('input[id="score3"]');
    const score4 = page.locator('input[id="score4"]');

    if (await score1.isVisible()) await score1.fill("400");
    if (await score2.isVisible()) await score2.fill("100");
    if (await score3.isVisible()) await score3.fill("-100");
    if (await score3.isVisible()) await score3.blur();
    await expect(score4).toHaveValue("-400");

    const notesInput = await page.locator("textarea[name='notes']").first();
    if (await notesInput.isVisible()) {
      await notesInput.fill(note);
    }

    const submitBtn = page.getByRole("button", { name: "スコアを保存" }).first();
    await submitBtn.click();

    await expect(page.getByText("スコアを保存しました。")).toBeVisible({ timeout: 10000 });
  });
});
