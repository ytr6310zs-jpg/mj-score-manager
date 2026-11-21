# Plan: Issue #341

**合意クラス**: C

## Approach

滞在型（`router.refresh()`）を維持したまま、メッセージ表示条件と pending disabled を揃える。役満行編集だけサーバー `FormAction` + 失敗時 void がボトルネックなので、他エンティティと同型のクライアントフォームへ寄せる。

### 成功／失敗表示の共通方針

- 失敗: destructive テキスト（現状どおり）
- 成功: emerald 系テキスト（ログイン画面の成功表示に近い）
- 表示条件: `state.message` があれば `state.success` で色分け（従来の「成功時は隠す」をやめる）
- `aria-live="polite"` をメッセージ要素に付与してよい

### 役満行編集

- 新規: `components/yakuman-edit-form.tsx`（`PlayerEditForm` 相当）
- `app/admin/yakumans/page.tsx` は行ごとに当該コンポーネントを使う
- `editYakumanTypeFormAction` は未使用なら削除、または互換のため残すが UI からは呼ばない
- 成功時 `redirect("/admin/yakumans")` 依存をやめ、`router.refresh()` + 成功メッセージ

### ラベル

- 追加フォーム: 可能なら `Label` + `htmlFor`。横並び維持が難しい場合は各 `Input` に `aria-label`
- 行編集: `aria-label`（「名前」「点数」等）で十分

### Password

- `UserAddForm` / `UserEditForm` の password に `autoComplete="new-password"`

## Files (予定)

| ファイル | 変更 |
|---|---|
| `components/player-add-form.tsx` | エラー表示・disabled・成功表示・a11y |
| `components/yakuman-add-form.tsx` | 同上 |
| `components/tournament-add-form.tsx` | disabled・成功表示・a11y |
| `components/user-add-form.tsx` | 成功表示・autocomplete・a11y |
| `components/player-edit-form.tsx` | 成功表示・a11y |
| `components/tournament-edit-form.tsx` | 成功表示・a11y |
| `components/user-edit-form.tsx` | 成功表示・autocomplete・a11y |
| `components/yakuman-edit-form.tsx` | **新規**（行編集） |
| `app/admin/yakumans/page.tsx` | 行編集をコンポーネント化 |
| `app/yakuman-types-actions.ts` | 未使用 FormAction の整理（任意・最小） |
| `.specify/feature.json` | Spec 参照更新 |

削除成功は G01 滞在型に合わせ、`AdminFeedbackRegion`（一覧上部）へ成功メッセージを出してから `router.refresh()`。失敗はボタン付近のまま。

admin 削除確認は `ConfirmDeleteControl`（行内2段階）で G09 を満たす暫定対応。モーダル Dialog 化は #336 で最終対応（2026-11-22 合意）。

## Risks

- 役満行編集のレイアウト崩れ（複数 Input を1コンポーネントにまとめる必要）
- 成功メッセージが refresh 後も残り続けるのは意図どおり（次操作まで）。クリアしたい場合は別 Issue
