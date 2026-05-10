# Issue #121 補完 実装タスク

**Branch**: `fix/compatibility-minGames-select-sync`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Issue**: #121 補完  

---

## タスク一覧

### フェーズ 1: 準備

- [ ] **T-1** ブランチを作成: `git checkout -b fix/compatibility-minGames-select-sync develop`
- [ ] **T-2** 現在の `app/compatibility/page.tsx` をバックアップ（確認用）

### フェーズ 2: 実装

- [ ] **T-3** `app/compatibility/page.tsx` の 151 行目付近の `initialMinGames` 計算を修正
  - 成績集計ページ（`app/stats/page.tsx`）の実装に倣う
  ```typescript
  // Before:
  initialMinGames={effectiveMinGames !== undefined ? String(effectiveMinGames) : undefined}
  
  // After:
  initialMinGames={
    initialMinGamesRaw !== undefined
      ? initialMinGamesRaw
      : filter === "year"
        ? "20"
        : ""
  }
  ```
  - `initialMinGamesRaw` は既に取得済み（75 行目: `Array.isArray(params?.minGames) ? params?.minGames[0] : params?.minGames`）
- [ ] **T-4** ビルド確認: `npm run build`
- [ ] **T-5** TypeScript エラーがないことを確認

### フェーズ 3: テスト

- [ ] **T-6** **シナリオ 1: 「条件なし」を選択（修正の主要バグ）**
  - ブラウザで相性表ページを開く（初期状態「今年」フィルタ）
  - 試合数セレクトを「条件なし」に変更
  - 確認: テーブルが「条件なし」で更新される
  - 確認: セレクトが「条件なし」のままになった ← **修正前はバグで「20試合以上」に戻っていた**
  - F5 リロードして、再度セレクトが「条件なし」か確認

- [ ] **T-7** **シナリオ 2: 「20試合以上」に変更**
  - シナリオ 1 の状態から、セレクトを「20試合以上」に変更
  - 確認: セレクトが「20試合以上」か、テーブルがフィルタされるか
  - F5 リロード後も「20試合以上」か確認

- [ ] **T-8** **シナリオ 3: デフォルト状態**
  - URL から `minGames` パラメータを削除: `/compatibility?filter=year`
  - ページを開く
  - 確認: セレクトが自動的に「20試合以上」か？

- [ ] **T-9** **Lint チェック**: `npm run lint`
- [ ] **T-10** **テスト実行**: `npm test` (該当テストがあれば)

### フェーズ 4: コミット & Push

- [ ] **T-11** 変更内容を確認: `git diff`
- [ ] **T-12** worklog 起票: 
  ```bash
  npm run worklog:start -- \
    --summary "Issue #121 補完 相性表試合数フィルタ同期バグ修正" \
    --reason "相性表で試合数『条件なし』選択時、セレクト表示が『20試合以上』のままになるバグを修正" \
    --tags "issue-121,bug-fix,compatibility-matrix"
  ```
- [ ] **T-13** コミット:
  ```bash
  git add app/compatibility/page.tsx
  git commit -m "fix: 相性表の試合数フィルタセレクト同期バグ修正 (#121補完)

  - 「試合数：条件なし」を選択時、セレクト表示が正しく反映されない問題を修正
  - page.tsx の initialMinGames 計算で、URL パラメータの有無を判定
  - 空文字パラメータを DateRangeFilter に明示的に渡すことで同期を確保"
  ```

- [ ] **T-14** Push: `git push origin fix/compatibility-minGames-select-sync`

### フェーズ 5: PR 作成 & 確認

- [ ] **T-15** PR 作成:
  ```bash
  gh pr create \
    --base develop \
    --head fix/compatibility-minGames-select-sync \
    --title "fix: 相性表の試合数フィルタセレクト同期バグ修正" \
    --body "PR の内容は下記参照..."
  ```

- [ ] **T-16** PR 本文に以下を記載:
  - **設計概要**: spec.md を参照（根本原因と修正方針）
  - **実装概要**: 1 行修正（initialMinGames の条件分岐）
  - **実行検証**:
    - `npm run build` ✓
    - `npm run lint` ✓
    - (テスト結果)
  - **手動動作確認**:
    - シナリオ 1: 「条件なし」選択時、セレクト表示が同期 ✓
    - シナリオ 2: 「20試合以上」選択時の動作確認 ✓
    - シナリオ 3: URL パラメータなし時のデフォルト挙動 ✓

- [ ] **T-17** レビュー・マージ待機

---

## 実装検証チェックリスト

- [ ] ビルド成功: `npm run build`
- [ ] Lint 成功: `npm run lint` (エラーなし)
- [ ] 手動テスト全シナリオ合格
- [ ] PR 本文に検証結果を記載
- [ ] コミットメッセージが明確

---

## トラブルシューティング

### シナリオが失敗した場合
1. デバッグ: ブラウザの DevTools で URL パラメータを確認
2. `hasMinGamesParam` の判定が正しいか確認
3. `DateRangeFilter` の初期値ロジックを再確認

### ビルドエラーが出た場合
1. `npm run build` の出力を確認
2. 型エラーであれば、`effectiveMinGames` の型定義を確認

---
