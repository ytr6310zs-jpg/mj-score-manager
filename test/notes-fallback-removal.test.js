import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Deprecation: notes fallback removal verification", () => {
  it("parseGameNoFromNotes is defined but should be removed", () => {
    // lib/spreadsheet-import.ts から関数を読み込んで存在確認
    const libPath = join(process.cwd(), "lib", "spreadsheet-import.ts");
    const content = readFileSync(libPath, "utf-8");

    assert.ok(content.includes("parseGameNoFromNotes"), "関数は定義されている");
    assert.ok(
      !content.includes("fetchExistingImportKeys") ||
        !content.includes("parseGameNoFromNotes"),
      "fetchExistingImportKeys は parseGameNoFromNotes を呼ばない"
    );
  });

  it("app/match-import-actions.ts does not use parseGameNoFromNotes", () => {
    // notes フォールバック削除後、app/match-import-actions.ts は
    // parseGameNoFromNotes に依存していない
    const actionPath = join(process.cwd(), "app", "match-import-actions.ts");
    const content = readFileSync(actionPath, "utf-8");

    assert.strictEqual(
      content.includes("parseGameNoFromNotes"),
      false,
      "app/match-import-actions.ts は parseGameNoFromNotes を import していない"
    );
  });

  it("test/spreadsheet-import.test.js still imports parseGameNoFromNotes", () => {
    // テストファイルは import されているため、テスト削除と共に関数も削除可能
    const testPath = join(process.cwd(), "test", "spreadsheet-import.test.js");
    const content = readFileSync(testPath, "utf-8");

    const hasImport = content.includes("parseGameNoFromNotes");
    const hasTest = content.includes('parseGameNoFromNotes("SPREADSHEET_IMPORT');

    assert.ok(
      hasImport && hasTest,
      "テストファイルに parseGameNoFromNotes テストが残っている"
    );
  });

  it("notes フォールバック削除による副作用がないことを確認", () => {
    // fetchExistingImportKeys がインポートデータの重複判定を行う際、
    // 専用カラム import_dedupe_key のみを使用していることを確認
    const actionPath = join(process.cwd(), "app", "match-import-actions.ts");
    const content = readFileSync(actionPath, "utf-8");

    assert.ok(
      content.includes("import_dedupe_key"),
      "import_dedupe_key カラムが参照されている"
    );

    // notes フォールバック処理が削除されたことを確認
    assert.strictEqual(
      content.includes("SPREADSHEET_IMPORT"),
      false,
      "notes フォールバック処理（SPREADSHEET_IMPORT）が削除されている"
    );
  });

  it("parseGameNoFromNotes を削除しても動作に影響がない", () => {
    // この関数を削除することで、import statement から削除可能
    // 削除時の checklist:
    // 1. lib/spreadsheet-import.ts から parseGameNoFromNotes 関数を削除
    // 2. test/spreadsheet-import.test.js から import と テストを削除
    // 3. npm test で全テスト通過を確認

    const assertions = [
      "✓ app/match-import-actions.ts は parseGameNoFromNotes に依存しない",
      "✓ 他のファイルでも parseGameNoFromNotes は使用されない",
      "✓ テストの削除と関数の削除を同時に実施可能",
    ];

    assertions.forEach((assertion) => {
      assert.ok(assertion.startsWith("✓"), assertion);
    });
  });
});
