# MJ Score Manager Constitution

## Core Principles

### I. Domain-First Accuracy
麻雀スコア（四人打ち・三人打ち）の業務ルールを最優先し、UI/実装都合でドメイン定義を歪めない。
- 集計・順位・役満関連ロジックは再利用可能な `lib/` に寄せる。
- 仕様変更時は既存データとの互換性・移行影響を明示する。
- 曖昧な要件は実装前に仕様へ明文化する。

### II. Spec-Driven Development as Default
機能追加・仕様変更は原則として Spec Kit フロー（`spec.md` → `plan.md` → `tasks.md`）で進める。
- 既存機能の改修でも、必要に応じてリバースエンジニアリングで仕様を更新する。
- 大きな変更は設計合意を得てから実装する。
- 実装後は仕様とのドリフトを最小化し、必要に応じて仕様を追随更新する。

### III. Security and Data Protection (Non-Negotiable)
機密情報と認証情報をコード・ログ・コミット・PR本文に含めない。
- `.env*` 差分は常に確認し、機密値をコミットしない。
- Server Action/API は入力バリデーションとエラーハンドリングを厳格に行う。
- 認証・認可・権限に関わる変更では、リスクと影響範囲をPRに明記する。

### IV. Quality Gates Before Commit
品質ゲートを満たさない変更はコミットしない。
- 必須: `npm run build` 成功。
- 推奨: `npm run lint`、`npm test` 実施。
- 失敗時は原因を修正し、再実行してから次工程へ進む。

### V. Minimal, Traceable, Maintainable Changes
変更は最小差分で、意図と根拠を追跡可能にする。
- 無関係なリファクタ・整形は避ける。
- 既存命名・UIパターン・構成方針を尊重する。
- 重大変更（データ構造/公開I/F）は移行手順と互換性影響を文書化する。

## Technical and Operational Constraints

- Primary stack: Next.js + React + TypeScript
- Data layer: Supabase (PostgreSQL)
- Package/runtime constraints: Node `>=20.19.0 <21`, npm `>=10.8.2 <11`
- Spec artifacts location:
  - Spec Kit artifacts: `.specify/specs/<feature>/`
  - App feature specs: `.github/specs/`
  - Daily operation rules: `.github/copilot-instructions.md`

## Workflow and Review Policy

Git操作・ブランチ・コミット・PRの具体的手順は `.github/copilot-instructions.md` を参照。

SDD フロー固有のルール:
1. Spec Kit を用いて `spec.md` → `plan.md` → `tasks.md` の順に整備し、必要なら clarify/analyze を実施する。
2. 実装時は `tasks.md` の順序と依存関係を守る。
3. 実装完了後は `spec.md` との乖離（ドリフト）がないかを確認し、必要なら仕様を追随更新する。

## Governance

- 本 Constitution は本リポジトリにおける開発判断の最上位規約とする。
- 具体的な日次運用ルールは `.github/copilot-instructions.md` を参照し、矛盾時は本 Constitution を優先する。
- 改定時は変更理由・影響範囲・移行方針を同一コミットまたは同一PRで提示する。
- すべてのPRレビューは本 Constitution への適合を確認する。

**Version**: 1.0.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-20
