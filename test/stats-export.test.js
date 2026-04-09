import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildStatsCsv } from "../app/api/export/stats/csv-builder.js";

describe("stats CSV builder", () => {
  it("builds CSV with header and rows", () => {
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
        lastAvoidanceRate: 0.8333333333,
        tobashiRate: 0.1666666667,
        tobiAvoidanceRate: 1,
        yakitoriAvoidanceRate: 0.8333333333,
        setaiRate: 0.3333333333,
      },
      {
        name: "Bob",
        rank: 1,
        totalScore: 120,
        games: 5,
        topCount: 2,
        lastCount: 1,
        secondRate: 0.2,
        thirdRate: 0.2,
        tobashiCount: 0,
        tobiCount: 1,
        yakitoriCount: 0,
        yakumanCount: 1,
        topRate: 0.4,
        lastAvoidanceRate: 0.8,
        tobashiRate: 0,
        tobiAvoidanceRate: 0.8,
        yakitoriAvoidanceRate: 1,
        setaiRate: 0.4,
      },
      {
        name: "Carol",
        rank: 3,
        totalScore: 80,
        games: 4,
        topCount: 1,
        lastCount: 2,
        secondRate: 0.25,
        thirdRate: 0.25,
        tobashiCount: 0,
        tobiCount: 1,
        yakitoriCount: 1,
        yakumanCount: 0,
        topRate: 0.25,
        lastAvoidanceRate: 0.5,
        tobashiRate: 0,
        tobiAvoidanceRate: 0.75,
        yakitoriAvoidanceRate: 0.75,
        setaiRate: 0.25,
      },
    ];

    const { csv, filename } = buildStatsCsv(stats, { start: "2026-01-01", end: "2026-12-31" });

    assert.ok(csv.includes("name,rank,totalScore"), "header present");
    assert.ok(csv.includes("Alice,1,120"), "row contains Alice");
    assert.ok(csv.includes("Bob,1,120"), "tie rank row contains Bob rank 1");
    assert.ok(csv.includes("Carol,3,80"), "competition rank skip is represented");
    assert.strictEqual(filename, "player-stats_2026-01-01_2026-12-31.csv");
  });
});
