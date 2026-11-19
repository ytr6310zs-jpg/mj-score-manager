# Implementation Plan: エージェント規約の正本整理と deprecated 資産の削除

**Branch**: `feature/issue-307-agent-docs-canonical` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)  
**Status**: Approved — 実装中  
**Related Issue**: [#307](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/307)

## Summary

旧 Copilot 資産（`.github/instructions/` / `.github/prompts/`）を削除し、入口ドキュメントの deprecated 残置方針を正本階層の短い記述に置き換える。参照は現行の `.cursor/rules/` / `.cursor/commands/pr.md` へ寄せ、`copilot.manifest.json` から消えた prompts パスを除去する。アプリ・CI 必須ファイル・`.github/agents/` は触らない。

## Technical Context

**Language/Version**: Markdown / リポジトリ文書（アプリコード変更なし）  
**Primary Dependencies**: なし（docs + Spec Kit メタ）  
**Storage**: N/A  
**Testing**: `npm run check:required-files`, `npm run build`; `rg` による参照残存確認  
**Target Platform**: Git リポジトリ（Cursor / CI 読取）  
**Project Type**: documentation / agent-governance cleanup  
**Performance Goals**: N/A  
**Constraints**: 最小差分; 正本以外に規範文を増やさない; #308 非スコープ  
**Scale/Scope**: ディレクトリ 2 削除 + 現行 docs 数ファイル + manifest 1

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| I. Domain-First | PASS | スコアドメイン非対象 |
| II. Spec-Driven | PASS | 本 Spec 3 点で進める |
| III. Security | PASS | 機密・認証変更なし |
| IV. Quality Gates | PASS | build + required-files を受け入れに含める |
| V. Minimal Diff | PASS | 削除と参照置換に閉じる。rules 本体改稿なし |

**Post-design**: 階層表を長く書きすぎると V と「正本以外に規範を増やさない」に抵触 → `AGENTS.md` に短い表、`project-core` は 1〜2 行の更新先明記に留める。

## Project Structure

### Documentation (this feature)

```text
.specify/specs/issue-307-agent-docs-canonical/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source / docs touched

```text
# DELETE
.github/instructions/**          # entire directory
.github/prompts/**               # entire directory

# UPDATE (現行のみ)
AGENTS.md
README.md
.cursor/rules/project-core.mdc
.github/agent-instructions.md
docs/issue-prompt-guidelines.md
.specify/integrations/copilot.manifest.json
.specify/feature.json            # 本機能ディレクトリを指す（設計時点で更新済み想定）

# DO NOT TOUCH
.cursor/rules/*.mdc（project-core の当該行以外の大幅改稿）
.github/agents/**
.github/workflows/**（required-files は現状維持）
app/ lib/ components/ supabase/
.specify/specs/issue-274-* / issue-272-*（履歴）
```

## Design Decisions

### Decision: ディレクトリごと削除

- **Choice**: `git rm -r` 相当で両ディレクトリを除去
- **Why**: Issue 受け入れ条件が「存在しない」。README だけの空ディレクトリは残さない
- **Risk**: Copilot Chat 利用者が prompts を探す → 入口で `/pr` と `.cursor/commands` へ誘導

### Decision: 文書階層は AGENTS.md を主、project-core は要約

- **Choice**: Issue の階層表を `AGENTS.md` に短く載せる。`project-core.mdc` は「規約更新先は `.cursor/rules/` のみ」へ置換し、表の重複は最小
- **Why**: 正本以外に規範を増やさない。日次運用の常時適用ルールに長い表を複製しない

### Decision: PR 本文案内は `/pr` へ

- **Choice**: `docs/issue-prompt-guidelines.md` の prompts リンクを `.cursor/commands/pr.md` に置換
- **Why**: 同等手順が既にあり、新規ファイル不要

### Decision: copilot.manifest は prompts エントリのみ削除

- **Choice**: `files` から `.github/prompts/*` キーを除去。`.github/agents/*` と `integration.json` の名前は維持
- **Why**: agents は継続利用。integration リネームはドリフト調査が別途必要で本 Issue 外

### Decision: 履歴 Spec は更新しない

- **Choice**: #274 / #272 Spec の「残置」記述はそのまま
- **Why**: Issue 明示。過去の意思決定記録として有用

## Implementation Approach

1. **削除**: instructions / prompts を除去
2. **manifest**: prompts ハッシュ行を除去
3. **入口更新**: AGENTS 階層表 + deprecated 行削除、README / project-core / agent-instructions の文言置換
4. **委任ガイド周辺**: issue-prompt-guidelines の PR リンク更新
5. **検証**: `rg`、required-files、build

推奨コミット粒度（実装時・ユーザー依頼後）:

1. docs + delete + manifest（1 PR で可。分割するなら delete/manifest → docs）

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 見落とした参照リンク | 実装前に `rg '\.github/(instructions\|prompts)'` を再実行。履歴 Spec 以外を直す |
| AGENTS が長くなり第二の正本化 | 階層は表のみ。手順の詳細は commands/skills へリンク |
| #308 と同時進行で文書衝突 | #307 は階層・削除のみ。変更クラス文言は #308 に任せる |
| Copilot 利用者が混乱 | README / AGENTS で Cursor 正本と `/pr` を明示 |

## Verification Plan

- `test ! -d .github/instructions && test ! -d .github/prompts`
- `rg -n '\.github/(instructions|prompts)'` → 現行入口でヒットなし（または削除済みの過去形のみ）
- `npm run check:required-files`
- `npm run build`
- （推奨）`npm run lint` — docs のみならスキップ可だが PR では実施結果を記載

## Open Decisions

なし（Issue 本文とコメントで方針確定。実装前の追加承認事項なし）

## Related

- Supersedes residual policy of #274（残置 → 削除）
- Related but separate: #308
