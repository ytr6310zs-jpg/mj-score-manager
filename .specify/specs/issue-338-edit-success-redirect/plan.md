# Plan: Issue #338

**合意クラス**: B

- `match-edit-form.tsx`: `state.message` は `!state.success` のときのみ表示
- 成功時 `router.push("/matches?flash=updated")` は維持
- action の success message 文字列は変更不要（フォームで出さないだけ）
