# Feature Specification: E2E が依存するヘッダー／画面遷移の契約を安定化する

**Feature Branch**: `feature/issue-310-e2e-nav-contract`  
**Created**: 2026-11-19  
**Status**: Approved — 実装中  
**Related Issue**: [#310](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/310)（Parent: #304）  
**Unblocks**: #305 / PR #309（Draft）

---

## 背景・目的

#305 対応中の PR #309 で CI `integration`（Playwright）が失敗した。失敗は次の2系統に分かれる。

1. **管理ハンバーガー**: `getByRole('menuitem', { name: '管理' })` が取れない（hard fail）
2. **画面遷移**: `/matches`・`/matches/import` への `page.goto` が `net::ERR_ABORTED`（flaky）

#305 の deprecate 本体を待たず、**E2E が前提にしている UI／遷移契約**だけを先に安定させ、#305 再開のブロッカーを外す。本 Issue は #304（画面全般 UX）の最初のサブ Issue である。

### 現行調査メモ

- ハンバーガーは `components/app-header.tsx` のカスタム Menu。`role="menu"` 内にユーザー情報の `<div>`（menuitem 以外）と、管理 `Link`（`role="menuitem"`）が同居する。ARIA 上不正になりやすく、Playwright の role 照会が不安定になる仮説が有力。
- `admin-navigation.spec.ts`（develop）はログイン後に `waitForURL(.../)` を期待。develop では viewer のみ `/matches`、それ以外は `/`。#305 では全ロール `/matches`。
- `match-import.spec.ts` はログイン後 pathname 待ちのあと、settle なし／弱い `goto` があり、重い `/matches` 着地と組み合わさると `ERR_ABORTED` が出やすい。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 管理メニューが E2E から確実に開ける (Priority: P1)

管理者として、管理配下ページからハンバーガーの「管理」で `/admin` に戻りたい。自動テストも同じ操作で失敗しないことを保証したい。

**Why this priority**: CI の hard fail。#305 再開の前提。

**Independent Test**: admin でログイン → `/admin/users` → ハンバーガー →「管理」→ `/admin` の見出しが見える。Playwright `admin-navigation` がパスする。

**Acceptance Scenarios**:

1. **Given** admin セッションで `/admin/users` を開いている, **When** ハンバーガーを開く, **Then** 「管理」がアクセシブルな操作対象として可視である（Playwright の role／name 契約で取れる）
2. **Given** 同上で「管理」を選ぶ, **When** 遷移する, **Then** URL が `/admin` になり、見出し「管理」が見える
3. **Given** viewer セッション, **When** ハンバーガーを開く, **Then** 「管理」は出ない（権限契約は変えない）

---

### User Story 2 - ログイン後・ページ間遷移が CI で安定する (Priority: P1)

記録者／管理者向け E2E として、ログイン直後および `/matches`・`/matches/import` への遷移で `net::ERR_ABORTED` によるフレークを起こしたくない。

**Why this priority**: #309 で複数 flaky。ログイン着地が `/matches` に寄ると再現しやすい。

**Independent Test**: `match-import`（および同系統のログインヘルパーを使うスペック）が、同一 CI 実行で `goto` 由来の `ERR_ABORTED` なく完走する。

**Acceptance Scenarios**:

1. **Given** E2E がログインに成功した, **When** 直後に別 URL へ `goto` する, **Then** 着地ページが settle してから遷移し、`ERR_ABORTED` にならない
2. **Given** develop 時点のログイン着地（admin は `/`、viewer は `/matches`）と、#305 後の全ロール `/matches` の両方, **When** 共通ログイン待ちを使う, **Then** どちらの着地でもヘルパーが成功する（#310 を develop に先に入れても #305 rebase で壊れない）
3. **Given** `/matches` または `/matches/import` へ遷移する, **When** ページを開く, **Then** 見出しなど安定セレクタで準備完了を確認してからアサーションする

---

### Edge Cases

- ハンバーガーを開いた直後の外側クリック／フォーカス移動でメニューが閉じるタイミング
- MFA（TOTP）あり／なしのログイン経路
- admin 以外ロールでの「管理」非表示
- 連続 `goto`（login → land → import）でのナビゲーション中断

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST 管理ハンバーガー内の「管理」を、admin セッションで一貫して操作可能なアクセシビリティ契約で公開する
- **FR-002**: System MUST NOT viewer（および admin 以外）に「管理」メニュー項目を出さない（現行権限と同じ）
- **FR-003**: E2E MUST ログイン完了後、着地ページの settle（URL + 安定セレクタ）を待ってから次のナビを行う
- **FR-004**: E2E MUST `/matches`・`/matches/import` への遷移で、準備完了待ちを入れて `ERR_ABORTED` flaky を抑える
- **FR-005**: 変更はヘッダー UI と該当 Playwright／共有ヘルパーに閉じる。deprecate 文言・score-entry 削除・ドキュメント更新は #305 に残す

### Key Entities

- **Header Menu Contract**: ハンバーガー開閉、role／name、「管理」リンクの有無（role 依存）
- **Post-login Landing**: ロール別または全ロール共通の初期 path（develop と #305 で差がある）
- **Navigation Settle**: URL 一致 + 見出し等の可視待ち

---

## Success Criteria *(mandatory)*

- **SC-001**: `test/e2e/ui/admin-navigation.spec.ts` が CI で安定してパスする
- **SC-002**: `test/e2e/ui/match-import.spec.ts` で `goto` 由来の `ERR_ABORTED` flaky が同一 PR の CI で再現しない
- **SC-003**: `npm run build` 成功。無関係リファクタなし
- **SC-004**: #305 / PR #309 が本修正を取り込んだあと、上記 E2E が deprecate 変更と両立する

---

## Assumptions

- 原因の第一候補は (a) `role="menu"` 配下の非 menuitem ノードによる a11y ツリー不整合、(b) ログイン直後の未 settle `goto`
- UI 修正で契約を正すことを優先し、`data-testid` への逃げは最終手段
- #310 は develop 向けに単独マージ可能とする（#305 完了待ちにしない）

## 非スコープ

- #304 の全画面 UX 洗い出し
- #305 のスコア入力 deprecate・専用 E2E 削除・docs／app-spec 更新
- 印刷・成績速度・バックアップ・ページネーションなど他 Issue
- Playwright 全体の大規模共通化リファクタ（必要な最小ヘルパー抽出のみ可）
