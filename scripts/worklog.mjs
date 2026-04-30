#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const WORKLOG_DIR = path.join(ROOT, ".worklog");
const LOG_DIR = path.join(WORKLOG_DIR, "logs");
const REPORT_DIR = path.join(WORKLOG_DIR, "reviews");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function now() {
  return new Date();
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDateTime(d) {
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function toArray(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    command: "start",
    summary: "",
    reason: "",
    decisions: [],
    next: [],
    doneWhen: [],
    tags: [],
    days: 7,
    out: "",
  };

  const rest = [...argv];
  if (rest[0] && !rest[0].startsWith("--")) {
    args.command = rest.shift();
  }

  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    const next = rest[i + 1];

    if (item === "--summary" && next) {
      args.summary = next;
      i += 1;
      continue;
    }

    if (item === "--reason" && next) {
      args.reason = next;
      i += 1;
      continue;
    }

    if (item === "--decision" && next) {
      args.decisions = toArray(next);
      i += 1;
      continue;
    }

    if (item === "--next" && next) {
      args.next = toArray(next);
      i += 1;
      continue;
    }

    if (item === "--done-when" && next) {
      args.doneWhen = toArray(next);
      i += 1;
      continue;
    }

    if (item === "--tags" && next) {
      args.tags = toArray(next);
      i += 1;
      continue;
    }

    if (item === "--days" && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.days = parsed;
      }
      i += 1;
      continue;
    }

    if (item === "--out" && next) {
      args.out = next;
      i += 1;
    }
  }

  return args;
}

function runGit(command) {
  try {
    return execSync(command, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function getBranch() {
  return runGit("git branch --show-current") || "unknown";
}

function getChangedFiles() {
  const output = runGit("git status --porcelain");
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => line.replace(/^..\s/, "").trim())
    .filter(Boolean);
}

function appendWorklog(args) {
  ensureDir(LOG_DIR);

  const current = now();
  const day = fmtDate(current);
  const filePath = path.join(LOG_DIR, `${day}.md`);
  const exists = fs.existsSync(filePath);

  const changedFiles = getChangedFiles();
  const reason = args.reason || "(理由を記載してください)";
  const decisions = args.decisions.length ? args.decisions : ["(必要なら追記)"];
  const nextActions = args.next.length ? args.next : ["(必要なら追記)"];
  const doneWhen = args.doneWhen.length ? args.doneWhen : ["(完了条件を追記)"];
  const tags = args.tags.length ? args.tags.join(", ") : "(なし)";
  const summary = args.summary || "(作業内容を要約してください)";

  if (!exists) {
    const header = [
      `# Worklog ${day}`,
      "",
      "このファイルは AI 作業記録の自動生成で作成されます。",
      "機密情報（鍵・トークン・個人情報）は記録しないでください。",
      "",
      "## Entries",
      "",
    ].join("\n");
    fs.writeFileSync(filePath, header, "utf8");
  }

  const entry = [
    `### ${fmtDateTime(current)}`,
    `- branch: ${getBranch()}`,
    `- tags: ${tags}`,
    `- changed_files: ${changedFiles.length ? changedFiles.join(", ") : "(変更ファイルなし)"}`,
    `- summary: ${summary}`,
    `- reason: ${reason}`,
    "- decisions:",
    ...decisions.map((d) => `  - ${d}`),
    "- next_actions:",
    ...nextActions.map((n) => `  - ${n}`),
    "- done_when:",
    ...doneWhen.map((item) => `  - ${item}`),
    "",
  ].join("\n");

  fs.appendFileSync(filePath, entry, "utf8");
  console.log(`Worklog updated: ${path.relative(ROOT, filePath)}`);
}

function listRecentLogFiles(days) {
  if (!fs.existsSync(LOG_DIR)) return [];

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - (days - 1));
  threshold.setHours(0, 0, 0, 0);

  const files = fs
    .readdirSync(LOG_DIR)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .map((name) => {
      const date = new Date(`${name.slice(0, 10)}T00:00:00Z`);
      return {
        name,
        date,
        fullPath: path.join(LOG_DIR, name),
      };
    })
    .filter((item) => item.date >= threshold)
    .sort((a, b) => a.date - b.date);

  return files;
}

function extractLines(content, prefix) {
  return content
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim())
    .filter(Boolean);
}

function generateReview(args) {
// `generateReview` removed. Delegate `review` command to `scripts/summary-worklog.mjs`.

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "start" || args.command === "touch") {
    appendWorklog(args);
    return;
  }

  if (args.command === "review") {
    // Delegate to the new summary script to avoid duplicated logic.
    try {
      const daysArg = args.days || 7;
      const outArg = args.out ? ` --out "${args.out}"` : "";
      const cmd = `node ${path.join("scripts", "summary-worklog.mjs")} --days ${daysArg}${outArg}`;
      execSync(cmd, { cwd: ROOT, stdio: "inherit" });
      return;
    } catch (err) {
      console.error("Failed to run summary-worklog.mjs:", err.message || err);
      process.exitCode = 1;
      return;
    }
  }

  console.error("Unknown command. Use: start|touch|review");
  process.exitCode = 1;
}

main();
