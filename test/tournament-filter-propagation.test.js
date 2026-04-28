import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveGamesExportParams } from "../app/api/export/games/handler.js";
import { resolveMatchesExportParams } from "../app/api/export/matches/handler.js";
import { resolveStatsExportParams } from "../app/api/export/stats/handler.js";
import { buildStatsPrintPath } from "../app/stats/print/query.js";
import { parseTournamentId } from "../lib/tournament-filter-query.js";

describe("tournament filter propagation contract", () => {
  it("parses tournament id safely", () => {
    assert.strictEqual(parseTournamentId("12"), 12, "should parse valid numeric string '12' to integer");
    assert.strictEqual(parseTournamentId(" 7 "), 7, "should trim whitespace and parse '7'");
    assert.strictEqual(parseTournamentId(""), undefined, "should return undefined for empty string");
    assert.strictEqual(parseTournamentId("0"), undefined, "should reject 0 (invalid tournament ID)");
    assert.strictEqual(parseTournamentId("-1"), undefined, "should reject negative numbers");
    assert.strictEqual(parseTournamentId("abc"), undefined, "should reject non-numeric strings");
  });

  it("keeps same tournamentId across stats/print/export query contracts", () => {
    const query = "filter=year&start=2026-01-01&end=2026-12-31&minGames=20&tournamentId=5";
    const url = new URL(`http://localhost/api/export/stats?${query}`);

    const games = resolveGamesExportParams(url);
    const matches = resolveMatchesExportParams(url);
    const stats = resolveStatsExportParams(url);
    const printPath = buildStatsPrintPath(query);

    assert.strictEqual(games.tournamentId, 5, "games export should preserve tournamentId=5");
    assert.strictEqual(matches.tournamentId, 5, "matches export should preserve tournamentId=5");
    assert.strictEqual(stats.tournamentId, 5, "stats export should preserve tournamentId=5");
    assert.ok(printPath.includes("tournamentId=5"), "print path should include tournamentId=5 parameter");
  });
});
