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

    assert.deepStrictEqual(actual, fixture.expected);
  });

  it("keeps deterministic order by name for equal scores", () => {
    const ranked = sortAndAssignCompetitionRank([
      { name: "B", totalScore: 100 },
      { name: "A", totalScore: 100 },
    ]);

    assert.deepStrictEqual(ranked.map((row) => row.name), ["A", "B"]);
    assert.deepStrictEqual(ranked.map((row) => row.rank), [1, 1]);
  });
});
