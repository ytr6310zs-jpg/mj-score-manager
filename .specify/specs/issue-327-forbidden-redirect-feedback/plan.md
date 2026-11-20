# Implementation Plan: Issue #327

**合意クラス**: C

## Technical Approach

1. **middleware.ts**  
   権限不足の 3 箇所を `NextResponse.redirect(new URL("/matches?flash=forbidden", request.url))` に変更。  
   未ログイン → `/login` は触らない。

2. **app/matches/import/page.tsx**  
   `redirect("/matches?flash=forbidden")`（session なし／`!canUseScoreInput`）。  
   ※ session なしは middleware で先に `/login` へ行く想定だが、ページ側ガードも flash 付きに揃える。

3. **components/flash-message.tsx**  
   - `MESSAGES.forbidden = "この操作を行う権限がありません。"`（文言は実装時に微調整可）  
   - `forbidden`（および必要なら既存の失敗系）は成功スタイルと区別（例: 警告色、✓ を使わない、`role="alert"`）  
   - 広範な種別トーンは #330 に残す

4. **検証**  
   - `npm run build`  
   - 手動: viewer で `/admin`・edit・`/`・import、admin で従来アクセス

## 変更予定ファイル

| ファイル | 変更 |
|---|---|
| `middleware.ts` | 権限不足 redirect に `flash=forbidden` |
| `app/matches/import/page.tsx` | 同上 |
| `components/flash-message.tsx` | メッセージ＋最低限の警告スタイル |
| `.specify/specs/issue-327-forbidden-redirect-feedback/*` | Spec |
| `.specify/feature.json` | 本 feature を指す |

## Risks

- middleware 誤変更で許可ロールを壊す → 条件式は現状のまま query のみ追加
- flash が成功色のまま → D5 で最低限区別。全面は #330
- matches に `FlashMessage` があることは確認済み（着地で表示可能）

## 実装フェーズ想定手順

1. worklog 起票  
2. middleware / import redirect  
3. FlashMessage 拡張  
4. build + 手動確認  
5. 明示依頼後に `/pr`
