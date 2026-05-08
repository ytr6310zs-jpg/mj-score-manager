import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSharedFilterSearchParams, normalizeSharedFilterState } from "../lib/filter-state-preference.js";

describe("filter-state-preference helpers", () => {
  it("normalize rejects invalid shapes", () => {
    assert.strictEqual(normalizeSharedFilterState(null), null);
    assert.strictEqual(normalizeSharedFilterState({}), null);
    assert.strictEqual(normalizeSharedFilterState({ filter: "custom" }), null);
  });

  it("normalize accepts custom with dates", () => {
    const v = normalizeSharedFilterState({ filter: "custom", start: "2024-01-01", end: "2024-02-01", tournamentId: 5, minGames: 10 });
    assert.ok(v);
    assert.strictEqual(v.filter, "custom");
    assert.strictEqual(v.start, "2024-01-01");
    assert.strictEqual(v.end, "2024-02-01");
    assert.strictEqual(v.tournamentId, "5");
    assert.strictEqual(v.minGames, "10");
  });

  it("buildSharedFilterSearchParams respects includeMinGames", () => {
    const state = { filter: "custom", start: "2024-01-01", end: "2024-01-31", tournamentId: "7", minGames: "20" };
    const p1 = buildSharedFilterSearchParams(state, { includeMinGames: false });
    assert.strictEqual(p1.get("tournamentId"), "7");
    assert.strictEqual(p1.get("minGames"), null);
    const p2 = buildSharedFilterSearchParams(state, { includeMinGames: true });
    assert.strictEqual(p2.get("minGames"), "20");
  });
});
