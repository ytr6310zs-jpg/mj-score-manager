#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WORKLOG_DIR = path.join(ROOT, ".worklog");
const LOG_DIR = path.join(WORKLOG_DIR, "logs");
const REPORT_DIR = path.join(WORKLOG_DIR, "reviews");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = { days: 7, out: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === "--days" && v) {
      args.days = Number.parseInt(v, 10) || 7;
      i += 1;
    } else if (a === "--out" && v) {
      args.out = v;
      i += 1;
    }
  }
  return args;
}

function listRecentLogFiles(days) {
  if (!fs.existsSync(LOG_DIR)) return [];
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - (days - 1));
  threshold.setHours(0, 0, 0, 0);

  return fs
    .readdirSync(LOG_DIR)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .map((name) => ({ name, date: new Date(`${name.slice(0, 10)}T00:00:00Z`), fullPath: path.join(LOG_DIR, name) }))
    .filter((item) => item.date >= threshold)
    .sort((a, b) => a.date - b.date);
}

function extractLines(content, prefix) {
  return content
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim())
    .filter(Boolean);
}

function generateReview(days, outPath) {
  ensureDir(REPORT_DIR);
  const files = listRecentLogFiles(days);
  const reviewDate = fmtDate(new Date());
  const outFile = outPath ? path.resolve(ROOT, outPath) : path.join(REPORT_DIR, `review-${reviewDate}.md`);

  const summaries = [];
  const reasons = [];
  const decisions = [];
  const nextActions = [];
  const doneWhenItems = [];
  const fileCounter = new Map();
  let entryCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath, "utf8");
    entryCount += (content.match(/^### /gm) || []).length;

    for (const s of extractLines(content, "- summary:")) summaries.push(s);
    for (const r of extractLines(content, "- reason:")) reasons.push(r);

    let currentSection = "";
    for (const line of content.split("\n")) {
      if (line.startsWith("- decisions:")) { currentSection = "decisions"; continue; }
      if (line.startsWith("- next_actions:")) { currentSection = "next_actions"; continue; }
      if (line.startsWith("- done_when:")) { currentSection = "done_when"; continue; }
      if (line.startsWith("### ")) { currentSection = ""; continue; }
      if (line.startsWith("  - ")) {
        if (currentSection === "next_actions") nextActions.push(line.slice(4).trim());
        else if (currentSection === "done_when") doneWhenItems.push(line.slice(4).trim());
        else if (currentSection === "decisions") decisions.push(line.slice(4).trim());
      }
    }

    for (const line of extractLines(content, "- changed_files:")) {
      if (line === "(変更ファイルなし)") continue;
      for (const item of line.split(",").map((v) => v.trim()).filter(Boolean)) {
        fileCounter.set(item, (fileCounter.get(item) || 0) + 1);
      }
    }
  }

  const topFiles = [...fileCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const body = [
    `# Worklog Review (${reviewDate})`,
    "",
    `- period_days: ${days}`,
    `- log_files: ${files.length}`,
    `- entries: ${entryCount}`,
    "",
    "## Summary",
    summaries.length ? summaries.map((s) => `- ${s}`).join("\n") : "- (記録なし)",
    "",
    "## Reason",
    reasons.length ? reasons.map((r) => `- ${r}`).join("\n") : "- (記録なし)",
    "",
    "## Decisions",
    decisions.length ? decisions.map((d) => `- ${d}`).join("\n") : "- (記録なし)",
    "",
    "## Next Actions",
    nextActions.length ? nextActions.map((n) => `- ${n}`).join("\n") : "- (記録なし)",
    "",
    "## Done When",
    doneWhenItems.length ? doneWhenItems.map((item) => `- ${item}`).join("\n") : "- (記録なし)",
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
  generateReview(args.days, args.out);
}

main();
