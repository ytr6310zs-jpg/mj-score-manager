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

    // Verify connection by querying a simple count
    const { count, error: countError } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Failed to connect to Supabase:", countError);
      throw new Error(`Database connection failed: ${countError.message}`);
    }
  });

  after(async () => {
    // Clean up: remove inserted match
    if (supabase && insertedMatchId) {
      const { error } = await supabase
        .from("matches")
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

    // 1. Insert a test match
    const matchData = {
      tournament_id: null,
      game_date: new Date().toISOString().split("T")[0],
      game_type: "4p",
      top_player: "TestWinner",
      last_player: "TestLoser",
      tobi_player: null,
      tobashi_player: null,
      notes: "DB E2E test match",
    };

    const { data: matchInserted, error: insertError } = await supabase
      .from("matches")
      .insert([matchData])
      .select("id");

    assert.ok(!insertError, `Insert match failed: ${insertError?.message}`);
    assert.ok(matchInserted && matchInserted.length > 0, "Match not inserted");

    insertedMatchId = matchInserted[0].id;

    // 2. Insert match details (player scores)
    const playerDetails = [
      {
        match_id: insertedMatchId,
        player_name: "TestWinner",
        rank: 1,
        score: 350,
        is_tobi: false,
        is_tobashi: false,
        is_yakitori: false,
      },
      {
        match_id: insertedMatchId,
        player_name: "TestLoser",
        rank: 4,
        score: -300,
        is_tobi: false,
        is_tobashi: false,
        is_yakitori: false,
      },
    ];

    const { error: detailError } = await supabase
      .from("match_details")
      .insert(playerDetails);

    assert.ok(!detailError, `Insert match details failed: ${detailError?.message}`);

    // 3. Dynamically load computePlayerStatsFromMatches to verify aggregation
    // (Use dynamic import to avoid module resolution issues in node:test)
    const statsModule = await import("../lib/stats.ts");
    const { computePlayerStatsFromMatches } = statsModule;

    // 4. Query inserted match and details
    const { data: matches, error: fetchError } = await supabase
      .from("matches")
      .select(
        `
        id, tournament_id, game_date, game_type,
        top_player, last_player, tobi_player, tobashi_player, notes, created_at,
        match_details (
          id, player_name, rank, score, is_tobi, is_tobashi, is_yakitori
        )
      `
      )
      .eq("id", insertedMatchId);

    assert.ok(!fetchError, `Fetch match failed: ${fetchError?.message}`);
    assert.ok(matches && matches.length > 0, "Match not fetched");

    const match = matches[0];
    assert.strictEqual(
      match.match_details.length,
      2,
      "Both player details should be inserted"
    );

    // 5. Verify aggregation reflects the new match
    // (This verifies that computePlayerStatsFromMatches can process the match)
    const testMatches = [match];
    const stats = computePlayerStatsFromMatches(testMatches, 1);

    assert.ok(stats, "Stats should be computed");
    assert.ok(
      stats.TestWinner,
      "TestWinner should appear in aggregated stats"
    );
    assert.ok(
      stats.TestLoser,
      "TestLoser should appear in aggregated stats"
    );

    assert.strictEqual(
      stats.TestWinner.wins,
      1,
      "TestWinner should have 1 win"
    );
    assert.strictEqual(
      stats.TestWinner.score,
      350,
      "TestWinner score should be 350"
    );

    assert.strictEqual(
      stats.TestLoser.totalGames,
      1,
      "TestLoser should have 1 game"
    );
  });

  it("verifies multiple players in single match are correctly aggregated", async () => {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // 1. Insert a 3-player match
    const match3pData = {
      tournament_id: null,
      game_date: new Date().toISOString().split("T")[0],
      game_type: "3p",
      top_player: "Player3pWinner",
      last_player: "Player3pLast",
      tobi_player: null,
      tobashi_player: null,
      notes: "DB E2E test 3p match",
    };

    const { data: match3pInserted, error: insert3pError } = await supabase
      .from("matches")
      .insert([match3pData])
      .select("id");

    assert.ok(!insert3pError, `Insert 3p match failed: ${insert3pError?.message}`);
    assert.ok(
      match3pInserted && match3pInserted.length > 0,
      "3p Match not inserted"
    );

    const match3pId = match3pInserted[0].id;

    // 2. Insert player details
    const players3p = [
      {
        match_id: match3pId,
        player_name: "Player3pWinner",
        rank: 1,
        score: 400,
        is_tobi: false,
        is_tobashi: false,
        is_yakitori: false,
      },
      {
        match_id: match3pId,
        player_name: "Player3pMiddle",
        rank: 2,
        score: 100,
        is_tobi: false,
        is_tobashi: false,
        is_yakitori: false,
      },
      {
        match_id: match3pId,
        player_name: "Player3pLast",
        rank: 3,
        score: -500,
        is_tobi: false,
        is_tobashi: false,
        is_yakitori: false,
      },
    ];

    const { error: detail3pError } = await supabase
      .from("match_details")
      .insert(players3p);

    assert.ok(
      !detail3pError,
      `Insert 3p match details failed: ${detail3pError?.message}`
    );

    // 3. Fetch and verify aggregation
    const { data: matches3p, error: fetch3pError } = await supabase
      .from("matches")
      .select(
        `
        id, tournament_id, game_date, game_type,
        top_player, last_player, tobi_player, tobashi_player, notes, created_at,
        match_details (
          id, player_name, rank, score, is_tobi, is_tobashi, is_yakitori
        )
      `
      )
      .eq("id", match3pId);

    assert.ok(!fetch3pError, `Fetch 3p match failed: ${fetch3pError?.message}`);
    assert.ok(
      matches3p && matches3p.length > 0,
      "3p Match not fetched"
    );

    const match3p = matches3p[0];
    assert.strictEqual(match3p.game_type, "3p", "Match should be 3p");
    assert.strictEqual(
      match3p.match_details.length,
      3,
      "3p match should have 3 players"
    );

    // 4. Compute stats and verify
    const statsModule = await import("../lib/stats.ts");
    const { computePlayerStatsFromMatches } = statsModule;

    const stats3p = computePlayerStatsFromMatches([match3p], 1);
    assert.ok(stats3p.Player3pWinner, "Player3pWinner should be in stats");
    assert.strictEqual(
      stats3p.Player3pWinner.wins,
      1,
      "Player3pWinner should have 1 win"
    );

    // Clean up
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", match3pId);

    assert.ok(!deleteError, `Cleanup failed: ${deleteError?.message}`);
  });
});
