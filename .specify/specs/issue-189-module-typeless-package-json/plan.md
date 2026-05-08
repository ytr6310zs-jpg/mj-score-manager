# Issue #189 Plan

## Implementation Plan

1. `package.json` に `"type": "module"` を追加する。
2. CommonJS 依存のテストを `.cjs` へ rename し、`find` ベースの test discovery を `.js` / `.cjs` 両対応にする。
3. `test/register-ts-node.cjs` を追加し、CJS テストから参照する TypeScript を CommonJS としてロードできるようにする。
4. `lib/filter-state-preference.js` の export を ESM に切り替える。

## Validation

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run build`
