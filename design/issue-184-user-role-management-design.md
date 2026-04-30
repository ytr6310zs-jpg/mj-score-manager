# Issue #184 設計: ユーザー機能・権限管理追加

- Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/184
- 作成日: 2026-04-30
- 作成者: Copilot

## 1. 目的

現行の単一パスワード認証を、ユーザー単位の認証と権限ベース認可へ拡張する。

1. ユーザー管理（CRUD）を追加する。
2. 権限レベル（参照/編集/管理）を追加する。
3. 画面表示とサーバー処理の両方で認可を適用する。
4. スコア作成・更新時に操作ユーザーを記録する。

## 2. 現状整理

1. ログインは environment 変数 ACCESS_PASSWORD と MFA_TOTP_SECRET に依存し、DB の users テーブルは未導入。
2. セッションは署名付き cookie で管理されるが、payload は有効期限と nonce のみでユーザー識別子を含まない。
3. middleware は未認証アクセスを /login へリダイレクトするが、ロール別のアクセス制御は未実装。
4. ハンバーガーメニューは常に 管理 メニューを表示する。
5. games には created_at はあるが、作成者/更新者追跡列はない。

## 3. 要件具体化（Issue #184 とコメント反映）

### 3.1 機能要件

1. users テーブルを追加し、ユーザーID・パスワードハッシュ・表示名・権限IDを管理する。
2. roles テーブルを追加し、管理・編集・参照の3権限を管理する。
3. ログイン画面はユーザーIDとパスワードで認証し、成功時のみ OTP 入力を有効化する。
4. 管理メニュー配下にユーザー管理画面を追加し、基本 CRUD を実装する。
5. ヘッダー（ハンバーガーメニュー）にログインユーザー表示を追加する。
6. スコア入力の新規作成・更新に操作ユーザーを記録する。
7. viewer 権限ではヘッダーの スコア入力 導線を非表示にする。
8. viewer ログイン直後の初期遷移先を 対局履歴画面 にする。

### 3.2 認可要件

1. 参照: 対局履歴・成績集計・印刷のみ閲覧可能。管理画面は非表示かつ遷移不可。
2. 編集: 参照権限に加えて、スコア入力・対局履歴での編集/削除を許可。管理画面は非表示かつ遷移不可。
3. 管理: 編集権限に加えて、管理画面（ユーザー/大会/プレイヤー/役満）操作を許可。

### 3.3 テスト要件（Issue コメント）

1. 権限レベルごとの許可/拒否を自動テストで担保する。
2. UI 非表示だけでなく、Server Action / API での拒否を自動テストで担保する。
3. 未認証アクセスと権限昇格の回帰テストを追加する。
4. npm run build と npm test が成功する。

## 4. スコープ

### 4.1 対象

1. 認証モデルの user based 化（DB + セッション）
2. role based 認可の導入（UI とサーバー境界）
3. 管理画面へのユーザー管理機能追加
4. games への作成/更新ユーザー追跡列追加
5. migration 時の初期データ投入（roles 3件 + 管理ユーザー1件）
6. 自動テスト拡充

### 4.2 非対象

1. 外部 IdP 連携（Google/Microsoft OAuth など）
2. 細粒度権限（画面内ボタン単位の独自ポリシーエンジン）
3. 監査ログ基盤の全面導入（今回は作成/更新ユーザー列まで）

## 5. 設計方針

### 5.1 データモデル

追加テーブル: roles

1. id BIGSERIAL PRIMARY KEY
2. code TEXT NOT NULL UNIQUE
3. name TEXT NOT NULL UNIQUE
4. created_at TIMESTAMPTZ NOT NULL DEFAULT now()

code の候補:

1. viewer
2. editor
3. admin

追加テーブル: users

1. id BIGSERIAL PRIMARY KEY
2. user_id TEXT NOT NULL UNIQUE
3. password_hash TEXT NOT NULL
4. display_name TEXT NOT NULL
5. role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT
6. is_active BOOLEAN NOT NULL DEFAULT TRUE
7. created_at TIMESTAMPTZ NOT NULL DEFAULT now()
8. updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

games 追加列:

1. created_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL
2. updated_by_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL
3. updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

注意:

1. Issue 本文の パスワード は平文保存を想定しうる記述だが、実装は password_hash で保存する。
2. 既存データ互換のため created_by_user_id は初期時点で NULL 許容にする。

### 5.2 認証方式

採用: 実績ある既存ライブラリを優先し、トークン署名とパスワード検証を標準化する。

ライブラリ方針:

1. トークン署名/検証は jose を利用する（独自HMAC実装の置き換え）。
2. パスワード hash は bcryptjs または @node-rs/bcrypt を利用する。
3. OTP は既存採用の otplib を継続利用する。

セッション保持方式:

1. cookie ベースは維持しつつ、署名とpayload検証はライブラリに委譲する。

payload 追加項目:

1. uid: users.id
2. role: roles.code
3. ver: token version（将来の強制ログアウト制御余地）

ログインフロー:

1. ユーザーID/パスワードを照合
2. 成功時に OTP 入力を有効化（失敗時は OTP 検証しない）
3. OTP 成功でセッショントークン発行

実装メモ:

1. password_hash は bcrypt 系で比較する。
2. 既存の試行回数制限 cookie は継続利用する。
3. 既存の手作りトークンは段階的に廃止し、jose 検証へ移行する。

### 5.3 認可方式

採用: ミドルウェア + サーバー境界の二重防御。

1. middleware: 未認証拒否 + /admin 配下の role=admin 制御。
2. Server Actions / API: 各操作で requireRole を実行し、UI 経由以外のアクセスも拒否。
3. UI: 非許可メニュー非表示は補助策として実装。

権限マッピング:

1. viewer: read pages only
2. editor: viewer + score create/update/delete
3. admin: editor + admin pages CRUD

初期遷移ポリシー:

1. viewer ログイン成功時は /matches へ遷移する。
2. editor/admin ログイン成功時は / へ遷移する。

### 5.4 ユーザー管理 UI

新規ページ候補:

1. app/admin/users/page.tsx

新規コンポーネント候補:

1. components/user-add-form.tsx
2. components/user-edit-form.tsx
3. components/user-delete-button.tsx

要件:

1. user_id は重複不可
2. パスワード更新は再ハッシュして保存
3. 自分自身の最終管理者ロール剥奪は禁止（運用ロックアウト防止）

### 5.5 ヘッダー表示

1. ログイン中ユーザー表示（display_name と role）をハンバーガーメニュー上部へ追加。
2. admin 以外は 管理 メニューを表示しない。
3. viewer では スコア入力 導線を表示しない。
4. editor/admin では現行どおり スコア入力 導線を表示する。
5. 直接 URL 叩きは middleware / サーバー側で拒否する。

### 5.6 スコア入力・更新のユーザー記録

1. saveScoreAction で created_by_user_id を設定する。
2. match update action で updated_by_user_id と updated_at を更新する。
3. 既存データには migration で管理ユーザーIDを一括 backfill するか、NULL 維持のどちらかを選択する。
4. 今回は安全側として 既存レコードは NULL 維持 を採用し、移行リスクを下げる。

## 6. マイグレーション設計

想定 migration:

1. create_roles.sql
2. create_users.sql
3. games_add_audit_user_columns.sql
4. seed_roles_and_admin_user.sql

投入データ:

1. roles: admin, editor, viewer を3件投入
2. users: 管理ユーザーを1件投入（初期パスワードは hash のみ保存）

初期管理ユーザーの平文パスワード方針:

1. migration 内へ固定平文を埋め込まない。
2. 初期投入は scripts または運用手順で hash を生成して適用する。

## 7. テスト設計

### 7.1 Unit

1. ロール判定ヘルパー（viewer/editor/admin の許可行列）
2. セッショントークン payload 生成/検証（uid/role を含む）
3. パスワード hash 比較と異常系

### 7.2 Integration

1. Server Action の requireRole で editor/viewer が管理操作を拒否される。
2. 未認証状態で更新 action を拒否する。
3. games 更新時に updated_by_user_id が記録される。

### 7.3 E2E

1. viewer でログイン時、スコア入力導線と管理メニューが非表示、かつ初期遷移先が /matches になる。
2. editor でスコア入力は可能、管理画面遷移は拒否。
3. admin でユーザー CRUD が可能。
4. 権限昇格を伴う不正リクエスト（UI 改ざん想定）をサーバー側で拒否。

## 8. 実装対象ファイル（想定）

1. 追加: supabase/migrations/XXXXXXXXXXXXXX_create_roles.sql
2. 追加: supabase/migrations/XXXXXXXXXXXXXX_create_users.sql
3. 追加: supabase/migrations/XXXXXXXXXXXXXX_games_add_audit_user_columns.sql
4. 追加: supabase/migrations/XXXXXXXXXXXXXX_seed_roles_and_admin_user.sql
5. 変更: lib/auth.ts
6. 追加: lib/authorization.ts
7. 追加: lib/users.ts
8. 変更: middleware.ts
9. 変更: app/login/actions.ts
10. 変更: app/login/login-form.tsx
11. 変更: components/app-header.tsx
12. 追加: app/admin/users/page.tsx
13. 追加: components/user-add-form.tsx
14. 追加: components/user-edit-form.tsx
15. 追加: components/user-delete-button.tsx
16. 変更: app/actions.ts
17. 変更: app/match-actions.ts
18. 追加または変更: test/ 以下の auth / authorization / e2e テスト

## 9. リスクと対策

1. リスク: 認可漏れにより権限外操作が可能になる。
   対策: サーバー境界に requireRole を導入し、E2E だけでなく integration で拒否を検証する。
2. リスク: 初期管理ユーザー投入時のパスワード運用ミス。
   対策: 平文保存禁止を設計で固定し、手順を docs に明記する。
3. リスク: 既存 cookie との互換でログイン不能が発生。
   対策: payload version を追加し、旧形式 token は明示失効させ再ログイン導線を出す。
4. リスク: 最終管理者を削除して運用不能になる。
   対策: users 更新/削除 action で最終 admin 保護チェックを追加する。

## 10. 受け入れ基準（設計時点）

1. users/roles テーブルと初期データが migration で作成される。
2. 参照/編集/管理の各権限で UI とサーバーの許可/拒否が一致する。
3. viewer の初期遷移先が /matches になり、スコア入力導線が表示されない。
4. 未認証アクセスが遮断される。
5. スコア作成/更新でユーザー追跡列が記録される。
6. npm run build と npm test が成功する。

## 11. 実装ステップ（提案）

1. migration で roles/users と games 追跡列を追加する。
2. lib/auth と loginAction を user based 認証へ置換する。
3. middleware と server actions に role 検証を追加する。
4. ヘッダーと管理メニューの表示制御を追加する。
5. 管理画面 users CRUD を追加する。
6. スコア作成/更新の操作ユーザー記録を追加する。
7. unit/integration/e2e を追加して build/test を通す。

## 12. 自己レビュー（設計整合性チェック）

1. Issue 本文の要求（ユーザー管理、権限3段階、ヘッダー表示、作成更新ユーザー記録）をすべて反映済み。
2. Issue コメントの受け入れ基準（サーバー側認可テスト、未認証回帰、build/test 成功）を反映済み。
3. 追加コメントの要求（viewer のスコア入力導線非表示、viewer 初期遷移先 /matches、信頼ライブラリ活用）を反映済み。
4. パスワード平文保存リスクを回避するため、Issue 文言の パスワード を password_hash として具体化した。
5. 認可は UI 制御のみでなく server boundary で拒否する方針にしており、セキュリティ要求と整合する。
6. 実装規模が大きいため、実装フェーズでは migration -> auth -> authorization -> UI -> tests の順に段階的に進める必要がある。
