# Feature Specification: 変更クラス判定と設計承認スキップ

**Feature Branch**: `feature/issue-308-change-class-design-skip`  
**Created**: 2026-11-20  
**Status**: Approved — 実装完了  
**Related Issue**: [#308](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/308)  
**Input**: 低リスク変更では設計承認がボトルネック。PROD（`/release`）と高リスクは常に人間承認のまま、変更クラスで設計承認スキップ可否を切り替える。

---

## 背景・目的

現行フローは設計完了時のユーザー承認が必須で、安定運用には有効だが、文書のみ・薄い実装では厚すぎる。本番は仲間内利用でも交流記録を持つため、PROD リリース権限は緩めない。省略してよいのは **設計承認** と実装中の細かい確認であり、リリース権限ではない。

本 Issue では:

1. 変更クラス（A–D）と必須承認点を一意に文書化する
2. Issue 着手時にクラスを判定・合意するフェーズ（`/triage`）を追加する
3. 合意後、A/B は条件付きで `/design` → `/implement` を連続実行可能にする
4. C/D および `/release` は人間承認必須のまま維持・強調する

関連: #307（規約正本整理）は完了済み。#296（`/design` の develop↔main 同期ゲート）は入口ゲートとして維持する。

### 確定方針（Issue 案を採用・具体化）

| ID | 決定 |
|----|------|
| Q1 | 追加コマンド名は **`/triage`**（`/clarify` は不明点洗い出し専用のまま残す） |
| Q2 | 変更クラス表は Issue の A–D を正とする（下表）。判定不明時は **fail-up**（上位クラスへ） |
| Q3 | A は Spec 3 点任意（**PR 本文 Spec 節で可**）。B は **薄い Spec 3 点を推奨**（PR Spec のみも可だが、連続実行時は 3 点または同等の明示を残す） |
| Q4 | 設計承認スキップは **トリアージでクラス合意済みの A/B に限る**。合意がない場合は現行どおり設計完了で停止 |
| Q5 | `/pr`・commit/push・`/release` はクラス不問で **明示依頼＋人間**（release は常に人間） |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 変更クラスと承認マトリクスが一意に分かる (Priority: P1)

メンテナ／エージェントとして、Issue 着手前に「この変更はどのクラスで、どこで人間承認が必要か」をドキュメントまたはコマンドから一意に知りたい。

**Why this priority**: 受け入れ条件の中核。以降のスキップ可否の前提。

**Independent Test**: 入口ドキュメントと `/triage`（または参照先）を読み、A–D の定義・設計承認・Spec・`/pr`・`/release` の扱いが一表で辿れることで確認できる。

**Acceptance Scenarios**:

1. **Given** リポジトリの入口（少なくとも `AGENTS.md` と委任／Issue ガイドのいずれか）, **When** 変更クラスを探す, **Then** A–D の定義と必須承認点が矛盾なく記載されている
2. **Given** 同上, **When** `/release` の扱いを確認する, **Then** クラス不問で常に人間承認と明記されている
3. **Given** 判定に自信がないケース, **When** ルールを適用する, **Then** 上位クラスへ上げる（fail-up）と書かれている

---

### User Story 2 - Issue 着手時にクラスを判定・合意する (Priority: P1)

エージェントとして、実装や厚い設計に入る前に Issue／想定差分から変更クラスを判定し、必須承認点を提示してユーザー合意を取りたい。

**Why this priority**: Issue の「追加フェーズ」。スキップのゲートになる。

**Independent Test**: `/triage` を実行した会話で、クラス案・根拠・必須承認点・ユーザー合意の待ちが出力されることで確認できる（アプリ実行ではない）。

**Acceptance Scenarios**:

1. **Given** オープンな Issue, **When** `/triage` を実行する, **Then** 推奨クラス（A–D）・根拠・必須承認点・fail-up 注記が提示される
2. **Given** クラス案の提示後, **When** ユーザーが合意する（または修正クラスを指定する）, **Then** 以降の `/design` / `/implement` がそのクラスのルールに従う前提が会話上明確になる
3. **Given** 境界が曖昧な差分（例: UI 文言＋薄いロジック）, **When** 判定する, **Then** 安全側（上位クラス）を推奨する

---

### User Story 3 - A/B で設計承認をスキップし連続実行できる (Priority: P1)

メンテナとして、文書のみや低リスク実装では、トリアージ合意後に設計承認待ちで止まらず `/design` → `/implement` を進めたい。

**Why this priority**: Issue の主目的（ボトルネック解消）。

**Independent Test**: コマンド／ガイドに「A/B かつトリアージ合意済みなら設計完了停止を省略可」とあり、C/D では省略不可と対比されていることで確認できる。

**Acceptance Scenarios**:

1. **Given** トリアージで **A** 合意, **When** エージェントが作業する, **Then** Spec 3 点なしでも PR Spec 節での進行が許容され、設計承認待ちで必須停止しない（commit/push/PR は従来どおり明示依頼）
2. **Given** トリアージで **B** 合意, **When** `/design` 相当の成果を出す, **Then** 薄い Spec 3 点（または同等）のあと、設計承認なしで `/implement` に進んでよい
3. **Given** トリアージ未実施または未合意, **When** `/design` を完了する, **Then** 現行どおりユーザー承認待ちで停止する

---

### User Story 4 - C/D と PROD の人間承認を維持する (Priority: P1)

運営者として、通常機能・高リスク・本番リリースでは、クラス導入後も人間が止められるようにしたい。

**Why this priority**: 本番データ保護。Issue 明示の非緩和対象。

**Independent Test**: マトリクスと `/release`・停止条件の記述が「C/D 必須」「release 常に人間」のままであることで確認できる。

**Acceptance Scenarios**:

1. **Given** クラス **C** または **D**, **When** `/design` が完了する, **Then** ユーザー設計承認なしに `/implement` へ進んではならない
2. **Given** クラス **D**, **When** 設計する, **Then** 影響範囲（schema / 認証 / RLS / 破壊的変更）の明示が必須と書かれている
3. **Given** 任意のクラス, **When** `/release` または main 反映を行う, **Then** 人間承認が必須であり、トリアージ合意では代替できない

---

### Edge Cases

- トリアージ後に差分が想定より大きくなった → クラスを再判定し fail-up。既にスキップした設計承認は取り消して停止し直す
- A と自己判定したが `supabase/migrations` や認証コードが含まれる → 自動的に C/D 相当へ上げ、設計承認必須
- `/clarify` のみ実行し `/triage` していない → 設計承認スキップ不可（現行フロー）
- 小さな修正を PR Spec 節だけで進める既存の CI check-spec 経路と A の整合（二重規範にしない）
- Constitution II（Spec-Driven）との関係: A/B の条件付き省略は「日次運用の例外」として入口に明記し、憲法本文の全面改稿は本 Issue の必須としない（矛盾時は「大きな変更は合意後」を C/D で満たす）

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Repository MUST 変更クラス A–D の定義と承認マトリクス（設計承認 / Spec / `/pr` / `/release`）を文書化する
- **FR-002**: Repository MUST 判定不明時に上位クラスへ上げる fail-up ルールを明記する
- **FR-003**: Repository MUST `/triage` スラッシュコマンドを追加し、クラス判定・必須承認点提示・ユーザー合意待ちを手順化する
- **FR-004**: Repository MUST `/clarify` を不明点洗い出し専用として維持し、クラス合意の正本を `/triage` に置く
- **FR-005**: `/design` / `/implement` / 委任ガイド / Issue プロンプトガイド MUST クラス連動の進行ルール（A/B スキップ条件、C/D 必須停止）を反映する
- **FR-006**: System（エージェント手順）MUST NOT トリアージ未合意のまま A/B の設計承認スキップを適用する
- **FR-007**: System MUST `/release` および main 反映をクラス不問で人間承認のまま維持・強調する
- **FR-008**: System MUST commit / push / PR（`/pr`）をクラス不問でユーザー明示依頼のまま維持する
- **FR-009**: System MUST `/design` の main↔develop 同期ゲート（#296）を緩和しない
- **FR-010**: System MUST hooks / husky の機密・worklog ガード、および `npm run build` 必須を緩和しない
- **FR-011**: This change MUST NOT アプリ業務ロジック・DB スキーマを変更する
- **FR-012**: Entry docs（`AGENTS.md` の Commands 表など）MUST `/triage` を一覧に含める

### Key Entities

- **ChangeClass**: `A` | `B` | `C` | `D`。想定差分の粒度とリスク
- **ApprovalMatrix**: クラスごとの設計承認・Spec 形態・`/pr`・`/release` の要否
- **TriageResult**: 推奨クラス、根拠、必須承認点、ユーザー合意状態（会話上。永続 DB は不要）

### 変更クラス（正）

| クラス | 例 | 設計承認 | Spec | `/pr` | `/release`（PROD） |
|---|---|---|---|---|---|
| **A. 文書/設定のみ** | rules、docs、コメント、commands 文言 | トリアージ合意後スキップ可 | PR Spec 節で可（3 点任意） | 明示依頼 | 別判断・常に人間 |
| **B. 低リスク実装** | UI 文言、表示条件、テスト追加 | トリアージ合意後スキップ可 | 薄い Spec 3 点推奨（PR Spec 可） | 明示依頼 | 不可（develop まで） |
| **C. 通常機能** | 画面ロジック、集計表示 | **必須** | Spec 3 点 | 明示依頼 | 不可 |
| **D. 高リスク** | schema、認証、RLS、破壊的変更 | **必須＋影響明示** | Spec 3 点 | 明示依頼 | **必須・厳格** |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: エージェントが入口または `/triage` だけから A–D と必須承認点を誤読なく列挙できる
- **SC-002**: A/B（トリアージ合意済み）の手順書上、設計完了の必須停止が「省略可」と明示されている
- **SC-003**: C/D および `/release` の手順書上、人間承認が必須のままである
- **SC-004**: fail-up が `/triage` とガイドの両方に書かれている
- **SC-005**: `npm run build` が成功する（ドキュメント／コマンドのみでも確認）

---

## Assumptions

- 永続的な「クラス台帳」や GitHub Issue ラベル自動付与は v1 必須としない（会話＋文書で足りる）
- テンプレによる事前合意（委任ガイドのコピペ）は「この Issue はクラス B でトリアージ済み」等の一文で足りる
- Constitution 本文の版上げは必須としない。日次運用（commands / project-core / ガイド）で例外を明示する
- #308 自体の実装は文書・コマンドのみ → 実装時クラスは **A** 相当（ただし本設計承認は現行フローで実施）

## 非スコープ

- アプリコード・DB・RLS・認証実装の変更
- hooks / husky 本体の緩和
- `/release` の admin マージ方針変更
- 変更クラスの自動機械判定（LLM 判定＋人間合意で足りる）
- GitHub Projects / ラベル必須化
