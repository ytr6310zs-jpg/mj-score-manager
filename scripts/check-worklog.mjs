#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKLOG_DIR = path.join(ROOT, ".worklog", "logs");

function fmtDate(date) {
  return date.toISOString().slice(0, 10);
}

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function main() {
  const today = fmtDate(new Date());
  const worklogFile = path.join(WORKLOG_DIR, `${today}.md`);

  if (!fs.existsSync(WORKLOG_DIR)) {
    exitWithError(
      "worklog が見つかりません。`.worklog/logs/` に今日の worklog エントリが存在することを確認してください。"
    );
  }

  if (!fs.existsSync(worklogFile)) {
    exitWithError(
      `今日の worklog ファイルが見つかりません。${worklogFile} を作成してください。`
    );
  }

  const content = fs.readFileSync(worklogFile, "utf8");
  const hasEntry = content.split("\n").some((line) => line.startsWith("### "));

  if (!hasEntry) {
    exitWithError(
      `今日の worklog ファイル ${worklogFile} に少なくとも 1 件のエントリが必要です。` 
    );
  }

  console.log(`Worklog check passed: ${path.relative(ROOT, worklogFile)}`);
}

main();
