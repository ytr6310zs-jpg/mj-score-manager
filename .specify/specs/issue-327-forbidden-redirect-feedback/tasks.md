# Tasks: Issue #327

## Phase 0: Spec

- [x] T000 Spec 3 点作成（本ディレクトリ）
- [x] T001 `feature.json` を本 feature へ更新

## Phase 1: Redirect + Flash

- [x] T002 [US1] `middleware.ts` の権限不足 redirect に `flash=forbidden` を付与
- [x] T003 [US1] `app/matches/import/page.tsx` の権限不足 redirect に同 flash を付与
- [x] T004 [US1][US2] `FlashMessage` に `forbidden` 文言と最低限の非成功スタイル

## Phase 2: Verify

- [x] T005 `npm run build`
- [ ] T006 手動: viewer 拒否パス / admin・editor 許可パス（ローカル確認推奨）
- [x] T007 worklog（実装開始時）
