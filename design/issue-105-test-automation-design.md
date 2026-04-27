# Issue #105 設計: E2E / Unit テスト基盤の拡充

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/105
- タイトル: E2E, Unitテストの追加
- 作成日: 2026-04-27
- 作成者: Copilot
- 目的: システム改修時の回帰を自動検知できるように、既存の `node:test` 基盤を拡張し、Unit/E2E の対象範囲・実行方法・カバレッジ可視化を定義する。

## 1. 背景

Issue #105 では、次の要求が明示されている。

1. Unit テストでドメインロジックの主要分岐をカバーする。
2. E2E テストで主要ユーザーフロー（入力 -> 保存 -> 一覧/集計反映）を最低 1 本以上自動化する。
3. 失敗時に原因箇所を特定しやすいログ/アサーションメッセージを整備する。
4. `npm run build` の成功を維持する。
5. `npm test` を CI で安定実行できる状態にする。
6. 追加要件として test coverage レポートを出力する。

また、本 Issue は #185 / #184 着手前の優先タスク（P0）として位置付けられている。

## 2. 現状整理

現時点でも `test/` 配下に以下の自動テストがある。

1. Unit/ロジック系: `stats-ranking`, `stats-subtables`, `metric-ranks`, `validate-match` など。
2. integration-like/E2E-like 系: `games-export.e2e.test.js`, `stats-export.e2e.test.js` など。
3. CI: `.github/workflows/ci.yml` で `npm test` -> `npm run build` -> `npm run lint` を実行している。

課題:

1. 主要ユーザーフロー（画面入力 -> 保存 -> 閲覧反映）の E2E が未整備。
2. テスト対象の優先順位と責務境界（Unit と E2E の分担）が明文化されていない。
3. カバレッジの定点観測がなく、回帰検知の定量指標が不足している。

## 3. 目標

## 3.1 完了状態

1. Unit テスト対象を「ドメインロジック」「変換」「バリデーション」に集中させる。
2. E2E テスト対象を「主要ユーザーフロー」に限定して安定化させる。
3. テスト実行時に coverage レポートを生成し、CI アーティファクトで確認可能にする。
4. 失敗時に原因追跡しやすいアサーションメッセージとログ出力方針を統一する。

## 3.2 非目標

1. 全画面・全分岐の 100% カバレッジ達成。
2. 既存全テストの一括リライト。
3. 大規模なテストフレームワーク刷新。

## 4. テスト戦略

## 4.1 レイヤー分担

1. Unit テスト:
   - 対象: `lib/` の純粋関数、バリデーション、集計、CSV 変換ヘルパー。
   - 目的: 仕様の境界値、分岐、異常系を高速に検証。
2. E2E テスト:
   - 対象: ユーザー操作で価値が高い最小フロー。
   - 目的: 画面/Server Action/DB 連携を通した回帰検知。
3. Integration-like テスト（既存維持）:
   - 対象: API handler など I/O 境界。
   - 目的: 形式（ヘッダー、CSV）や組み立て結果の検証。

## 4.2 優先テストシナリオ

### Unit（優先順）

1. 対局入力バリデーション（3p/4p、スコア整合、役満関連の制約）。
2. 成績集計ロジック（順位計算、同率順位、率計算、試合数フィルタ）。
3. フィルタ変換ロジック（年/期間/日付指定、minGames、大会条件）。
4. CSV 生成ロジック（列順、ヘッダー、エスケープ、日付範囲反映）。

### E2E（最低 1 本、推奨 2 本）

1. 主要フロー A:
   - 入力画面で対局登録
   - 対局履歴に反映される
   - 成績集計に反映される
2. 主要フロー B（推奨）:
   - フィルタ条件を変更
   - CSV/PDF 出力条件に引き継がれる

## 5. 実行基盤設計

## 5.1 テストランナー

既存の `node:test` を継続利用する。理由:

1. 既存資産との互換性が高く、移行コストが低い。
2. CI で既に安定運用されている。
3. Issue #105 の目的は「自動回帰検知の強化」であり、ランナー刷新は必須ではない。

## 5.2 カバレッジ出力

`c8` を導入し、`npm test` とは別に coverage 取得用スクリプトを追加する。

想定スクリプト:

1. `npm run test:unit`（Unit 群）
2. `npm run test:e2e`（E2E 群）
3. `npm run test:coverage`（`c8` でレポート生成）

レポート形式:

1. text-summary（CI ログで即時確認）
2. lcov（詳細閲覧/外部連携用）

出力先:

1. `coverage/` ディレクトリ（CI アーティファクト対象）

## 5.3 CI 組み込み

`ci.yml` の `build-and-test` ジョブに以下を追加する。

1. `npm run test:coverage` 実行。
2. `coverage/` を artifact として保存。
3. 必須順序は `test(coverage) -> build -> lint` を維持。

`migrate-and-test` は統合テストの安定運用を優先し、必要最小限の変更に留める。

## 5.4 ブラウザ E2E テスト（Playwright）

スコア入力画面の UI 操作を自動化し、実ブラウザでのエンドツーエンド検証を実施する。

### フレームワーク

- **Playwright** を使用（理由: Next.js との親和性、CI 統合容易性、headless/headed 両対応）

### テスト対象

1. スコア入力画面（メイン画面）
   - フォーム入力（プレイヤー名、スコア、日付、大会選択）
   - 3p・4p ゲーム切り替え
   - 送信処理と成功通知
   - Supabase DB への実際の保存を検証

### スクリプト・実行

- `npm run test:ui` — Playwright テスト実行
- `npm run test:ui:debug` — デバッグモード（ブラウザ表示）

### CI 統合

`migrate-and-test` ジョブ内で以下順序で実行:

1. `npm install` → Playwright ブラウザインストール
2. `npm test` → Node.js テスト（DB-backed E2E を含む）
3. `npm run build` → Next.js ビルド
4. `npm run test:ui` → Playwright ブラウザ E2E テスト
5. HTML レポート保存 → CI アーティファクト

### 考慮事項

- **環境変数**: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` を設定し、Supabase local と連携
- **フレーク対策**: 各ステップで適切な待機・タイムアウト設定
- **セレクタ安定性**: フォーム要素の id・name 属性を明示的に指定（placeholder や position 依存を避ける）
- **クリーンアップ**: テスト実行後、テストデータを DB から削除

## 5.5 テスト実行フロー（ローカル）

```bash
# Supabase 起動
npm run supabase:start

# 別ターミナルで dev サーバー起動
npm run dev:local

# テスト実行
npm test                   # Node.js 群（Unit/Integration/E2E）
npm run test:coverage      # カバレッジ付き実行
npm run test:ui            # Playwright ブラウザ E2E

# デバッグ
npm run test:ui:debug      # Playwright デバッグモード
```

## 5.6 テスト実行フロー（CI）

CI ワークフロー `migrate-and-test` ジョブが以下を自動実行:

1. Supabase local 起動
2. DB マイグレーション
3. Node.js テスト（coverage 含む）
4. Next.js ビルド
5. Playwright E2E テスト
6. アーティファクト保存（coverage, Playwright HTML report）

## 6. 実装対象（計画）

1. `package.json`
   - テストスクリプトの分割（unit/e2e/coverage）。
   - `c8` の導入。
   - Playwright テストスクリプト追加（`test:ui`, `test:ui:debug`）。
2. `playwright.config.ts`（新規）
   - Playwright フレームワーク設定
   - Next.js dev サーバー自動起動
   - Chrome headless 設定
3. `test/`
   - Unit 強化テストの追加。
   - DB 連携 E2E テストの追加（`test/*.db.e2e.test.cjs`）。
   - ブラウザ E2E テストの追加（`test/e2e/ui/*.spec.ts`）。
   - 失敗時メッセージの改善。
4. `.github/workflows/ci.yml`
   - coverage 実行と artifact 保存。
   - migrate-and-test ジョブに Playwright テスト追加。
   - Playwright ブラウザインストールと HTML レポート保存。
5. `design/issue-105-test-automation-design.md`
   - テスト戦略と実装計画の明文化。
   - Playwright ブラウザ E2E の設計。
6. `README.md`（必要に応じて）
   - ローカル実行手順に coverage・Playwright コマンドを追記。

## 7. 受け入れ基準

1. Unit テストで主要分岐がカバーされている（対象ファイルを PR で明示）。
2. DB 連携 E2E テストが「入力 -> 保存 -> DB 反映」を検証（最低 1 本）。
3. ブラウザ E2E テスト（Playwright）がスコア入力画面を自動化（3p・4p 両シナリオ）。
4. 失敗時のメッセージから対象機能と期待値が判断できる。
5. `npm run build` が成功する。
6. `npm test` が CI 上で安定して成功する。
7. `npm run test:ui` が CI 上で安定して実行される（DB-backed環境）。
8. `coverage/` レポートが CI で確認できる。
9. Playwright HTML レポートが CI で確認できる。

## 8. リスクと対策

1. E2E の不安定化（日時・DB状態依存）
   - 対策: fixture の固定化、テストデータの初期化、時刻依存の排除。
2. テスト実行時間の増加
   - 対策: Unit/E2E をスクリプト分離し、PR では最小セット、必要時に拡張実行。
3. カバレッジ偏重で価値の低いテストが増える
   - 対策: 数値目標のみでなく、重要フロー基準で追加する。

## 9. 実施ステップ

1. 現行テストを Unit/E2E/Integration-like に分類し、命名規約を統一する。
2. 優先 Unit シナリオ（バリデーション/集計/変換）を追加する。
3. 主要ユーザーフロー E2E（入力 -> 保存 -> 一覧/集計）を実装する。
4. `c8` による coverage 出力を追加する。
5. CI に coverage 実行と artifact 保存を組み込む。
6. `npm test` / `npm run build` を確認し、安定性を検証する。

## 10. MODULE_TYPELESS_PACKAGE_JSON 警告への対応方針

テスト実行時に複数の `.cjs` / `.js` テストファイルが異なるモジュール解析ルールで読み込まれるため、Node.js が「タイプレスなパッケージから import/require されている」という警告を出す場合がある。

### 現状

- `package.json` で `"type": "commonjs"` が明示的に指定されていない（暗黙的に CommonJS）
- テストファイル（`.cjs`, `.js`, `.test.mjs`）が混在している
- ts-node での TS ファイルの読み込みが動的 import で行われている

### 対応案（優先順）

1. **短期（現在）**: 警告は許容する。機能・テスト成功に影響なし。
   - CI では warning として認識するが、エラーにはならない。

2. **中期（Issue 化検討）**: `package.json` に `"type": "commonjs"` を明示的に追加。
   - 現在は暗黙的に commonjs だが、明示することで警告を軽減する可能性。
   - ただし既存 ESM imports（例：`@supabase/supabase-js`）との共存を考慮する必要。

3. **長期**: テストモジュールシステム全体を整理（別 Issue）
   - `.test.mjs`（ESM）と `.test.cjs`（CommonJS）を明確に分離
   - または、全テストを ts-node + TypeScript で統一
   - ただし、実装複度とメンテナンス負荷を考慮すると優先度は低い。

### 推奨アクション

現在の Issue #105 では対応を見送り、以下の理由から別 Issue 化を提案：

1. **テスト機能への影響がない**: 警告であり、テスト自体は正常に実行される。
2. **プロジェクト全体の module 戦略との整合が必要**: 単なる warning 抑制ではなく、プロジェクト全体での ESM/CommonJS の方針が必要。
3. **リスク・改修範囲が大きい**: package.json の type 追加は既存 import/require に影響を与える可能性がある。

### 別 Issue 案

- タイトル: `Resolve MODULE_TYPELESS_PACKAGE_JSON warnings in test suite`
- 内容: 
  - package.json の `"type"` フィールドを検証・明示化
  - テストモジュール戦略を統一（ESM vs CommonJS）
  - 既存ソースコードとの互換性確認
- 優先度: 低（P2 or lower）

## 11. Definition of Done

1. Issue #105 の受け入れ基準を満たすテスト構成がコード化されている。
2. CI で build/test/coverage が実行され、結果が追跡可能である。
3. 次タスク（#185 / #184）で回帰検知基盤として再利用できる。
4. DB 連携 E2E テストが追加され、実DB環境での反映確認が自動化されている。
5. ブラウザ E2E テスト（Playwright）がスコア入力画面を自動化している。
   - 3p・4p 両シナリオをカバー
   - フォーム入力→送信→DB 確認の完全フローが検証される
   - CI で実行され、HTML レポートが保存される
6. MODULE_TYPELESS_PACKAGE_JSON 警告について対応方針が明文化されている。
