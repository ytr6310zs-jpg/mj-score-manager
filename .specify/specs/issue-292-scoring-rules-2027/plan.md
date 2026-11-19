# Implementation Plan: 集計ルール変更（2027-01 以降適用）

**Branch**: `cursor/issue-292-scoring-rules-2027-b7b7` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)  
**Status**: Approved — 実装中

---

## Summary

対局日で **ScoringRuleSet** を切り替え、`2027-01-01` 以降だけ小数第1位を許可する。ウマは **4p の入力規約**（ウマ込み最終ポイントを既存欄へ）とし、自動加算もガイド UI も追加しない。3p は小数のみ。2026 年データは非破壊。

---

## Technical Context

**Language/Version**: TypeScript (Next.js 15 / React 19)  
**Primary Dependencies**: Next.js App Router, Server Actions, Supabase JS  
**Storage**: Supabase PostgreSQL（`games`）  
**Testing**: unit（validate / scoring-rules）、必要なら UI e2e、`npm run build`  
**Target Platform**: Web（Vercel + Supabase）  
**Project Type**: Brownfield web app  
**Constraints**: 履歴非破壊、local Supabase でスキーマ検証、秘密情報を含めない  
**Scale/Scope**: 検証・入出力・取込・読取・表示・docs

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Domain-First | PASS | ルールを `lib/scoring-rules.ts` に集約。曖昧点は確定済み |
| II. Spec-Driven | PASS | 本 3 点セット |
| III. Security | PASS | 認証変更なし。env は適用日上書きのみ |
| IV. Quality Gates | PASS（実装時） | `npm run build` 必須 |
| V. Minimal Diff | PASS | ガイド UI・自動ウマ・追加列なし |

---

## Research（要約）

### Decision: ルール選択は対局日ベース

- **Rationale**: Issue が日付で語っている。管理トグルより単純。
- **Alternatives**: グローバル flag のみ → 日付境界が曖昧。大会ごと → スキーマ過剰。

### Decision: `NUMERIC(6,1)` へ移行

- **Rationale**: 小数第1位要件。既存整数は `.0` として互換。
- **必須**: `toInt` / 取込 `Math.round` をルール対応パーサへ置換。

### Decision: ウマはコードで加算しない

- **Rationale**: Q1-A + ガイド不要。保存値 = 集計値の現行モデルを維持。
- **Docs**: README / app-spec に「2027-01 以降の 4p はウマ込みで入力」と明記。参考ウマ表はドキュメントのみ。

### Decision: 検証用上書き

- env 例: `SCORING_RULES_EFFECTIVE_DATE=YYYY-MM-DD`（未設定時 `2027-01-01`）
- staging/prod に不用意に書かない旨を docs に記載

---

## Data Model（要約）

### ScoringRuleSet（コード定数。DB テーブルなし）

| Field | legacy | mleague-2027 |
|-------|--------|--------------|
| `effectiveFrom` | fallback | `2027-01-01`（env 可） |
| `scorePrecision` | integer | 1 decimal |
| `sumTolerance` | 1 | 0.1（推奨） |
| `umaInputConvention` | none | 4p only（enforce in docs, not auto-calc） |

### Schema

```text
games.score1–score4: INTEGER → NUMERIC(6,1)
games.score_total:   INTEGER → NUMERIC(6,1)
```

追加列なし。集計は保存値の合算を継続。

---

## Project Structure

### Documentation

```text
.specify/specs/issue-292-scoring-rules-2027/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source（変更予定）

```text
lib/scoring-rules.ts                 # 新規
lib/validate-match.ts
lib/matches.ts
lib/spreadsheet-import.ts
app/match-import-actions.ts
components/score-form.tsx            # step / クライアント検証のみ（ウマガイドなし）
components/match-edit-form.tsx
表示・export の丸め経路（必要最小）
supabase/migrations/*_games_scores_numeric.sql
.github/specs/app-spec.md
README.md
test/validate-match.mjs
test/scoring-rules*.test.js          # 新規推奨
```

---

## Implementation Phases

1. Foundation: `scoring-rules` + 単位テスト + NUMERIC マイグレーション  
2. Validate / import: 日付切替（US1）  
3. UI + read path: 小数（US2）。ウマガイドは追加しない  
4. Docs: ウマ込み入力規約・候補表（US3/US4）  
5. 回帰: SC-003、`npm run build`

---

## Risks

| Risk | Mitigation |
|------|------------|
| `Math.round` / `toInt` 残留 | 横断 grep を tasks に含める |
| ウマをアプリが検証しないことへの誤解 | README / app-spec で明示 |
| NUMERIC と JS number | 小数第1位へ量子化、比較は許容誤差 |

---

## Test Plan（実装フェーズ）

- Unit: RuleSet 境界、validate 新旧
- 回帰: 既存 validate / 保存系
- Manual: `2026-12-31` vs `2027-01-01`、2026 年フィルタ集計
- Build: `npm run build`
