import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SCORING_RULES_EFFECTIVE_DATE,
  formatScoreForInput,
  getScoringRulesEffectiveDate,
  isValidScoreForRuleSet,
  parseScoreInput,
  parseStoredScore,
  resolveScoringRuleSet,
  scoreInputStep,
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
