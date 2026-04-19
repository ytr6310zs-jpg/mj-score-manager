import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveGamesExportParams } from "../app/api/export/games/handler.js";
import { resolveMatchesExportParams } from "../app/api/export/matches/handler.js";
import { resolveStatsExportParams } from "../app/api/export/stats/handler.js";
import { buildStatsPrintPath } from "../app/stats/print/query.js";
import { parseTournamentId } from "../lib/tournament-filter-query.js";

describe("tournament filter propagation contract", () => {
  it("parses tournament id safely", () => {
    assert.strictEqual(parseTournamentId("12"), 12);
    assert.strictEqual(parseTournamentId(" 7 "), 7);
    assert.strictEqual(parseTournamentId(""), undefined);
    assert.strictEqual(parseTournamentId("0"), undefined);
    assert.strictEqual(parseTournamentId("-1"), undefined);
    assert.strictEqual(parseTournamentId("abc"), undefined);
  });

  it("keeps same tournamentId across stats/print/export query contracts", () => {
    const query = "filter=year&start=2026-01-01&end=2026-12-31&minGames=20&tournamentId=5";
    const url = new URL(`http://localhost/api/export/stats?${query}`);

    const games = resolveGamesExportParams(url);
    const matches = resolveMatchesExportParams(url);
    const stats = resolveStatsExportParams(url);
    const printPath = buildStatsPrintPath(query);

    assert.strictEqual(games.tournamentId, 5);
    assert.strictEqual(matches.tournamentId, 5);
    assert.strictEqual(stats.tournamentId, 5);
    assert.ok(printPath.includes("tournamentId=5"));
  });
});
