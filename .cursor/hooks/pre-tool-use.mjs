#!/usr/bin/env node
import fs from "node:fs";
import { decideTool } from "./policy.mjs";

function respond(decision) {
  process.stdout.write(`${JSON.stringify(decision)}\n`);
  process.exit(0);
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

respond(decideTool(input));
