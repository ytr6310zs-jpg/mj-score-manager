import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildImportDedupeKey,
  findFuzzyPlayerCandidates,
  parseGameNoFromNotes,
  parseSpreadsheetIdFromUrl,
  parseSpreadsheetMatrix,
} from "../lib/spreadsheet-import.ts";
import YAKUMANS from "../lib/yakumans.ts";

describe("parseSpreadsheetIdFromUrl", () => {
  it("Google Sheets URL から spreadsheetId を抽出できる", () => {
    const id = parseSpreadsheetIdFromUrl("https://docs.google.com/spreadsheets/d/abc123DEF_-/edit#gid=0");
    assert.strictEqual(id, "abc123DEF_-");
  });

  it("不正URL は null を返す", () => {
    assert.strictEqual(parseSpreadsheetIdFromUrl("https://example.com"), null);
  });
});

describe("parseSpreadsheetMatrix", () => {
  it("40試合定義のうち入力済み試合だけを解析し、役満とフラグを復元できる", () => {
    const matrix = [
      ["player", "1", "1", "1", "1", "2", "2", "2", "2"],
      ["name", "SCORE", "YAKUMAN", "YAKITORI", "TOBI_TOBASHI", "SCORE", "YAKUMAN", "YAKITORI", "TOBI_TOBASHI"],
      ["A", "350", "DA:大三元", "FALSE", "B", "200", "", "FALSE", ""],
      ["B", "100", "", "TRUE", "", "-100", "", "TRUE", "飛び"],
      ["C", "-200", "", "FALSE", "飛び", "-100", "", "FALSE", ""],
      ["D", "-250", "", "FALSE", "", "0", "", "FALSE", "飛ばし"],
    ];

    const parsed = parseSpreadsheetMatrix(matrix, "春季リーグ_2026-05-01", YAKUMANS);
    assert.strictEqual(parsed.inferredDate, "2026-05-01");
    assert.strictEqual(parsed.games.length, 2);

    const g1 = parsed.games[0];
    assert.strictEqual(g1.gameNo, 1);
    assert.strictEqual(g1.gameType, "4p");
    assert.deepStrictEqual(g1.players, ["A", "B", "C", "D"]);
    assert.deepStrictEqual(g1.tobiPlayers, ["C"]);
    assert.deepStrictEqual(g1.tobashiPlayers, ["A"]);
    assert.strictEqual(g1.yakumanSelections.length, 1);
    assert.strictEqual(g1.yakumanSelections[0].yakumanCode, "DA");

    const g2 = parsed.games[1];
    assert.strictEqual(g2.gameNo, 2);
    assert.strictEqual(g2.tobiPlayers[0], "B");
    assert.strictEqual(g2.tobashiPlayers[0], "D");
  });

  it("参加人数が 3/4 以外の試合は warning としてスキップされる", () => {
    const matrix = [
      ["player", "1", "1", "1", "1"],
      ["name", "SCORE", "YAKUMAN", "YAKITORI", "TOBI_TOBASHI"],
      ["A", "100", "", "", ""],
      ["B", "-100", "", "", ""],
    ];

    const parsed = parseSpreadsheetMatrix(matrix, "x", YAKUMANS);
    assert.strictEqual(parsed.games.length, 0);
    assert.ok(parsed.warnings.some((w) => w.includes("参加人数が不正")));
  });
});

describe("dedupe and fuzzy helpers", () => {
  it("dedupe key はプレーヤー順に依存しない", () => {
    const a = buildImportDedupeKey(1, "2026-05-01", 2, ["A", "B", "C"]);
    const b = buildImportDedupeKey(1, "2026-05-01", 2, ["C", "B", "A"]);
    assert.strictEqual(a, b);
  });

  it("notes から gameNo を抽出できる", () => {
    assert.strictEqual(parseGameNoFromNotes("SPREADSHEET_IMPORT gameNo=12"), 12);
    assert.strictEqual(parseGameNoFromNotes("other"), null);
  });

  it("曖昧一致候補を返せる", () => {
    const candidates = findFuzzyPlayerCandidates("山", ["山田", "ヤマダ", "田中"]);
    assert.ok(Array.isArray(candidates));
    assert.ok(candidates.includes("山田"));
  });
});
