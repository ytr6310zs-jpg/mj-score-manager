---
title: PLAN - スプレッドシート入力による一括インポート
---

概要
--
Google スプレッドシートのテンプレートを起点に、対局入力をまとめて取り込む導線を追加する。テンプレートは 1 試合 1 列の主表と、役満専用テーブルの 2 段構成とし、Web アプリ側では入力内容をプレビューしてから行単位で確定する。

テンプレートの前提は、既存の Google Sheets 連携資産を流用できることを優先し、役満定義は `lib/yakumans.ts` を単一の正とする。役満コードの手入力は廃止し、役満名/コードのプルダウン入力へ統一する。プレーヤー照合は表示名一致を基本とし、曖昧一致候補を提示して誤登録を防ぐ。

実装フェーズ - 実行済み
--
1. テンプレートスキーマの確定 ✓
2. 取り込みパーサーと検証の実装 ✓
   - `parseSpreadsheetMatrix()` で主表と役満テーブルを解析
   - `resolveYakumanToken()` で未知役満を ad-hoc 生成
   - プレーヤー名照合で未登録判定（非ブロッキング）
3. プレビュー付きインポート UI の実装 ✓
   - `match-import-form.tsx` でプレビュー行表示
   - ready 判定で非ブロッキング警告を実装
   - 「取込可能（自動追加あり）」ラベルで UX 明確化
4. 既存入力フローとの併存 ✓
5. テストと検証 ✓
   - unit: `spreadsheet-import.test.js` (9 tests)
   - integration: `match-import.integration.test.js` (3 tests)
   - E2E: `match-import.spec.ts` (6 tests)
   - build/lint: ✓
6. PoC 指標の測定 — 準備完了

自動作成機構
--
### サーバー処理フロー
`confirmMatchImportAction()` の実行順序:
1. `collectImportEntitiesForSelectedRows()` で選択行から未登録プレイヤー名と役満コードを抽出
2. `buildMissingPlayerInsertRows()` で DB に存在しないプレイヤー挿入行を生成
3. Supabase upsert で一括作成（重複時は既存をスキップ）
4. `buildMissingYakumanTypeInsertRows()` で未登録役満の挿入行を生成（属性値: 32000点、空説明、MAX+10順序）
5. Supabase insert で作成
6. 以降、通常通り `saveScoreAction()` を呼び出して試合を登録

### 未知役満の許容性向上
- `resolveYakumanToken()` を拡張し、正規役満定義に存在しない役満でも「名/コード」「コード:名」形式で解析
- ad-hoc 役満コードは `/^[A-Za-z0-9]{2,}$/` で検証し、形式が有効なら自動作成対象に追加
- パース失敗時は警告を記録（「役満が解決できません」）するが、プレビュー表示は継続

### 非ブロッキング警告の UI 表現
- ready 判定: スコア/フラグ/重複の問題のみ false に
- プレイヤー未登録: 警告として記録するが ready に影響しない
- UI: チェックボックス常に有効、スカイブルー警告表示、「取込可能（自動追加あり）」ラベル

検証結果
--
- ビルド: `npm run build` ✓
- テスト: `npm test` ✓ (unit 9, integration 3, e2e 6)
- Lint: `npm run lint` ✓
- 手動確認: プレビュー表示、行選択、確定フロー動作確認 ✓

次ステップ
--
- ドキュメント更新（spec / plan / tasks / worklog / user-manual）
- PoC 測定（操作回数・入力時間の改善率評価）
- 本番デプロイ

リスク管理
--
- Google Sheets 連携に依存すると、共有設定や権限で取り込みに失敗する可能性
  - 対策: エラーハンドリングと明確なエラーメッセージ表示
- 役満テンプレートの維持に失敗するとプルダウン候補と正規定義がずれる可能性
  - 対策: `lib/yakumans.ts` から定義を自動参照
- 重複判定キーの設計が弱いと誤スキップ/二重登録の可能性
  - 対策: `import_dedupe_key` カラムのユニークインデックスで強制
