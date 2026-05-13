# テストインフラ tsx 移行 タスク一覧（Issue #242）

1. `tsx` を devDependencies に追加する
2. `package.json` の test スクリプト（unit/integration/e2e）を `tsx` ベースに書き換える
3. `.cjs` テストファイルを `.js` にリネームし、CJS 構文を ESM へ変換する
4. `lib/` および他ディレクトリの CJS (`module.exports`) ファイルを ESM へ変換する
5. `lib/package.json` を削除する
6. ts-node register パターンを全廃する
7. カバレッジ計測（nyc/istanbul）で `tsx` でも正常に取得できるか確認し、必要に応じて修正・代替案を適用する
8. README/開発ドキュメントの該当箇所を更新する

---
