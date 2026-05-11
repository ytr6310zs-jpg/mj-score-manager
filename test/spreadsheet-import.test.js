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
  it("1試合1列フォーマットを解析し、役満テーブルとフラグを復元できる", () => {
    const matrix = [
      ["player", "1", "2"],
      ["A", "350, t", "200"],
      ["B", "100, y", "-100, tb"],
      ["C", "-200,TB", "-100"],
      ["D", "-250", "0, T"],
      [],
      ["gameNo", "player", "yakuman", "count"],
      ["1", "A", "大三元 / DA", "1"],
      ["1", "A", "大三元 / DA", "2"],
      ["2", "B", "国士無双 ／ KY", ""],
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
    assert.strictEqual(g1.yakumanSelections[0].count, 3);

    const g2 = parsed.games[1];
    assert.strictEqual(g2.gameNo, 2);
    assert.strictEqual(g2.tobiPlayers[0], "B");
    assert.strictEqual(g2.tobashiPlayers[0], "D");
    assert.strictEqual(g2.yakumanSelections[0].yakumanCode, "KY");
    assert.strictEqual(g2.yakumanSelections[0].count, 1);
  });

  it("参加人数が 3/4 以外の試合は warning としてスキップされる", () => {
    const matrix = [
      ["player", "1"],
      ["A", "100"],
      ["B", "-100"],
    ];

    const parsed = parseSpreadsheetMatrix(matrix, "x", YAKUMANS);
    assert.strictEqual(parsed.games.length, 0);
    assert.ok(parsed.warnings.some((w) => w.includes("参加人数が不正")));
  });

  it("飛び/飛ばしが同時指定された場合は競合として検知される", () => {
    const matrix = [
      ["player", "1"],
      ["A", "350, t, tb"],
      ["B", "100"],
      ["C", "-200"],
      ["D", "-250"],
    ];

    const parsed = parseSpreadsheetMatrix(matrix, "x", YAKUMANS);
    assert.strictEqual(parsed.games.length, 1);
    assert.deepStrictEqual(parsed.games[0].conflictingFlagPlayers, ["A"]);
    assert.ok(parsed.warnings.some((w) => w.includes("飛び/飛ばし競合")));
  });

  it("未知役満でも 役満名/コード 形式なら解析して取り込み可能にする", () => {
    const matrix = [
      ["player", "1"],
      ["A", "100"],
      ["B", "-100"],
      ["C", "0"],
      ["D", "0"],
      [],
      ["gameNo", "player", "yakuman", "count"],
      ["1", "A", "役満テスト / TST", "1"],
    ];

    const parsed = parseSpreadsheetMatrix(matrix, "x", YAKUMANS);
    assert.strictEqual(parsed.games.length, 1);
    assert.strictEqual(parsed.games[0].yakumanSelections.length, 1);
    assert.strictEqual(parsed.games[0].yakumanSelections[0].yakumanCode, "TST");
    assert.strictEqual(parsed.games[0].yakumanSelections[0].yakumanName, "役満テスト");
    assert.strictEqual(parsed.warnings.some((w) => w.includes("役満が解決できません")), false);
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
