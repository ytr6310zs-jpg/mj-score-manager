# テストインフラ tsx 移行仕様書（Issue #242）

## 概要
- テスト実行環境を ts-node から tsx（または Node.js 22+ の `--import` フック）へ移行し、TypeScript/ESM モダン構成に統一する。
- 既存の CJS 依存・暫定措置（lib/package.json, module.exports, .cjs, ts-node register など）を撤廃。

## 背景
- `package.json` の `"type": "module"` 化に伴い、CJS/ESM 混在の暫定措置が複雑化。
- tsx で ESM/TypeScript を直接テスト実行できるため、構成を簡素化し保守性を向上。

## 要件
- テスト実行コマンドを `tsx` ベースに統一（`node --import tsx/esm` も許容、理由は後述）。
- すべてのテストファイルを ESM 構文（import/export）に統一。
- `.cjs` テストファイルは `.js` にリネームし、CJS 構文を ESM へ変換。
- `lib/` 配下および他ディレクトリの CJS (`module.exports`) ファイルも ESM へ変換。
- `lib/package.json` を削除。
- ts-node register パターンを全廃。
- カバレッジ計測（nyc/istanbul）も tsx で動作することを必須とし、動作しない場合は代替案を提示。
- Node.js 22+ の場合は `--import tsx/esm` も選択肢とし、LTS 互換性を考慮。

## 推奨方式
- **tsx パッケージを推奨**
  - Node.js 標準 `--import` フックは 22+ 限定であり、LTS/CI 環境の幅広い互換性を担保するため `tsx` を推奨。
  - `tsx` は高速で、既存の ts-node からの移行も容易。

## 非対応・除外範囲
- テスト以外の本番コードの ESM/CJS 変換は本 Issue では対象外。
- テスト実行に直接関係しないスクリプト（例: migration, one-off scripts）は別 Issue で対応。

## 参考
- [tsx GitHub](https://github.com/privatenumber/tsx)
- Node.js `--import` フック: https://nodejs.org/api/module.html#customization-hooks

---
