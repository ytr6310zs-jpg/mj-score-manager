#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  decideShell,
  inspectCommand,
  readCommand,
  utcWorklogDate,
  worklogHasEntry,
} from "./policy.mjs";

function respond(decision) {
  process.stdout.write(`${JSON.stringify(decision)}\n`);
  process.exit(0);
}

function gitPaths(cwd, args) {
  try {
    const out = execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function currentWorklogOk(cwd) {
  const file = path.join(cwd, ".worklog", "logs", `${utcWorklogDate()}.md`);
  if (!fs.existsSync(file)) return false;
  return worklogHasEntry(fs.readFileSync(file, "utf8"));
}

const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) respond({ permission: "allow" });

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.stderr.write("cursor hook: invalid JSON\n");
  process.exit(1);
}

const command = readCommand(input);
const inspected = inspectCommand(command);
const cwd = typeof input.cwd === "string" && input.cwd.length > 0 ? input.cwd : process.cwd();

if (!inspected.needsCommit || inspected.blockedAdd || inspected.blockedCommitPath) {
  respond(decideShell({ command }));
}

const stagedPaths = gitPaths(cwd, ["diff", "--cached", "--name-only"]);
const unstagedPaths = inspected.commitAll ? gitPaths(cwd, ["diff", "--name-only"]) : [];

respond(
  decideShell({
    command,
    stagedPaths: stagedPaths ?? [],
    unstagedPaths: unstagedPaths ?? [],
    worklogOk: currentWorklogOk(cwd),
    gitAvailable: stagedPaths != null && unstagedPaths != null,
  }),
);
