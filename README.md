# mj-score-manager

Next.js (App Router) + TypeScript で作成した麻雀成績入力アプリです。

## 機能

- Middleware による共通パスワード認証
- 3人打ち / 4人打ちの切り替え
- 対局日・プレイヤー・最終スコア・飛び / 飛ばし / 焼き鳥 / メモの入力
- 送信前バリデーション（最終スコア合計は 0、四捨五入誤差として ±1 まで許容）
- Server Action 経由で Google Spreadsheet に1行追加

## セットアップ

1. Node.js 20 以上をインストール
2. 依存関係をインストール

```bash
npm install
```

3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して以下を設定してください。

- `ACCESS_PASSWORD`
- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_SHEET_TITLE`（任意。未指定時は先頭シート）
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`（`\\n` を含む1行文字列）

4. 開発サーバー起動

```bash
npm run dev
```

## Google Sheets 側の準備

- サービスアカウントにスプレッドシートの編集権限を付与
- 追記先シートに以下ヘッダーを用意
  - `date`, `gameType`, `playerCount`, `player1`, `score1`, `rank1`, `isTobi1`, `isTobashi1`, `isYakitori1`
  - `player2`, `score2`, `rank2`, `isTobi2`, `isTobashi2`, `isYakitori2`
  - `player3`, `score3`, `rank3`, `isTobi3`, `isTobashi3`, `isYakitori3`
  - `player4`, `score4`, `rank4`, `isTobi4`, `isTobashi4`, `isYakitori4`
  - `scoreTotal`, `topPlayer`, `lastPlayer`, `tobiPlayer`, `tobashiPlayer`, `yakitoriPlayers`, `notes`, `createdAt`

## 現在の入力ルール

- 3人打ち / 4人打ちの半荘を記録できます
- 25,000点持ち / 30,000点返し、ウマなし前提の最終スコアを入力します
- 飛びと飛ばしは別途記録します
- 焼き鳥は該当者にチェックを付けます
- 将来の個人成績集計に使えるよう、順位や各種フラグもシートへ保存します

## TODO

- [x] 各ページの遷移ボタン追加
- [x] 対局履歴の編集・削除機能
- [x] 得点を2か所入力したら残りの1か所は自動入力(3人の合計得点が0になるため)
- [x] 同じユーザーが選択されている場合はエラーを表示(エラーを捕捉しメッセージを表示したい)
- [x] 削除時に画面のがくつきが気になる
- [ ] スマホ対応
- [ ] 対局履歴画面に日付によるフィルタを実装（開始日-終了日を指定）
- [ ] 