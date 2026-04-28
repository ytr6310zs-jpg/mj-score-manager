const assert = require("node:assert/strict");
const { describe, it, before, after } = require("node:test");
const { createClient } = require("@supabase/supabase-js");

require("ts-node").register({ transpileOnly: true, preferTsExts: true });

/**
 * DB-backed E2E test: Verify match save → stats aggregation reflection
 *
 * This test requires DATABASE_URL env var (set by Supabase local or CI).
 * Skip if not available.
 */

const DATABASE_URL = process.env.DATABASE_URL;

// Skip test suite if DATABASE_URL is not set
const testSuite = DATABASE_URL ? describe : describe.skip;

testSuite("match save to stats reflection (DB-backed E2E)", async () => {
  let supabase;
  let insertedMatchId;
  let defaultTournamentId;

  before(async () => {
    if (!DATABASE_URL) {
      console.warn("DATABASE_URL not set; skipping DB-backed E2E tests");
      return;
    }

    // Initialize Supabase client with direct connection URL
    supabase = createClient(
      process.env.SUPABASE_URL || "http://localhost:54321",
      process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      { db: { schema: "public" } }
    );

    // Verify connection by querying a simple count on `games`
    const { count, error: countError } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Failed to connect to Supabase:", countError);
      throw new Error(`Database connection failed: ${countError.message}`);
    }

    // Ensure there is a default tournament (migration backfill expects '大会1')
    const { data: trow, error: tErr } = await supabase
      .from("tournaments")
      .select("id")
      .eq("name", "大会1")
      .limit(1)
      .maybeSingle();

    if (tErr) {
      throw new Error(`Failed to lookup default tournament: ${tErr.message}`);
    }

    if (trow && trow.id) {
      defaultTournamentId = trow.id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("tournaments")
        .insert([{ name: "大会1" }])
        .select("id")
        .maybeSingle();
      if (createErr) throw new Error(`Failed to create default tournament: ${createErr.message}`);
      defaultTournamentId = created.id;
    }
  });

  after(async () => {
    // Clean up: remove inserted game
    if (supabase && insertedMatchId) {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", insertedMatchId);

      if (error) {
        console.warn(
          `Warning: Failed to clean up match ${insertedMatchId}:`,
          error
        );
      }
    }
  });

  it("inserts match record and verifies player stats aggregation reflects it", async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // 1. Insert a test game using `games` table (schema used by application)
    const gameData = {
      tournament_id: defaultTournamentId,
      date: new Date().toISOString().split("T")[0],
      game_type: "4p",
      player_count: 4,
      player1: "TestWinner",
      player2: "PlayerB",
      player3: "PlayerC",
      player4: "TestLoser",
      score1: 350,
      score2: 0,
      score3: 0,
      score4: -300,
      rank1: 1,
      rank2: 2,
      rank3: 3,
      rank4: 4,
      top_player: "TestWinner",
      last_player: "TestLoser",
      notes: "DB E2E test game",
    };

    const { data: gameInserted, error: insertError } = await supabase
      .from("games")
      .insert([gameData])
      .select("id");

    assert.ok(!insertError, `Insert game failed: ${insertError?.message}`);
    assert.ok(gameInserted && gameInserted.length > 0, "Game not inserted");

    insertedMatchId = gameInserted[0].id;

    // 2. Dynamically import fetchMatchResults and computePlayerStatsFromMatches
    const matchesModule = await import("../lib/matches.ts");
    const statsModule = await import("../lib/stats.ts");
    const { fetchMatchResults } = matchesModule;
    const { computePlayerStatsFromMatches } = statsModule;

    // 3. Fetch transformed MatchResult via fetchMatchResults and select our inserted game
    const { matches, error: fetchError } = await fetchMatchResults(undefined, undefined, {});
    assert.ok(!fetchError, `Fetch match results failed: ${fetchError}`);

    const found = matches.find((m) => Number(m.id) === Number(insertedMatchId));
    assert.ok(found, "Inserted game not found in fetched matches");

    // 4. Verify aggregation reflects the new game
    const stats = computePlayerStatsFromMatches([found], 1);
    const byName = Object.fromEntries(stats.map((s) => [s.name, s]));

    assert.ok(byName.TestWinner, "TestWinner should appear in aggregated stats");
    assert.ok(byName.TestLoser, "TestLoser should appear in aggregated stats");
    // wins/top count and score assertions
    assert.strictEqual(byName.TestWinner.topCount, 1, "TestWinner should have 1 top");
    assert.strictEqual(byName.TestWinner.totalScore, 350, "TestWinner score should be 350");
    assert.strictEqual(byName.TestLoser.games, 1, "TestLoser should have 1 game");
  });

  it("verifies multiple players in single match are correctly aggregated", async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // 1. Insert a 3-player match
    // 1. Insert a 3-player game
    const game3p = {
      tournament_id: defaultTournamentId,
      date: new Date().toISOString().split("T")[0],
      game_type: "3p",
      player_count: 3,
      player1: "Player3pWinner",
      player2: "Player3pMiddle",
      player3: "Player3pLast",
      score1: 400,
      score2: 100,
      score3: -500,
      rank1: 1,
      rank2: 2,
      rank3: 3,
      top_player: "Player3pWinner",
      last_player: "Player3pLast",
      notes: "DB E2E test 3p game",
    };

    const { data: g3, error: insert3pError } = await supabase
      .from("games")
      .insert([game3p])
      .select("id");

    assert.ok(!insert3pError, `Insert 3p game failed: ${insert3pError?.message}`);
    assert.ok(g3 && g3.length > 0, "3p game not inserted");

    const match3pId = g3[0].id;

    // 2. Fetch and verify aggregation using fetchMatchResults
    const matchesModule2 = await import("../lib/matches.ts");
    const { fetchMatchResults: fetchMatchResults2 } = matchesModule2;

    const { matches: matches3p, error: fetch3pError } = await fetchMatchResults2(undefined, undefined, {});
    assert.ok(!fetch3pError, `Fetch 3p match failed: ${fetch3pError}`);

    const match3p = matches3p.find((m) => Number(m.id) === Number(match3pId));
    assert.ok(match3p, "3p Match not fetched");
    assert.strictEqual(match3p.gameType, "3p", "Match should be 3p");
    assert.strictEqual(match3p.players.length, 3, "3p match should have 3 players");

    // 3. Compute stats and verify
    const statsModule2 = await import("../lib/stats.ts");
    const { computePlayerStatsFromMatches: compute2 } = statsModule2;

    const stats3p = compute2([match3p], 1);
    const byName3p = Object.fromEntries(stats3p.map((s) => [s.name, s]));
    assert.ok(byName3p.Player3pWinner, "Player3pWinner should be in stats");
    assert.strictEqual(byName3p.Player3pWinner.topCount, 1, "Player3pWinner should have 1 win");

    // Clean up
    const { error: deleteError } = await supabase
      .from("games")
      .delete()
      .eq("id", match3pId);

    assert.ok(!deleteError, `Cleanup failed: ${deleteError?.message}`);
  });
});
