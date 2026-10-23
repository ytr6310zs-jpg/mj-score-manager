import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";

import {
  decideShell,
  decideTool,
  hasRemoteDatabaseHost,
  isEnvLocalPath,
  isSecretPath,
  utcWorklogDate,
  worklogHasEntry,
} from "../.cursor/hooks/policy.mjs";

const beforeShell = path.join(".cursor", "hooks", "before-shell.mjs");
const preTool = path.join(".cursor", "hooks", "pre-tool-use.mjs");

function runHook(script, payload) {
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

describe("secret paths", () => {
  it("matches env files, keys, and pem names", () => {
    for (const filePath of [
      ".env",
      "./.env.local",
      ".env.production",
      "certs/server.pem",
      "id_rsa",
      "secrets/id_ed25519",
      "credentials.json",
      "service-account-prod.json",
      "/tmp/app/.env",
    ]) {
      assert.equal(isSecretPath(filePath), true, filePath);
    }
  });

  it("ignores application source", () => {
    for (const filePath of ["app/page.tsx", "lib/scores.ts", "notes.env", ".environment"]) {
      assert.equal(isSecretPath(filePath), false, filePath);
    }
  });

  it("treats only .env.local as the local env file", () => {
    assert.equal(isEnvLocalPath(".env.local"), true);
    assert.equal(isEnvLocalPath(".env"), false);
    assert.equal(isEnvLocalPath(".env.local.bak"), false);
  });
});

describe("shell decisions", () => {
  it("allows build, test, lint, and read-only git", () => {
    for (const command of ["npm run build", "npm test", "npm run lint", "git status", "git diff", "git log"]) {
      assert.equal(decideShell({ command }).permission, "allow", command);
    }
  });

  it("denies git add of secret paths", () => {
    assert.equal(decideShell({ command: "git add .env.local" }).permission, "deny");
    assert.equal(decideShell({ command: "git add -f .env" }).permission, "deny");
    assert.equal(decideShell({ command: 'git add -- ".env.local"' }).permission, "deny");
    assert.equal(
      decideShell({ command: "npm run build && git add .env.local" }).permission,
      "deny",
    );
  });

  it("allows git add of ordinary files", () => {
    assert.equal(decideShell({ command: "git add app/page.tsx" }).permission, "allow");
  });

  it("denies commit when the worklog is missing", () => {
    const decision = decideShell({ command: "git commit -m msg", worklogOk: false });
    assert.equal(decision.permission, "deny");
    assert.match(decision.agent_message, /worklog:start/);
  });

  it("allows commit when the worklog exists and no secrets are staged", () => {
    const command = `git commit -m "$(cat <<'EOF'
docs: note hooks

EOF
)"`;
    assert.equal(
      decideShell({ command, stagedPaths: ["AGENTS.md"], worklogOk: true }).permission,
      "allow",
    );
  });

  it("denies commit of staged secrets even with a worklog", () => {
    assert.equal(
      decideShell({
        command: "git commit -m msg",
        stagedPaths: [".env"],
        worklogOk: true,
      }).permission,
      "deny",
    );
  });

  it("denies git commit -a when a tracked secret is modified", () => {
    assert.equal(
      decideShell({
        command: 'git commit -am "msg"',
        stagedPaths: [],
        unstagedPaths: [".env.local"],
        worklogOk: true,
      }).permission,
      "deny",
    );
  });

  it("does not treat the commit message as a path", () => {
    assert.equal(
      decideShell({
        command: 'git commit -m "fix .env.local docs"',
        worklogOk: true,
      }).permission,
      "allow",
    );
  });

  it("denies commit when git state cannot be read", () => {
    assert.equal(
      decideShell({ command: "git commit -m msg", gitAvailable: false, worklogOk: true }).permission,
      "deny",
    );
  });
});

describe("worklog and remote hosts", () => {
  it("uses the UTC date and ### entry rule from check-worklog", () => {
    assert.equal(utcWorklogDate(new Date("2026-10-23T15:00:00.000Z")), "2026-10-23");
    assert.equal(worklogHasEntry("### Issue\n"), true);
    assert.equal(worklogHasEntry("## heading\n"), false);
    assert.equal(worklogHasEntry(""), false);
  });

  it("flags non-local database hosts and ignores loopback", () => {
    assert.equal(hasRemoteDatabaseHost("SUPABASE_URL=http://127.0.0.1:54321\n"), false);
    assert.equal(hasRemoteDatabaseHost("SUPABASE_URL=http://localhost:54321\n"), false);
    assert.equal(
      hasRemoteDatabaseHost("DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres\n"),
      false,
    );
    assert.equal(hasRemoteDatabaseHost("SUPABASE_URL=https://example.supabase.co\n"), true);
    assert.equal(
      hasRemoteDatabaseHost("DATABASE_URL=postgresql://app:pass@db.example.com:5432/app\n"),
      true,
    );
    assert.equal(hasRemoteDatabaseHost("NEXT_PUBLIC_APP=local\n"), false);
  });
});

describe("tool decisions", () => {
  it("asks before reading a secret file", () => {
    assert.equal(decideTool({ tool_name: "Read", path: ".env.local" }).permission, "ask");
  });

  it("denies writes and deletes of secret files", () => {
    assert.equal(
      decideTool({ tool_name: "Write", tool_input: { path: ".env", contents: "A=b\n" } }).permission,
      "deny",
    );
    assert.equal(decideTool({ tool_name: "Delete", path: "id_rsa" }).permission, "deny");
    assert.equal(
      decideTool({ tool_name: "StrReplace", file_path: "server.pem", new_string: "x" }).permission,
      "deny",
    );
  });

  it("asks for a local .env.local write and denies a remote host", () => {
    assert.equal(
      decideTool({
        tool_name: "Write",
        path: ".env.local",
        contents: "SUPABASE_URL=http://127.0.0.1:54321\n",
      }).permission,
      "ask",
    );
    assert.equal(
      decideTool({
        tool_name: "StrReplace",
        arguments: {
          path: ".env.local",
          new_string: "DATABASE_URL=postgresql://app:pass@db.example.com:5432/app\n",
        },
      }).permission,
      "deny",
    );
  });

  it("allows edits to ordinary files and unknown tools", () => {
    assert.equal(
      decideTool({ tool_name: "StrReplace", path: "app/page.tsx", new_string: "x" }).permission,
      "allow",
    );
    assert.equal(decideTool({ tool_name: "Shell", command: "npm run build" }).permission, "allow");
  });
});

describe("hook stdin", () => {
  it("allows npm run build and denies git add of a secret", () => {
    assert.equal(runHook(beforeShell, { command: "npm run build" }).permission, "allow");
    assert.equal(runHook(beforeShell, { command: "git status" }).permission, "allow");
    assert.equal(runHook(beforeShell, { command: "git add .env.local" }).permission, "deny");
  });

  it("asks and denies through the tool hook", () => {
    assert.equal(runHook(preTool, { tool_name: "Read", path: ".env" }).permission, "ask");
    assert.equal(
      runHook(preTool, {
        tool_name: "Write",
        path: ".env.local",
        contents: "SUPABASE_URL=https://example.supabase.co\n",
      }).permission,
      "deny",
    );
  });
});
