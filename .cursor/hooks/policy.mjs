const GUARDED_TOOLS = new Set(["Read", "Write", "StrReplace", "Delete"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PATH_KEYS = new Set(["path", "file_path", "target_file", "filePath", "file"]);
const CONTENT_KEYS = ["contents", "content", "new_string", "newString", "text", "patch"];

export function utcWorklogDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function worklogHasEntry(content) {
  if (typeof content !== "string") return false;
  return content.split("\n").some((line) => line.startsWith("### "));
}

export function isSecretPath(filePath) {
  return isSecretBasename(basenameOf(filePath));
}

export function isEnvLocalPath(filePath) {
  return basenameOf(filePath).replaceAll("*", "") === ".env.local";
}

export function hasRemoteDatabaseHost(content) {
  if (typeof content !== "string" || content.length === 0) return false;
  const pattern =
    /(?:^|\n)\s*(?:export\s+)?(?:SUPABASE_URL|DATABASE_URL)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s#]+))/g;
  for (const match of content.matchAll(pattern)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    if (hostIsRemote(value)) return true;
  }
  return false;
}

export function readCommand(input) {
  if (!input || typeof input !== "object") return "";
  if (typeof input.command === "string") return input.command;
  if (typeof input.command_line === "string") return input.command_line;
  const nested = input.arguments ?? input.tool_input;
  if (nested && typeof nested.command === "string") return nested.command;
  return "";
}

export function decideShell({
  command,
  stagedPaths = [],
  unstagedPaths = [],
  worklogOk = true,
  gitAvailable = true,
}) {
  const inspected = inspectCommand(command);
  if (inspected.blockedAdd) return denyAdd();
  if (inspected.blockedCommitPath) return denyCommitSecret();
  if (!inspected.needsCommit) return allow();
  if (!gitAvailable) return denyGitState();
  const names = [...stagedPaths];
  if (inspected.commitAll) names.push(...unstagedPaths);
  if (names.some(isSecretPath)) return denyCommitSecret();
  if (!worklogOk) return denyWorklog();
  return allow();
}

export function decideTool(input) {
  if (!input || typeof input !== "object") return allow();
  const tool = toolName(input);
  if (!GUARDED_TOOLS.has(tool)) return allow();

  const secretPaths = collectPaths(input).filter(isSecretPath);
  if (secretPaths.length === 0) return allow();
  if (tool === "Read") return askRead();
  if (tool === "Delete") return denyDelete();

  const onlyEnvLocal = secretPaths.every(isEnvLocalPath);
  if (onlyEnvLocal) {
    if (hasRemoteDatabaseHost(collectContent(input))) return denyRemoteEnv();
    return askEnvLocalWrite();
  }
  return denySecretWrite();
}

export function inspectCommand(command) {
  const result = {
    blockedAdd: false,
    blockedCommitPath: false,
    needsCommit: false,
    commitAll: false,
  };
  if (typeof command !== "string" || command.length === 0) return result;

  for (const segment of splitShellSegments(command)) {
    const git = parseGit(segment);
    if (!git) continue;
    if (git.subcommand === "add" && git.paths.some(isSecretPath)) result.blockedAdd = true;
    if (git.subcommand === "commit") {
      result.needsCommit = true;
      if (git.all) result.commitAll = true;
      if (git.paths.some(isSecretPath)) result.blockedCommitPath = true;
    }
  }
  return result;
}

function allow() {
  return { permission: "allow" };
}

function denyAdd() {
  return {
    permission: "deny",
    user_message: "秘密ファイル（.env や鍵）の git add を止めました。",
    agent_message:
      ".env*、*.pem、秘密鍵はステージしない。git add をやめて、対象は .gitignore のままにする。",
  };
}

function denyCommitSecret() {
  return {
    permission: "deny",
    user_message: "秘密ファイルが commit に含まれるため止めました。",
    agent_message:
      "ステージ済み、または git commit -a の対象から .env や鍵を外す。ファイルの中身は表示しない。",
  };
}

function denyWorklog() {
  return {
    permission: "deny",
    user_message: "当日の worklog が無いため commit を止めました。",
    agent_message:
      "npm run worklog:start で当日エントリを作ってから commit する。フックは worklog を作らない。",
  };
}

function denyGitState() {
  return {
    permission: "deny",
    user_message: "git の状態を確認できないため commit を止めました。",
    agent_message: "git diff --cached が失敗した。インデックスを確認してから commit する。",
  };
}

function askRead() {
  return {
    permission: "ask",
    user_message: "秘密ファイルの読み取りです。続行してよいか確認してください。",
    agent_message: ".env や鍵をコンテキストに読まない。ユーザーの確認が必要。",
  };
}

function askEnvLocalWrite() {
  return {
    permission: "ask",
    user_message: ".env.local への書き込みです。ローカル開発向けか確認してください。",
    agent_message: "staging/production の URL やキーを .env.local に書かない。",
  };
}

function denyRemoteEnv() {
  return {
    permission: "deny",
    user_message: ".env.local にローカル以外の DB / Supabase ホストが含まれるため書き込みを止めました。",
    agent_message: "SUPABASE_URL と DATABASE_URL は localhost または 127.0.0.1 だけを使う。",
  };
}

function denySecretWrite() {
  return {
    permission: "deny",
    user_message: "秘密ファイルへの書き込みを止めました。",
    agent_message: ".env や鍵ファイルは編集しない。",
  };
}

function denyDelete() {
  return {
    permission: "deny",
    user_message: "秘密ファイルの削除を止めました。",
    agent_message: ".env や鍵の Delete はここでは行わない。",
  };
}

function basenameOf(filePath) {
  if (typeof filePath !== "string") return "";
  const normalized = filePath.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  return normalized.split("/").filter(Boolean).pop() ?? "";
}

function isSecretBasename(base) {
  const probe = base.replaceAll("*", "");
  if (probe === ".env" || probe.startsWith(".env.")) return true;
  if (probe.endsWith(".pem")) return true;
  if (probe === "id_rsa" || probe === "id_ed25519") return true;
  if (probe === "credentials.json") return true;
  if (/^service-account.*\.json$/i.test(probe)) return true;
  return false;
}

function hostIsRemote(value) {
  const host = hostnameOf(value);
  if (!host) return false;
  return !LOCAL_HOSTS.has(host.toLowerCase());
}

function hostnameOf(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("$")) return "";
  const normalized = trimmed.replace(/^postgres(ql)?:\/\//i, "http://");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)) return "";
  try {
    return new URL(normalized).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return "";
  }
}

function toolName(input) {
  const raw = input.tool_name ?? input.toolName ?? input.tool ?? "";
  return String(raw).split(":").pop().trim();
}

function collectPaths(input) {
  const acc = [];
  walkPaths(input, 0, acc);
  return acc;
}

function walkPaths(value, depth, acc) {
  if (depth > 4 || value == null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") acc.push(item);
      else walkPaths(item, depth + 1, acc);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (PATH_KEYS.has(key) && typeof child === "string") acc.push(child);
    else if (key === "paths" && Array.isArray(child)) {
      for (const item of child) if (typeof item === "string") acc.push(item);
    } else if (key === "tool_input" || key === "arguments" || key === "input" || key === "params") {
      walkPaths(child, depth + 1, acc);
    }
  }
}

function collectContent(input) {
  const chunks = [];
  const sources = [input, input.tool_input, input.arguments, input.input, input.params];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of CONTENT_KEYS) {
      if (typeof source[key] === "string") chunks.push(source[key]);
    }
  }
  return chunks.join("\n");
}

function splitShellSegments(command) {
  const tokens = tokenize(command);
  const segments = [];
  let current = [];
  for (const token of tokens) {
    if (token === "&&" || token === "||" || token === ";" || token === "\n") {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    current.push(token);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function tokenize(command) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    if (quote) {
      if (ch === "\\" && quote === '"' && command[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (current) tokens.push(current);
      current = "";
      tokens.push("\n");
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    if (ch === "&" && command[i + 1] === "&") {
      if (current) tokens.push(current);
      current = "";
      tokens.push("&&");
      i += 1;
      continue;
    }
    if (ch === "|" && command[i + 1] === "|") {
      if (current) tokens.push(current);
      current = "";
      tokens.push("||");
      i += 1;
      continue;
    }
    if (ch === ";") {
      if (current) tokens.push(current);
      current = "";
      tokens.push(";");
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

function parseGit(tokens) {
  const start = tokens.findIndex((token) => token === "git");
  if (start < 0) return null;
  let index = start + 1;
  const valueOptions = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace"]);
  while (index < tokens.length) {
    const token = tokens[index];
    if (token === "--") {
      index += 1;
      break;
    }
    if (valueOptions.has(token)) {
      index += 2;
      continue;
    }
    if (token.startsWith("-")) {
      index += 1;
      continue;
    }
    break;
  }
  const subcommand = tokens[index];
  if (subcommand !== "add" && subcommand !== "commit") return null;
  const rest = tokens.slice(index + 1);
  if (subcommand === "add") return { subcommand, paths: parseAddPaths(rest), all: false };
  const parsed = parseCommitArgs(rest);
  return { subcommand, paths: parsed.paths, all: parsed.all };
}

function parseAddPaths(rest) {
  const paths = [];
  let afterDash = false;
  const valueFlags = new Set(["-m", "--chmod", "--pathspec-from-file"]);
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!afterDash && token === "--") {
      afterDash = true;
      continue;
    }
    if (!afterDash && valueFlags.has(token)) {
      i += 1;
      continue;
    }
    if (!afterDash && token.startsWith("-")) continue;
    paths.push(token);
  }
  return paths;
}

function parseCommitArgs(rest) {
  let all = false;
  const paths = [];
  let afterDash = false;
  const valueFlags = new Set([
    "-m",
    "--message",
    "-F",
    "--file",
    "--author",
    "--date",
    "-C",
    "-c",
    "--fixup",
    "--squash",
    "-t",
    "--template",
    "--cleanup",
  ]);
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!afterDash && token === "--") {
      afterDash = true;
      continue;
    }
    if (!afterDash && token.startsWith("--")) {
      if (token === "--all") all = true;
      const flag = token.split("=")[0];
      if (!token.includes("=") && valueFlags.has(flag)) i += 1;
      continue;
    }
    if (!afterDash && token.startsWith("-")) {
      const letters = token.slice(1);
      if (letters.includes("a")) all = true;
      const takesNext = (flag) => {
        const at = letters.indexOf(flag);
        return at >= 0 && at === letters.length - 1;
      };
      if (takesNext("m") || takesNext("F") || takesNext("C") || takesNext("c")) i += 1;
      continue;
    }
    paths.push(token);
  }
  return { all, paths };
}
