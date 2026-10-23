#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  decideShell,
  inspectCommand,
  pathsStagedByAdds,
  readCommand,
  resolveWorklogRoot,
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

function repositoryRoot(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function currentWorklogOk(root) {
  if (!root) return false;
  const file = path.join(root, ".worklog", "logs", `${utcWorklogDate()}.md`);
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
const worklogRoot = resolveWorklogRoot({ cwd, toplevel: repositoryRoot(cwd) });

if (!inspected.needsCommit && !inspected.scanAdds) {
  respond(decideShell({ command, worklogOk: currentWorklogOk(worklogRoot) }));
}

let gitAvailable = true;
let pendingAddPaths = [];
if (inspected.scanAdds) {
  const statusLines = gitPaths(cwd, ["status", "--porcelain=v1", "-uall"]);
  if (statusLines == null) gitAvailable = false;
  else pendingAddPaths = pathsStagedByAdds(command, statusLines);
}

let stagedPaths = [];
let unstagedPaths = [];
if (inspected.needsCommit) {
  const staged = gitPaths(cwd, ["diff", "--cached", "--name-only"]);
  const unstaged = inspected.commitAll ? gitPaths(cwd, ["diff", "--name-only"]) : [];
  if (staged == null || unstaged == null) gitAvailable = false;
  else {
    stagedPaths = staged;
    unstagedPaths = unstaged;
  }
}

respond(
  decideShell({
    command,
    stagedPaths,
    unstagedPaths,
    pendingAddPaths,
    worklogOk: currentWorklogOk(worklogRoot),
    gitAvailable,
  }),
);
