---
title: Feature Specification: スプレッドシート入力による一括インポート
owner: @you
created: 2026-05-11
status: Implemented
issue: #183
feature_branch: feature/issue-183-spreadsheet-import
priority: P1
deadline: 2026-05-31
---

背景
--
現行案の「1試合4列（SCORE/YAKUMAN/YAKITORI/TOBI_TOBASHI）」は横長になり、試合一覧の視認性が低下する。#183 では、1試合1列を基本とするテンプレートへ変更し、Web アプリ側で一括インポートする方式を PoC として検証する。

ユーザー要望としては、役満コードの手入力をなくし、役満名/コードのプルダウンで選択できること、飛ばし/飛びフラグの表記ゆれを許容しつつ検証で補正できること、既存フォームは残したまま併存できること、モバイル利用時もインポート確認がしやすいことが重要。

目的
--
- 対局記録の一覧性を上げるため、入力テンプレートを 1 試合 1 列にする
- 役満情報をプルダウンで標準化し、コード手入力を不要にする
- 事前プレビューを挟んだ安全な一括インポートを実現する
- 既存フォームと併存できる入力手段を追加する

受け入れ条件
--
- テンプレートの主表は 1 試合 1 列である
- 試合セルは符号付き整数スコアを必須とし、`Y`/`T`/`TB` フラグを任意で併記できる
- フラグ区切りは `,` `，` `、` `/` `／` `;` `；` を許容し、大文字小文字を区別しない
- テンプレートに役満テーブルが含まれ、`yakuman` 列で役満名/コードプルダウンを選択できる
- 役満テーブルは初期 20 行を持ち、運用で可変追加できる
- テンプレートはコピー可能で、コピー後も入力用の書式が維持される
- スコア、焼き鳥、飛ばし、飛びを試合セルに記入できる
- 役満情報は `gameNo` 単位で別テーブルに記入できる
- 一括インポート前にプレビューを表示し、行単位で取り込み可否を選択できる
- プレーヤー名の照合は表示名一致を基本とし、曖昧一致候補を提示できる
- `T` と `TB` の同時指定は警告し、プレビューで修正できる
- 同一 `gameNo + player + yakuman` の重複は `count` 集約する
- 既存入力フォームは残し、追加入力方式として併存できる
- モバイル幅でもインポート確認と確定操作が破綻しない
- **未登録プレイヤーは自動作成される**（スプレッドシートから抽出した名前を採用）
- **未知役満は「名/コード」形式で自動作成される**（点数: 32000、説明: 空、並び順: MAX+10、状態: 有効）
- **プレーヤー未登録警告は非ブロッキング**（プレビューで「取込可能（自動追加あり）」と表示、行を選択可能）
- **重複取り込みは自動排除**（`import_dedupe_key` カラムのユニーク制約で DB レベルで防止）

実装概要
--
### 自動作成メカニズム

#### プレイヤー自動作成フロー
1. `previewMatchImportAction()` で Google スプレッドシートを読み込み、主表から全プレイヤー名を抽出
2. DB に存在しないプレイヤー名を「未登録」と判定、プレビュー行の issue として記録（非ブロッキング）
3. ユーザーが「取り込み可能（自動追加あり）」の行を選択して確定
4. `confirmMatchImportAction()` で `collectImportEntitiesForSelectedRows()` を呼び出し、未登録プレイヤー名の集合を取得
5. `buildMissingPlayerInsertRows()` で DB への挿入行を生成、`upsert` で一括作成

#### 役満自動作成フロー
1. `parseSpreadsheetMatrix()` で役満テーブルを解析
2. `resolveYakumanToken()` で以下の順序で照合:
   - 完全一致（コード一致）
   - スラッシュ分割形式（「役満名 / コード」→ コード抽出）
   - コロン形式（「コード:役満名」→ コード抽出）
   - **ad-hoc 役満**（2文字以上の英数字コード且つ有効な名/コード形式なら自動生成）
   - 名前部分一致
3. ad-hoc 役満は `buildAdhocYakumanDef()` で YakumanDef オブジェクトを生成
4. 確定時に `buildMissingYakumanTypeInsertRows()` で DB 挿入行を生成

**属性値**（自動作成時）:
- 役満コード: スプレッドシート抽出値（形式検証済み）
- 役満名: スプレッドシート抽出値
- 点数: 32000
- 説明: （空文字列）
- 並び順: MAX(sort_order) + 10
- 状態: 有効（is_active=true）

### 非ブロッキング警告
- **スコア/フラグ/重複**: ブロッキング（ready=false、チェックボックス無効）
- **プレイヤー未登録**: 非ブロッキング（ready=true、警告表示、自動作成ラベル付き）
- UI 表示: スカイブルー（sky-800）で警告を色分け

### 重複排除ポリシー
- **重複判定キー**: `tournament + gameDate + gameNo + sorted(playerNames)`
- **DB レベル**: `import_dedupe_key` カラムに判定キーを格納、部分ユニークインデックスで重複を防止
- **二重登録防止**: DB 制約により、同一対局の重複インポートは自動スキップ

テスト
--
- **Unit Tests**: `test/spreadsheet-import.test.js` (9 tests) — セルパース、フラグゆれ、T/TB 競合、役満集約、未知役満解析
- **Integration Tests**: `test/match-import.integration.test.js` (3 tests) — entity sync helpers 検証
- **Server Action Tests**: Google Sheets API エラーハンドリング、権限制御
- **E2E Tests**: `test/e2e/ui/match-import.spec.ts` (6 tests) — Playwright によるプレビュー・確定フロー検証
- **Build & Lint**: `npm run build` ✓、`npm run lint` ✓

参考
--
- `lib/yakumans.ts`
- `lib/spreadsheet-import.ts`
- `lib/import-entity-sync.ts`
- `app/match-import-actions.ts`
- `components/match-import-form.tsx`
