# Plan: Issue #339

**合意クラス**: B

- `app/not-found.tsx`（Server Component）: 404 文言 + `Link` → `/matches`
- `app/error.tsx`（Client Component）: `error` / `reset` props、再試行ボタン + `Link` → `/matches`
- 既存 `Alert` / `buttonVariants` を再利用。AppHeader は付けない（session 取得を増やさない）
- `feature.json` を本 Spec に更新
