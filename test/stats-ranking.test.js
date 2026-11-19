import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { sortAndAssignCompetitionRank } from "../lib/stats-ranking.js";

const fixturePath = path.join(process.cwd(), "test", "fixtures", "issue-146-rank-tie.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

describe("sortAndAssignCompetitionRank", () => {
  it("assigns Excel-style competition rank from fixture", () => {
    const ranked = sortAndAssignCompetitionRank(fixture.rows);
    const actual = ranked.map((row) => ({ name: row.name, rank: row.rank }));

    assert.deepStrictEqual(actual, fixture.expected, "ranking should assign correct competition ranks matching fixture expectations");
  });

  it("keeps deterministic order by name for equal scores", () => {
    const ranked = sortAndAssignCompetitionRank([
      { name: "B", totalScore: 100 },
      { name: "A", totalScore: 100 },
    ]);

    assert.deepStrictEqual(ranked.map((row) => row.name), ["A", "B"], "players with equal scores should be sorted alphabetically by name");
    assert.deepStrictEqual(ranked.map((row) => row.rank), [1, 1], "equal scores should receive equal competition rank (no gaps)");
  });

  it("treats float-drifted equal totals as a tie", () => {
    // 0.1 + 0.2 produces 0.30000000000000004 in IEEE-754 when naively summed
    const drifted = 0.1 + 0.2;
    const ranked = sortAndAssignCompetitionRank([
      { name: "A", totalScore: drifted },
      { name: "B", totalScore: 0.3 },
    ]);

    assert.deepStrictEqual(ranked.map((row) => row.rank), [1, 1], "0.1+0.2 vs 0.3 should still tie");
  });
});
