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
    decisions: [],
    next: [],
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
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function appendWorklog(args) {
  ensureDir(LOG_DIR);

  const current = now();
  const day = fmtDate(current);
  const filePath = path.join(LOG_DIR, `${day}.md`);
  const exists = fs.existsSync(filePath);

  const changedFiles = getChangedFiles();
  const decisions = args.decisions.length ? args.decisions : ["(必要なら追記)"];
  const nextActions = args.next.length ? args.next : ["(必要なら追記)"];
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
    "- decisions:",
    ...decisions.map((d) => `  - ${d}`),
    "- next_actions:",
    ...nextActions.map((n) => `  - ${n}`),
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
  ensureDir(REPORT_DIR);

  const files = listRecentLogFiles(args.days);
  const reviewDate = fmtDate(now());
  const outFile = args.out
    ? path.resolve(ROOT, args.out)
    : path.join(REPORT_DIR, `review-${reviewDate}.md`);

  const summaries = [];
  const decisions = [];
  const nextActions = [];
  const fileCounter = new Map();
  let entryCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath, "utf8");
    entryCount += (content.match(/^### /gm) || []).length;

    for (const summary of extractLines(content, "- summary:")) {
      summaries.push(summary);
    }

    const decisionMatches = content.match(/^  - .+$/gm) || [];
    let inNextActions = false;
    for (const line of content.split("\n")) {
      if (line.startsWith("- decisions:")) {
        inNextActions = false;
        continue;
      }
      if (line.startsWith("- next_actions:")) {
        inNextActions = true;
        continue;
      }
      if (line.startsWith("  - ")) {
        if (inNextActions) {
          nextActions.push(line.slice(4).trim());
        } else {
          decisions.push(line.slice(4).trim());
        }
      }
    }

    const changedLines = extractLines(content, "- changed_files:");
    for (const line of changedLines) {
      if (line === "(変更ファイルなし)") continue;
      for (const item of line.split(",").map((v) => v.trim()).filter(Boolean)) {
        fileCounter.set(item, (fileCounter.get(item) || 0) + 1);
      }
    }

    if (!decisionMatches.length) {
      // no-op: decisions/next_actions are optional in old logs
    }
  }

  const topFiles = [...fileCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const body = [
    `# Worklog Review (${reviewDate})`,
    "",
    `- period_days: ${args.days}`,
    `- log_files: ${files.length}`,
    `- entries: ${entryCount}`,
    "",
    "## Summary",
    summaries.length ? summaries.map((s) => `- ${s}`).join("\n") : "- (記録なし)",
    "",
    "## Decisions",
    decisions.length ? decisions.map((d) => `- ${d}`).join("\n") : "- (記録なし)",
    "",
    "## Next Actions",
    nextActions.length ? nextActions.map((n) => `- ${n}`).join("\n") : "- (記録なし)",
    "",
    "## Frequently Touched Files",
    topFiles.length ? topFiles.map(([file, count]) => `- ${file} (${count})`).join("\n") : "- (記録なし)",
    "",
  ].join("\n");

  ensureDir(path.dirname(outFile));
  fs.writeFileSync(outFile, body, "utf8");
  console.log(`Review generated: ${path.relative(ROOT, outFile)}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === "start" || args.command === "touch") {
    appendWorklog(args);
    return;
  }

  if (args.command === "review") {
    generateReview(args);
    return;
  }

  console.error("Unknown command. Use: start|touch|review");
  process.exitCode = 1;
}

main();
