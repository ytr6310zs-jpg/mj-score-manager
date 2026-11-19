import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computePlayerStatsFromMatches } from "../lib/stats.ts";

describe("computePlayerStatsFromMatches decimal totals", () => {
  it("accumulates tenth scores without IEEE-754 drift", () => {
    const matches = [
      {
        playerCount: 3,
        tobashiPlayerIds: [],
        players: [
          { id: 1, name: "A", score: 0.1, rank: 1, isTobi: false, isYakitori: false, yakumans: [] },
          { id: 2, name: "B", score: 0.2, rank: 2, isTobi: false, isYakitori: false, yakumans: [] },
          { id: 3, name: "C", score: -0.3, rank: 3, isTobi: false, isYakitori: false, yakumans: [] },
        ],
      },
      {
        playerCount: 3,
        tobashiPlayerIds: [],
        players: [
          { id: 1, name: "A", score: 0.2, rank: 1, isTobi: false, isYakitori: false, yakumans: [] },
          { id: 2, name: "B", score: -0.1, rank: 2, isTobi: false, isYakitori: false, yakumans: [] },
          { id: 3, name: "C", score: -0.1, rank: 3, isTobi: false, isYakitori: false, yakumans: [] },
        ],
      },
    ];

    const stats = computePlayerStatsFromMatches(matches, 1);
    const byName = Object.fromEntries(stats.map((row) => [row.name, row]));

    assert.equal(byName.A.totalScore, 0.3);
    assert.equal(byName.B.totalScore, 0.1);
    assert.equal(byName.C.totalScore, -0.4);
    assert.equal(String(byName.A.totalScore), "0.3");
  });
});
