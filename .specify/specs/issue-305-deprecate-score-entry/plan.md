# Implementation Plan: スコア入力画面の非推奨化と初期遷移変更

**Branch**: `cursor/issue-305-deprecate-score-entry-bdc1` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)  
**Status**: Approved — 実装中  
**Related Issue**: [#305](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/305)

---

## Summary

スコア入力（`/`）を **削除せず deprecate** し、**UI の動作保証・積極メンテ対象から外す**。  
ログイン後は全ロール `/matches`。画面内バナーで非推奨・非保証・推奨フローを示す。  
**専用 Playwright（`score-entry.spec.ts`）は削除**する。エージェント向けに `AGENTS.md` / `project-core.mdc` へ「必要時のみ改修」を書く。共有の `saveScoreAction`・ドメイン検証・取り込みテストは維持。

---

## Technical Context

**Language/Version**: TypeScript（Next.js 15 / React 19）  
**Primary Dependencies**: Next.js App Router, Server Actions  
**Storage**: 変更なし  
**Testing**: score-entry E2E **削除**。他 Playwright はログイン待ちの最小修正のみ。`npm run build`  
**Target Platform**: Web  
**Project Type**: Brownfield web app  
**Constraints**: 最小差分、UI 非保証、共有ドメイン品質は維持  
**Scale/Scope**: 導線・コピー・テスト削除・エージェント規約（おおよそ 8〜12 ファイル）

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| I. Domain-First | PASS | UI 非保証でも `lib/` 検証・取り込みは品質対象 |
| II. Spec-Driven | PASS | 本 3 点セット。エージェント規約も Spec の成果物 |
| III. Security | PASS | 権限マトリクス不変。欠陥ゲート時のみ UI 改修可 |
| IV. Quality Gates | PASS（実装時） | `npm run build` 必須。score-entry 欠落で CI が落ちないこと |
| V. Minimal Diff | PASS | 削除は専用テストとコピー／redirect／規約に限定 |

---

## Research（要約）

### Decision: 専用 E2E は直さず捨てる

- **Rationale**: 非保証なら赤テストを直し続けるのは浪費（ユーザー指摘）。
- **Rejected**: 「最低限だけ直す」→ エージェントがまたメンテ対象とみなす。

### Decision: エージェント規約に D4–D7 を常時適用で書く

- **Rationale**: バナーや Issue だけではエージェントに届かない。
- **正本**: `.cursor/rules/project-core.mdc`（alwaysApply）+ `AGENTS.md` 入口。委任ガイドは短い相互参照で可。

### Decision: 共有 `saveScoreAction` は残す

- **Rationale**: 取り込みが依存。UI 非保証と API 共有は矛盾しない。
- **Note**: 共有層の変更時、score-form への追従は最小。UI 専用テストは増やさない。

### Decision: 他 E2E の「スコア入力」リンク操作

- **Rationale**: filter-state 等がリンク名に依存しうる。フロー保証にならない範囲で待ち URL やクリック先を調整。新規 score-entry スペックは作らない。

---

## 変更予定ファイル

| ファイル | 変更 |
|----------|------|
| `app/login/actions.ts` | 成功時 redirect を常に `/matches` |
| `components/score-form.tsx` または `app/page.tsx` | 非推奨・非保証バナー + import リンク |
| `app/matches/page.tsx` | 空状態を取り込み優先へ |
| `docs/user-manual.md`（必要なら `docs/manual.md` / `README.md`） | 非推奨・非保証・推奨フロー |
| `.github/specs/app-spec.md` | deprecate・非保証注記 |
| `test/e2e/ui/score-entry.spec.ts` | **削除** |
| `test/e2e/ui/match-import.spec.ts` 等 | ログイン後 URL 待ちの最小修正（必要なものだけ） |
| `AGENTS.md` | スコア入力 UI 方針（D4–D7） |
| `.cursor/rules/project-core.mdc` | 同上（常時適用） |
| `docs/agent-delegation-guide.md` | 短い相互参照（任意だが推奨） |
| `.github/agent-instructions.md` | CI 必須文書への短い相互参照（任意だが推奨） |

**触らない**: `saveScoreAction` の保存ロジック本体（共有バグ時を除く）、取込ビジネスロジック、編集画面、middleware の viewer 制限。

---

## Agent rule 文案（実装時にそのまま載せる想定）

```text
## スコア入力 UI（`/` / `components/score-form.tsx`）

- 運用上 deprecate。動作保証・積極メンテナンスの対象外。
- 専用自動テスト（例: score-entry E2E）は置かない。復活させない。
- 改修してよいのは次のいずれか: (1) ユーザー明示依頼 (2) 取り込み等と共有する層の必要最小追従 (3) セキュリティ／データ破壊など放置不能な欠陥。
- #304 等の UX 洗い出しでも原則対象外。提案しない。
```

---

## Implementation Approach

1. Redirect を `/matches` に統一  
2. バナー（非推奨・非保証・import リンク）  
3. `score-entry.spec.ts` 削除 + 他 E2E の最小追随  
4. 空状態・docs・app-spec  
5. AGENTS / project-core（+ 相互参照）  
6. `npm run build` と Playwright（残存スペック）が通ること

---

## Risks

| Risk | Mitigation |
|------|------------|
| 手入力回帰に気づかない | 仕様どおり。推奨経路は取り込み E2E／手動 |
| 共有 `saveScoreAction` 変更で UI が壊れる | 共有層はテスト維持。UI は非保証と明記 |
| エージェントがまた score-entry を追加 | 規約で禁止。PR レビューで弾く |
| 「サポート終了」＝削除と誤解 | 残置・非保証をバナーと docs で併記 |

---

## Complexity Tracking

該当なし。
