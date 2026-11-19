import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SCORING_RULES_EFFECTIVE_DATE,
  formatScoreForInput,
  getScoringRulesEffectiveDate,
  isScoreSumWithinTolerance,
  isValidScoreForRuleSet,
  parseScoreInput,
  parseStoredScore,
  resolveScoringRuleSet,
  scoreInputStep,
  sumScores,
} from "../lib/scoring-rules.ts";

describe("resolveScoringRuleSet", () => {
  it("既定の適用開始日より前は legacy", () => {
    const rules = resolveScoringRuleSet("2026-12-31", {});
    assert.equal(rules.id, "legacy-2026");
    assert.equal(rules.scorePrecision, "integer");
    assert.equal(rules.sumTolerance, 1);
  });

  it("適用開始日ちょうどから mleague-2027", () => {
    const rules = resolveScoringRuleSet(DEFAULT_SCORING_RULES_EFFECTIVE_DATE, {});
    assert.equal(rules.id, "mleague-2027");
    assert.equal(rules.scorePrecision, "tenth");
    assert.equal(rules.sumTolerance, 0.1);
  });

  it("env で適用開始日を上書きできる", () => {
    const env = { SCORING_RULES_EFFECTIVE_DATE: "2026-06-01" };
    assert.equal(getScoringRulesEffectiveDate(env), "2026-06-01");
    assert.equal(resolveScoringRuleSet("2026-05-31", env).id, "legacy-2026");
    assert.equal(resolveScoringRuleSet("2026-06-01", env).id, "mleague-2027");
  });
});

describe("parseScoreInput", () => {
  it("legacy は整数のみ", () => {
    const rules = resolveScoringRuleSet("2026-01-01", {});
    assert.equal(parseScoreInput("12", rules), 12);
    assert.equal(parseScoreInput("12.5", rules), null);
    assert.equal(parseScoreInput("1001", rules), null);
  });

  it("新ルールは小数第1位まで", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    assert.equal(parseScoreInput("12.5", rules), 12.5);
    assert.equal(parseScoreInput("-0.5", rules), -0.5);
    assert.equal(parseScoreInput("12.55", rules), null);
    assert.equal(scoreInputStep(rules), "0.1");
  });
});

describe("isValidScoreForRuleSet / parseStoredScore", () => {
  it("新ルールで 12.5 を有効と判定する", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    assert.equal(isValidScoreForRuleSet(12.5, rules), true);
    assert.equal(isValidScoreForRuleSet(12.55, rules), false);
  });

  it("DB 読取で小数を落とさない", () => {
    assert.equal(parseStoredScore("12.5"), 12.5);
    assert.equal(parseStoredScore(45), 45);
    assert.equal(parseStoredScore("45.0"), 45);
  });

  it("自動入力の残り点を小数第1位に量子化する", () => {
    const filledSum = 10.1 + 20.2;
    assert.equal(formatScoreForInput(-filledSum, "tenth"), "-30.3");
  });
});

describe("sumScores / isScoreSumWithinTolerance", () => {
  it("十点換算で浮動小数の合計ずれを吸収する", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    // Classic FP: 0.1 + 0.2 !== 0.3 in IEEE-754
    assert.equal(sumScores([0.1, 0.2, -0.3], "tenth"), 0);
    assert.equal(isScoreSumWithinTolerance([0.1, 0.2, -0.3], rules), true);
  });

  it("3p の小数スコアで合計0を許容する", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    const scores = [50.1, -25.0, -25.1];
    assert.equal(sumScores(scores, "tenth"), 0);
    assert.equal(isScoreSumWithinTolerance(scores, rules), true);
  });

  it("合計が ±0.1 を超えると拒否する", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    assert.equal(isScoreSumWithinTolerance([50.2, -25.0, -25.0], rules), false);
  });

  it("境界 ±0.1 は許容する", () => {
    const rules = resolveScoringRuleSet("2027-01-01", {});
    assert.equal(isScoreSumWithinTolerance([50.1, -25.0, -25.0], rules), true);
  });
});
