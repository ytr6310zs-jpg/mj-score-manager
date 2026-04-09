import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeStatsResponse } from "../app/api/export/stats/handler.js";

describe("stats export handler (integration-like)", () => {
  it("returns csv payload and headers", () => {
    const stats = [
      {
        name: "Alice",
        rank: 1,
        totalScore: 120,
        games: 6,
        topCount: 3,
        lastCount: 1,
        secondRate: 0.2,
        thirdRate: 0.1,
        tobashiCount: 1,
        tobiCount: 0,
        yakitoriCount: 1,
        yakumanCount: 0,
        topRate: 0.5,
        lastAvoidanceRate: 0.8333,
        tobashiRate: 0.1667,
        tobiAvoidanceRate: 1,
        yakitoriAvoidanceRate: 0.8333,
        setaiRate: 0.3333,
      },
    ];

    const { csv, filename, headers } = makeStatsResponse(stats, { start: "2026-01-01", end: "2026-12-31" });

    assert.strictEqual(headers["Content-Type"], "text/csv; charset=utf-8");
    assert.ok(headers["Content-Disposition"].includes(filename));
    assert.ok(csv.includes("Alice"));
    assert.ok(csv.includes(",1,120,"));
  });
});
