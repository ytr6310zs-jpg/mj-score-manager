# テストインフラ tsx 移行 実装計画（Issue #242）

## 方針
- 互換性・CI安定性を重視し、Node.js 22+ でも `tsx` パッケージを標準とする。
- 既存の CJS テスト資産を ESM へ段階的に変換。
- カバレッジ計測（nyc/istanbul）も必ず動作確認し、問題があれば代替案を検討。

## ステップ
1. `tsx` を devDependencies に追加
2. `package.json` の test スクリプトを `tsx` ベースに書き換え
3. `.cjs` テストファイルを `.js` にリネームし、CJS 構文を ESM へ変換
4. `lib/` および他ディレクトリの CJS (`module.exports`) ファイルを ESM へ変換
5. `lib/package.json` を削除
6. ts-node register パターンを全廃
7. カバレッジ計測の動作確認・修正
8. README/開発ドキュメントの該当箇所を更新

## 代替案
- CI/カバレッジで `tsx` が動作しない場合は、Node.js 22+ の `--import tsx/esm` へ切り替え、または `vitest` など他のテストランナーを検討

## 移行時の注意点
- CJS/ESM 変換時は import/export の循環参照や default export の扱いに注意
- テスト以外の本番コードは本 Issue で触れない
- 既存のテストカバレッジ閾値・レポート出力先は維持

## 完了条件
- すべてのテストが `tsx` で正常動作し、カバレッジも取得できること
- 暫定的な CJS/CJS混在資産が一掃されていること

---
