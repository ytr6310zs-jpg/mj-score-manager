export type ScorePrecision = "integer" | "tenth";

export type ScoringRuleSetId = "legacy-2026" | "mleague-2027";

export type ScoringRuleSet = {
  id: ScoringRuleSetId;
  scorePrecision: ScorePrecision;
  scoreMin: number;
  scoreMax: number;
  sumTolerance: number;
};

export const DEFAULT_SCORING_RULES_EFFECTIVE_DATE = "2027-01-01";

export const LEGACY_SCORING_RULES: ScoringRuleSet = {
  id: "legacy-2026",
  scorePrecision: "integer",
  scoreMin: -1000,
  scoreMax: 1000,
  sumTolerance: 1,
};

export const MLEAGUE_2027_SCORING_RULES: ScoringRuleSet = {
  id: "mleague-2027",
  scorePrecision: "tenth",
  scoreMin: -1000,
  scoreMax: 1000,
  sumTolerance: 0.1,
};

type EnvLike = Record<string, string | undefined>;

function readEnv(): EnvLike {
  return typeof process !== "undefined" && process.env ? process.env : {};
}

export function getScoringRulesEffectiveDate(env: EnvLike = readEnv()): string {
  const raw = (env.SCORING_RULES_EFFECTIVE_DATE ?? env.NEXT_PUBLIC_SCORING_RULES_EFFECTIVE_DATE ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  return DEFAULT_SCORING_RULES_EFFECTIVE_DATE;
}

export function resolveScoringRuleSet(gameDate: string, env: EnvLike = readEnv()): ScoringRuleSet {
  const effectiveFrom = getScoringRulesEffectiveDate(env);
  if (gameDate >= effectiveFrom) {
    return MLEAGUE_2027_SCORING_RULES;
  }
  return LEGACY_SCORING_RULES;
}

export function quantizeScore(value: number, precision: ScorePrecision): number {
  if (precision === "integer") {
    return Math.round(value);
  }
  return Math.round(value * 10) / 10;
}

export function isValidScoreForRuleSet(value: number, rules: ScoringRuleSet): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < rules.scoreMin || value > rules.scoreMax) return false;
  if (rules.scorePrecision === "integer") {
    return Number.isInteger(value);
  }
  return Math.abs(value - quantizeScore(value, "tenth")) < 1e-9;
}

export function parseScoreInput(raw: string, rules: ScoringRuleSet): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  if (rules.scorePrecision === "integer") {
    if (!Number.isInteger(parsed)) return null;
    if (parsed < rules.scoreMin || parsed > rules.scoreMax) return null;
    return parsed;
  }

  const quantized = quantizeScore(parsed, "tenth");
  if (Math.abs(parsed - quantized) > 1e-9) return null;
  if (quantized < rules.scoreMin || quantized > rules.scoreMax) return null;
  return quantized;
}

/** DB / JSON からの読取。小数第1位まで保持する（整数もそのまま）。 */
export function parseStoredScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return quantizeScore(value, "tenth");
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return quantizeScore(parsed, "tenth");
    }
  }
  return 0;
}

export function scoreInputStep(rules: ScoringRuleSet): string {
  return rules.scorePrecision === "integer" ? "1" : "0.1";
}

export function scoreFieldValidationMessage(rules: ScoringRuleSet, scoreIndex: number): string {
  if (rules.scorePrecision === "integer") {
    return `スコア${scoreIndex}は ${rules.scoreMin} から ${rules.scoreMax} の整数で入力してください。`;
  }
  return `スコア${scoreIndex}は ${rules.scoreMin} から ${rules.scoreMax} の小数第1位までの値で入力してください。`;
}

export function sumToleranceMessage(rules: ScoringRuleSet): string {
  if (rules.sumTolerance >= 1) {
    return "最終スコア合計は 0 にしてください。四捨五入の記載誤差として ±1 までは許容しています。";
  }
  return `最終スコア合計は 0 にしてください。記載誤差として ±${rules.sumTolerance} までは許容しています。`;
}
