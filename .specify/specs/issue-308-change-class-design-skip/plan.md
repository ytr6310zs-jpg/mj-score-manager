# Implementation Plan: 変更クラス判定と設計承認スキップ

**Branch**: `feature/issue-308-change-class-design-skip` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)  
**Status**: Approved — 実装完了  
**Related Issue**: [#308](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/308)

## Summary

変更クラス A–D と承認マトリクスを入口・ガイドに短く固定し、`.cursor/commands/triage.md` を新設して Issue 着手時のクラス判定・合意を手順化する。`/design`・`/implement`・委任ガイド・Issue プロンプトガイド・`project-core` / `AGENTS.md` をクラス連動に更新し、**トリアージ合意済み A/B のみ**設計承認停止を省略可能にする。`/release`・機密 hooks・worklog・build・`/design` 同期ゲートは緩和しない。アプリコードは触らない。

## Technical Context

**Language/Version**: Markdown（Cursor commands / rules / docs）  
**Primary Dependencies**: なし（アプリ依存なし）  
**Storage**: N/A（クラス合意は会話上。DB なし）  
**Testing**: `npm run build`; 文書の `rg` による矛盾・欠落確認  
**Target Platform**: Cursor Agent 運用（リポジトリ文書）  
**Project Type**: agent-governance / documentation  
**Performance Goals**: N/A  
**Constraints**: 最小差分; 正本以外に規範を増やさない; PROD 承認は不変  
**Scale/Scope**: コマンド 1 追加 + 既存 commands/docs/rules 数ファイルの追記

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| I. Domain-First | PASS | スコアドメイン非対象 |
| II. Spec-Driven | PASS（条件付き） | C/D は 3 点必須。A/B は既存の「小さな修正は PR Spec」と整合する例外を日次運用に明記 |
| III. Security | PASS | 認証・機密ガードは非緩和。D は影響明示を強化 |
| IV. Quality Gates | PASS | build 必須を維持 |
| V. Minimal Diff | PASS | 新規コマンド 1 + 既存の追記。長大な第二マニュアルを作らない |

**Post-design**: マトリクスを複数ファイルに全文複製するとドリフトする → **正本を 1 か所**（推奨: `docs/issue-prompt-guidelines.md` または短い `docs/` 節）にし、他は参照＋要約表に留める。

## Project Structure

### Documentation (this feature)

```text
.specify/specs/issue-308-change-class-design-skip/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source / docs touched

```text
# ADD
.cursor/commands/triage.md

# UPDATE
AGENTS.md                                 # Commands 表に /triage、クラス要約またはリンク
.cursor/commands/design.md                # トリアージ合意 A/B なら設計完了停止を条件付き省略
.cursor/commands/implement.md             # 開始前: クラス確認（C/D は設計承認必須、A/B は合意確認）
.cursor/commands/clarify.md               # /triage との役割分担を 1 段落
.cursor/commands/release.md               # クラス不問・常に人間承認を強調（手順変更は最小）
.cursor/rules/project-core.mdc            # フロー／停止条件にクラス例外を短く
docs/agent-delegation-guide.md            # 標準フローに triage、停止条件表を更新
docs/issue-prompt-guidelines.md           # マトリクス正本＋省略ステップ表＋テンプレ
.github/agent-instructions.md             # 必要なら 1 節で整合（冗長複製しない）
.specify/feature.json                     # 本 feature を指す

# DO NOT TOUCH
app/ lib/ components/ supabase/
.cursor/hooks/**                          # 緩和しない
.husky/**                                 # 緩和しない
```

## Design Decisions

### Decision: `/triage` を独立コマンドにする

- **Choice**: `.cursor/commands/triage.md` を新設。`/clarify` は Q&A 専用のまま
- **Why**: Issue の名前案。clarify にクラス合意を混ぜると「確認だけしたい」用途が曖昧になる
- **Risk**: コマンド増加 → `AGENTS.md` の表で発見性を確保

### Decision: マトリクス正本は `docs/issue-prompt-guidelines.md`

- **Choice**: 省略ステップ表＋A–D 表の正本を Issue ガイドに置く。commands / AGENTS は要約とリンク
- **Why**: 人間のコピペ依頼テンプレと同じ場所に置き、エージェントと人間が同じ表を見る
- **Alternative rejected**: `project-core` に全文 → alwaysApply が肥大化

### Decision: 設計承認スキップの条件を厳密化

- **Choice**: 「A/B **かつ** `/triage`（または委任文面）でクラス合意済み」のときのみ、`/design` 完了時の必須停止を省略可
- **Why**: 未合意スキップは現行の安全弁を壊す（FR-006）
- **Risk**: 合意の証拠が会話のみ → 実装手順に「合意クラスと根拠を design/implement 出力の冒頭に再掲」を入れる

### Decision: A の Spec 3 点は任意

- **Choice**: A は PR Spec 節で可（既存 check-spec と整合）。B は薄い 3 点推奨
- **Why**: Issue 表どおり。文書のみで 3 点必須だとボトルネックが残る
- **Risk**: B を PR Spec だけで走るとドリフト → tasks で「B 連続実行時は 3 点または plan 相当を残す」と書く

### Decision: Constitution は改稿しない

- **Choice**: 日次運用ドキュメントで A/B 例外を明示。憲法 II の「大きな変更は合意後」は C/D で満たす
- **Why**: 最小差分。憲法改定は別判断

## Implementation Approach

1. `docs/issue-prompt-guidelines.md` にマトリクス・省略ステップ・fail-up・トリアージ合意の定義を追加
2. `triage.md` を追加（判定手順・出力テンプレ・合意待ち・fail-up）
3. `design.md` / `implement.md` / `clarify.md` / `release.md` を最小追記
4. `AGENTS.md`・`project-core.mdc`・委任ガイドを連動更新
5. `feature.json` を本 Spec に向ける
6. `npm run build` でゲート確認

## Risks

| Risk | Mitigation |
|---|---|
| エージェントが未合意でスキップ | コマンドに「合意なきスキップ禁止」を MUST で書く。implement 開始チェックにクラス確認 |
| マトリクスの複製ドリフト | 正本 1 か所＋他はリンク |
| A/B と実際の高リスク差分の取り違え | fail-up、および migrations/auth 検出時は D へ強制 |
| `/release` までスキップと誤読 | release コマンドとマトリクスで「常に人間」を繰り返す |

## Test / Verification Plan

- `rg` で「設計フェーズ完了後は必ず停止」と「A/B スキップ可」が矛盾なく併記されているか確認
- `AGENTS.md` に `/triage` があること
- `npm run build` 成功
- （手動）サンプル Issue 想定で `/triage` 出力が表を満たすこと — 実装 PR の自己確認で可
