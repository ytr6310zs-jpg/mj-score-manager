import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveFilterParams } from "../lib/filter-params.js";

describe("old URL compatibility", () => {
  it("mode=thisYear => year filter and year range", () => {
    const res = resolveFilterParams({ filterRaw: undefined, modeRaw: "thisYear", startRaw: undefined, endRaw: undefined });
    assert.strictEqual(res.filter, "year");
    const today = new Date();
    const year = today.getFullYear();
    assert.strictEqual(res.start, `${year}-01-01`);
    assert.strictEqual(res.end, `${year}-12-31`);
  });

  it("mode=range with start/end => custom with preserved start/end", () => {
    const res = resolveFilterParams({ filterRaw: undefined, modeRaw: "range", startRaw: "2024-01-05", endRaw: "2024-01-10" });
    assert.strictEqual(res.filter, "custom");
    assert.strictEqual(res.start, "2024-01-05");
    assert.strictEqual(res.end, "2024-01-10");
  });
});
