const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

require("ts-node").register({ transpileOnly: true, preferTsExts: true });

const { validateAndParseMatchForm, buildRankedEntries } = require("../lib/validate-match.ts");

function buildFormData(payload) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, String(value));
  }
  return formData;
}

function summarize(entries) {
  return entries
    .map((entry) => ({
      name: entry.player,
      rank: entry.rank,
      topCount: entry.rank === 1 ? 1 : 0,
      lastCount: entry.rank === entries.length ? 1 : 0,
      tobashiCount: entry.isTobashi ? 1 : 0,
      tobiCount: entry.isTobi ? 1 : 0,
      yakitoriCount: entry.isYakitori ? 1 : 0,
      score: entry.score,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

describe("score input to stats reflection (e2e-like)", () => {
  it("reflects submitted game result into list/stats-ready aggregate", () => {
    const formData = buildFormData({
      tournamentId: 1,
      gameDate: "2026-04-27",
      gameType: "4p",
      player1: "Alice",
      player2: "Bob",
      player3: "Carol",
      player4: "Dave",
      score1: "350",
      score2: "100",
      score3: "-150",
      score4: "-300",
      tobiPlayer: "Dave",
      tobashiPlayer: "Alice",
      yakitori2: "on",
      notes: "E2E-like flow test",
    });

    const parsed = validateAndParseMatchForm(formData);
    assert.ok(parsed.ok, "form should pass validation");

    const entries = buildRankedEntries(
      parsed.data.players,
      parsed.data.scores,
      parsed.data.yakitoriPlayers,
      parsed.data.tobiPlayers,
      parsed.data.tobashiPlayer
    );

    const summary = summarize(entries);

    assert.strictEqual(summary.length, 4, "all table players should be included in aggregate");
    assert.strictEqual(summary[0].name, "Alice", "highest score player should be ranked first");
    assert.strictEqual(summary[0].topCount, 1, "top player should have one top count");
    assert.strictEqual(summary[0].tobashiCount, 1, "tobashi should be reflected");

    const bob = summary.find((row) => row.name === "Bob");
    assert.ok(bob, "Bob should exist in aggregate output");
    assert.strictEqual(bob.yakitoriCount, 1, "yakitori should be reflected into aggregate output");

    const dave = summary.find((row) => row.name === "Dave");
    assert.ok(dave, "Dave should exist in aggregate output");
    assert.strictEqual(dave.lastCount, 1, "last rank should be reflected");
    assert.strictEqual(dave.tobiCount, 1, "tobi should be reflected");
  });
});
