# アプリ機能仕様

**プロジェクト**: mj-score-manager  
**目的**: 手書きの麻雀スコア表（画像）から、アプリ投入用の正確なマスターデータを抽出・管理する。

> 開発・運用ルール（Git操作・コミット・セキュリティポリシー等）は `.github/agent-instructions.md` および `.cursor/rules/` を参照。

---

## 対応ゲームモード

- 四人打ち (`game_type = '4p'`)
- 三人打ち (`game_type = '3p'`)

---

## 画面構成

| パス | 機能 | 認証 |
|---|---|---|
| `/` | 対局スコア入力（**deprecate・動作保証外**。推奨は一括取り込み） | 不要 |
| `/matches` | 対局履歴一覧・フィルタ・CSV出力 | 不要 |
| `/stats` | 統計・ランキング・PDF出力 | 不要 |
| `/login` | ログイン（Supabase Auth） | - |
| `/admin` | 管理メニュー | 要認証 |
| `/admin/players` | プレイヤー管理（追加・編集・削除） | 要認証 |
| `/admin/tournaments` | トーナメント管理（追加・編集・削除） | 要認証 |
| `/admin/yakumans` | 役満種別管理（追加・編集・有効/無効切替） | 要認証 |

---

## 主要機能

### スコア入力（`/`）— deprecate
- **方針（Issue #305）:** 残置するが積極メンテナンス・動作保証の対象外。専用 E2E なし。新規登録の推奨はスプレッドシート → `/matches/import`
- プレイヤー選択（最大4名）
- 得点・順位・飛び・飛ばし・焼き鳥フラグの入力
- 役満発生の記録（役満種別選択）
- トーナメント紐づけ（任意）
- フォーム送信で `games` テーブルへ保存（`saveScoreAction` は一括取り込みからも利用）
- 画面内に非推奨・非保証・一括取り込みへの案内を表示する
- ログイン成功後の初期画面は `/matches`（全ロール）

### 対局履歴（`/matches`）
- 全対局の一覧表示（日付降順）
- 日付範囲フィルタ・トーナメントフィルタ
- 各対局の編集・削除
- CSV エクスポート（`/api/export/matches`）

### 統計・ランキング（`/stats`）
- 各プレイヤーの通算成績（平均順位・平均点・1位率・飛び率 等）
- 期間・トーナメントによるフィルタ
- 役満ランキング
- PDF 出力（印刷用ビュー）
- CSV エクスポート（`/api/export/stats`）

### プレイヤー管理（`/admin/players`）
- プレイヤーの追加・名称編集・削除

### トーナメント管理（`/admin/tournaments`）
- トーナメントの追加・名称編集・削除

### 役満管理（`/admin/yakumans`）
- 役満種別（`yakuman_types`）の追加・編集・有効/無効切替
- 定義済み役満コードと名称・ポイントの管理

---

## データモデル（主要テーブル）

### `players`
| 列 | 型 | 説明 |
|---|---|---|
| `id` | BIGSERIAL PK | - |
| `name` | TEXT UNIQUE | プレイヤー名 |
| `created_at` | TIMESTAMPTZ | - |

### `games`
| 列 | 型 | 説明 |
|---|---|---|
| `id` | BIGSERIAL PK | - |
| `date` | DATE | 対局日 |
| `game_type` | VARCHAR(2) | `'3p'` or `'4p'` |
| `player1`–`player4` | TEXT | プレイヤー名 |
| `score1`–`score4` | NUMERIC(6,1) | 最終ポイント（対局日のルールに従い整数または小数第1位） |
| `rank1`–`rank4` | SMALLINT | 順位 |
| `is_tobi1`–`is_tobi4` | BOOLEAN | 飛びフラグ |
| `is_tobashi1`–`is_tobashi4` | BOOLEAN | 飛ばしフラグ |
| `is_yakitori1`–`is_yakitori4` | BOOLEAN | 焼き鳥フラグ |
| `score_total` | NUMERIC(6,1) | 合計点（検証用） |
| `notes` | TEXT | メモ |

### `tournaments`
| 列 | 型 | 説明 |
|---|---|---|
| `id` | BIGSERIAL PK | - |
| `name` | TEXT UNIQUE | トーナメント名 |

### `yakuman_types`
| 列 | 型 | 説明 |
|---|---|---|
| `id` | BIGSERIAL PK | - |
| `code` | TEXT UNIQUE | 役満コード |
| `name` | TEXT | 役満名 |
| `points` | INTEGER | ポイント |
| `is_active` | BOOLEAN | 有効フラグ |
| `sort_order` | INTEGER | 表示順 |

### `yakuman_occurrences`
| 列 | 型 | 説明 |
|---|---|---|
| `id` | BIGSERIAL PK | - |
| `game_id` | BIGINT FK→games | - |
| `player_id` | BIGINT FK→players | - |
| `yakuman_code` | TEXT | 役満コード |
| `yakuman_name` | TEXT | 役満名（記録時点） |
| `points` | INTEGER | - |
| `meta` | JSONB | 拡張用 |

---

## スコアリングルール（対局日切替）

正本ロジック: `lib/scoring-rules.ts`

| 対局日 | 精度 | 合計許容 | ウマ |
|---|---|---|---|
| `< 2027-01-01`（既定） | 整数 | ±1 | なし |
| `>= 2027-01-01` | 小数第1位 | ±0.1 | 4p はウマ込み最終ポイントを手動入力（自動加算なし）。3p はウマなし |

適用開始日は `SCORING_RULES_EFFECTIVE_DATE` / `NEXT_PUBLIC_SCORING_RULES_EFFECTIVE_DATE` で上書き可能（未設定時 `2027-01-01`）。

---

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/export/games` | ゲームデータ CSV |
| `GET` | `/api/export/matches` | 対局データ CSV |
| `GET` | `/api/export/stats` | 統計データ CSV |
| `GET` | `/api/yakumans` | 有効な役満種別一覧（JSON） |
| `POST` | `/api/totp` | TOTP 認証 |

---

## アーキテクチャ概要

```
app/               Next.js App Router（ページ・Server Actions）
components/        React UI コンポーネント
lib/               ドメインロジック・DB アクセス
supabase/          Supabase ローカル開発設定・マイグレーション
ddl/               DDL 参照ファイル
scripts/           シード・インポートスクリプト
```

- Server Actions（`app/*-actions.ts`）でフォーム送信・CRUD を処理
- ドメインロジックは `lib/` に集約（`matches.ts`、`players.ts`、`stats.ts` 等）
- 認証は Supabase Auth + MFA (TOTP)