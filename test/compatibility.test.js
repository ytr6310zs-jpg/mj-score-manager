import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCompatibilityMatrix, computeWinRate } from "../lib/compatibility-matrix.js";

describe("computeWinRate", () => {
  it("wins + losses > 0 のとき正しい勝率を返す", () => {
    assert.strictEqual(computeWinRate({ wins: 2, losses: 1, draws: 0 }), (2 / 3) * 100);
  });

  it("全勝のとき 100 を返す", () => {
    assert.strictEqual(computeWinRate({ wins: 3, losses: 0, draws: 0 }), 100);
  });

  it("全敗のとき 0 を返す", () => {
    assert.strictEqual(computeWinRate({ wins: 0, losses: 3, draws: 0 }), 0);
  });

  it("0除算回避: wins + losses = 0 のとき 0 を返す", () => {
    assert.strictEqual(computeWinRate({ wins: 0, losses: 0, draws: 5 }), 0);
    assert.strictEqual(computeWinRate({ wins: 0, losses: 0, draws: 0 }), 0);
  });
});

describe("buildCompatibilityMatrix", () => {
  it("空の matches → 空のマトリクス・プレーヤーなし", () => {
    const result = buildCompatibilityMatrix([]);
    assert.deepStrictEqual(result.players, []);
    assert.strictEqual(result.matrix.size, 0);
  });

  it("2人ゲーム: A(rank1) vs B(rank2) → A勝ち・B負け", () => {
    const matches = [
      {
        players: [
          { name: "A", rank: 1 },
          { name: "B", rank: 2 },
        ],
      },
    ];
    const { matrix } = buildCompatibilityMatrix(matches);
    const ab = matrix.get("A")?.get("B");
    const ba = matrix.get("B")?.get("A");
    assert.deepStrictEqual(ab, { wins: 1, losses: 0, draws: 0 });
    assert.deepStrictEqual(ba, { wins: 0, losses: 1, draws: 0 });
  });

  it("同着順 → 分けカウント増加", () => {
    const matches = [
      {
        players: [
          { name: "A", rank: 1 },
          { name: "B", rank: 1 },
        ],
      },
    ];
    const { matrix } = buildCompatibilityMatrix(matches);
    const ab = matrix.get("A")?.get("B");
    const ba = matrix.get("B")?.get("A");
    assert.deepStrictEqual(ab, { wins: 0, losses: 0, draws: 1 });
    assert.deepStrictEqual(ba, { wins: 0, losses: 0, draws: 1 });
  });

  it("4人ゲーム: 全ペア組み合わせが正しく集計される", () => {
    // A=1位, B=2位, C=3位, D=4位
    const matches = [
      {
        players: [
          { name: "A", rank: 1 },
          { name: "B", rank: 2 },
          { name: "C", rank: 3 },
          { name: "D", rank: 4 },
        ],
      },
    ];
    const { matrix } = buildCompatibilityMatrix(matches);

    // A vs B: A 勝ち
    assert.strictEqual(matrix.get("A")?.get("B")?.wins, 1);
    assert.strictEqual(matrix.get("B")?.get("A")?.losses, 1);

    // A vs D: A 勝ち
    assert.strictEqual(matrix.get("A")?.get("D")?.wins, 1);

    // C vs D: C 勝ち
    assert.strictEqual(matrix.get("C")?.get("D")?.wins, 1);
    assert.strictEqual(matrix.get("D")?.get("C")?.losses, 1);
  });

  it("rank が 0 のプレーヤーはスキップされる", () => {
    const matches = [
      {
        players: [
          { name: "A", rank: 1 },
          { name: "B", rank: 0 }, // 無効
        ],
      },
    ];
    const { players, matrix } = buildCompatibilityMatrix(matches);
    // ペアが成立しないため何も記録されない
    assert.deepStrictEqual(players, []);
    assert.strictEqual(matrix.size, 0);
  });

  it("name が空のプレーヤーはスキップされる", () => {
    const matches = [
      {
        players: [
          { name: "", rank: 1 },
          { name: "B", rank: 2 },
        ],
      },
    ];
    const { players } = buildCompatibilityMatrix(matches);
    assert.deepStrictEqual(players, []);
  });

  it("複数ゲームにわたって戦績が累積される", () => {
    const matches = [
      { players: [{ name: "A", rank: 1 }, { name: "B", rank: 2 }] },
      { players: [{ name: "A", rank: 2 }, { name: "B", rank: 1 }] },
      { players: [{ name: "A", rank: 1 }, { name: "B", rank: 2 }] },
    ];
    const { matrix } = buildCompatibilityMatrix(matches);
    const ab = matrix.get("A")?.get("B");
    assert.deepStrictEqual(ab, { wins: 2, losses: 1, draws: 0 });
  });

  it("プレーヤーリストが日本語ロケールでソートされる", () => {
    const matches = [
      {
        players: [
          { name: "鈴木", rank: 1 },
          { name: "田中", rank: 2 },
          { name: "佐藤", rank: 3 },
        ],
      },
    ];
    const { players } = buildCompatibilityMatrix(matches);
    const expected = ["佐藤", "鈴木", "田中"].sort((a, b) => a.localeCompare(b, "ja"));
    assert.deepStrictEqual(players, expected);
  });
});
