Design ドキュメント（リポジトリ内管理）

このフォルダはプロジェクト設計資産をコードベースと一緒に管理するための場所です。
目的:
- 仕様・設計のバージョン管理をコードと同期して行う
- 意思決定（ADR）を時系列で残す
- 図やCSVサンプルをテキストベース（Mermaid / CSV）で保存して差分追跡を可能にする

推奨構成:
- `design/adr/` — Architecture Decision Records（Markdown）
- `design/diagrams/` — Mermaid 等のテキスト図および生成されたSVG/PNG（アセット）
- `design/samples/` — CSVやJSON のサンプルデータ（バージョン付き）
- `design/templates/` — ADR などのテンプレート

運用ルール（簡潔）:
1. 設計変更はPRで提出し、レビューとマージを通して確定する。
2. 重要な意思決定は ADR を作成し、`design/adr/` に格納する。
3. Mermaid 図は `.mmd`（テキスト）で保存し、必要に応じて `npx @mermaid-js/mermaid-cli` でSVGを生成する。
4. 大きなバイナリは外部ストレージ（Figma/GDrive）に置き、リンクを `design/` に記載する。

Mermaid をローカルでレンダリングする例:

```bash
npx @mermaid-js/mermaid-cli -i design/diagrams/yakuman-csv.mmd -o design/diagrams/yakuman-csv.svg
```

このフォルダに入れる最初のファイル:
- `design/adr/0001-yakuman-records.md` — 役満記録用のADR
- `design/diagrams/yakuman-csv.mmd` — CSVフォーマット図（Mermaid）
- `design/templates/adr-template.md` — ADR テンプレート

--
最小限の運用で始め、必要に応じて Notion 等と同期する運用を追加してください。
