# Plan: SDD Bootstrapping — mj-score-manager (Initial)

**Branch**: `feat/sdd/initial-specs` | **Date**: 2026-04-20
**Spec**: `.specify/specs/001-brownfield-profile/spec.md`

## Summary
このプランは既存の `mj-score-manager` リポジトリを Spec-Driven Development (SDD) ワークフローへ移行するための初期計画です。Brownfield ブートストラップにより、プロジェクト固有のテンプレートと初期スペック群（`spec.md` / `plan.md` / `tasks.md`）を生成し、以降の機能追加はスペック主導で進めます。

## Technical Context
- Primary stack: Next.js 15 (app router), React 19, TypeScript
- Database: PostgreSQL (Supabase) — `ddl/`, `migrations/` にスキーマあり
- Tooling: `npm` (node >=20.19), `husky`, `eslint`, `tailwindcss`
- Tests: 既存の `node --test` と `test/validate-match.cjs` を活用

## Objectives / Deliverables
- `.specify/specs/001-brownfield-profile/` に `spec.md`, `plan.md`, `tasks.md` を揃える
- `.github/specs/` に機械可読メタデータ（既に `auto-extracted.*` を追加済み）を保持
- CI によるスペック存在チェック（spec guard）を追加するための準備

## Milestones
1. ブランチ作成: `feat/sdd/initial-specs` (T001)
2. Brownfield bootstrap 実行 → `plan.md` / `tasks.md` 生成 (T002)
3. 生成物の検証（validate）(T003)
4. 生成物レビュー → PR 作成 (T004)
5. CI に spec ガードを追加する Issue を作成 (T005)
6. 小さな機能（例: プレイヤー追加フロー）を SDD で実装・検証 (T006)

## Constraints & Risks
- 既存のビルド成果物（`.next/types` 等）がレポに含まれているため、worktree の切り分けや不要ファイルのクリーンアップを検討
- Brownfield 自動生成はテンプレートベースのため、手動レビューと微修正が必要

## Acceptance Criteria
- `.specify/specs/001-brownfield-profile/` に `spec.md`, `plan.md`, `tasks.md` が存在すること
- `.github/specs/auto-extracted.*` が存在し、主要依存・スクリプトが列挙されていること
- PR が作成可能な changelist（ブランチ）が用意されていること

---

次のステップ: `tasks.md` を生成してタスクを具体化します。