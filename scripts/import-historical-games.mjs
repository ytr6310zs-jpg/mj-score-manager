#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "scripts", "mahjong-data");
const IMPORT_NOTE_PREFIX = "CSV_IMPORT";
const SCORE_TOLERANCE = 1;
const YAKUMAN_CODE_RULES = [
  { keyword: "国士", code: "KY" },
  { keyword: "大三", code: "DA" },
  { keyword: "四単", code: "ST" },
  { keyword: "四暗", code: "SS" },
  { keyword: "数え", code: "KZ" },
];

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
  };
}

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function buildDateFromFilename(fileName) {
  const base = fileName.replace(/\.csv$/i, "");
  if (!/^\d{8}$/.test(base)) {
    throw new Error(`Invalid file name: ${fileName}`);
  }
  return `${base.slice(0, 4)}-${base.slice(4, 6)}-${base.slice(6, 8)}`;
}

function buildCreatedAt(dateIso, gameIndex) {
  const startMs = Date.parse(`${dateIso}T10:00:00.000Z`);
  return new Date(startMs + (gameIndex - 1) * 60 * 1000).toISOString();
}

function buildEntries(playersWithScore) {
  const ranked = [...playersWithScore]
    .sort((a, b) => b.score - a.score || a.slot - b.slot)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  const rankBySlot = new Map(ranked.map((entry) => [entry.slot, entry.rank]));
  return playersWithScore.map((entry) => ({
    ...entry,
    rank: rankBySlot.get(entry.slot) ?? playersWithScore.length,
  }));
}

function inferYakumanCode(yakumanName) {
  const normalized = String(yakumanName ?? "").trim();
  if (!normalized) return "CSV";
  const matched = YAKUMAN_CODE_RULES.find((rule) => normalized.includes(rule.keyword));
  return matched?.code ?? "CSV";
}

function parseYakumanDescriptor(descriptor) {
  const trimmed = String(descriptor ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const withPoints = trimmed.match(/^(.*?)[(（]\s*(\d{4,6})\s*[)）]$/);
  if (withPoints) {
    const yakumanName = String(withPoints[1] ?? "").trim();
    const points = Number(withPoints[2]);
    return {
      yakumanName,
      yakumanCode: inferYakumanCode(yakumanName),
      points: Number.isInteger(points) ? points : null,
    };
  }

  return {
    yakumanName: trimmed,
    yakumanCode: inferYakumanCode(trimmed),
    points: null,
  };
}

function parseYakumanCell(rawText, participants, sourceFile, gameNo) {
  const raw = String(rawText ?? "").trim();
  if (!raw) {
    return {
      noteSuffix: "",
      occurrences: [],
    };
  }

  // 拡張記法: 「プレイヤー名:役満名|プレイヤー名:役満名(点数)」
  // 例: 沢尾望:国士|加藤:大三元(32000)
  if (!raw.includes(":") && !raw.includes("：")) {
    return {
      noteSuffix: raw,
      occurrences: [],
    };
  }

  const playersInGame = new Set(participants.map((p) => p.player));
  const items = raw
    .split(/[|｜]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const occurrences = [];
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx];
    const m = item.match(/^([^:：]+)[:：](.+)$/);
    if (!m) {
      throw new Error(`${sourceFile}: game ${gameNo} の役満記法が不正です: ${item}`);
    }

    const playerName = String(m[1] ?? "").trim();
    const parsed = parseYakumanDescriptor(m[2]);
    if (!parsed) {
      throw new Error(`${sourceFile}: game ${gameNo} の役満名が空です: ${item}`);
    }
    if (!playersInGame.has(playerName)) {
      throw new Error(`${sourceFile}: game ${gameNo} の役満プレイヤー '${playerName}' は同卓者に存在しません`);
    }

    occurrences.push({
      playerName,
      yakumanName: parsed.yakumanName,
      yakumanCode: parsed.yakumanCode,
      points: parsed.points,
      importKey: `${IMPORT_NOTE_PREFIX}:${sourceFile}:G${gameNo}:Y${idx + 1}`,
      raw,
    });
  }

  return {
    noteSuffix: raw,
    occurrences,
  };
}

function extractImportNoteKey(notes) {
  const raw = String(notes ?? "").trim();
  if (!raw) return "";
  const firstSpace = raw.indexOf(" ");
  const key = firstSpace === -1 ? raw : raw.slice(0, firstSpace);
  return key.startsWith(`${IMPORT_NOTE_PREFIX}:`) ? key : "";
}

function parseCsvToGames(fileName, content) {
  const dateIso = buildDateFromFilename(fileName);
  const lines = content.replace(/\r/g, "").trimEnd().split("\n");
  const rows = lines.map(parseCsvLine);
  if (rows.length < 2) {
    throw new Error(`${fileName}: not enough rows`);
  }

  const header = rows[0];
  if ((header[0] ?? "").trim() !== "player") {
    throw new Error(`${fileName}: header first column must be 'player'`);
  }

  const playerRows = rows.slice(1).filter((row) => {
    const name = String(row[0] ?? "").trim();
    return name && name !== "役満発生";
  });
  const yakumanRow = rows.find((row) => String(row[0] ?? "").trim() === "役満発生");

  const games = [];
  for (let col = 1; col < header.length; col += 1) {
    const gameNo = String(header[col] ?? "").trim() || String(col);
    const participants = [];

    for (const row of playerRows) {
      const playerName = String(row[0] ?? "").trim();
      const raw = String(row[col] ?? "").trim();
      if (!raw) continue;
      const score = Number(raw);
      if (!Number.isInteger(score)) {
        throw new Error(`${fileName}: game ${gameNo} has invalid score '${raw}' for ${playerName}`);
      }
      participants.push({
        slot: participants.length + 1,
        player: playerName,
        score,
      });
    }

    if (participants.length === 0) {
      continue;
    }
    if (participants.length !== 3 && participants.length !== 4) {
      throw new Error(`${fileName}: game ${gameNo} has unsupported player count ${participants.length}`);
    }

    const total = participants.reduce((sum, cur) => sum + cur.score, 0);
    if (Math.abs(total) > SCORE_TOLERANCE) {
      throw new Error(`${fileName}: game ${gameNo} score total must be 0 (+/-1), got ${total}`);
    }

    const gameType = participants.length === 4 ? "4p" : "3p";
    const rankedEntries = buildEntries(participants);
    const byRank = [...rankedEntries].sort((a, b) => a.rank - b.rank);
    const topPlayer = byRank[0]?.player ?? "";
    const lastPlayer = byRank[byRank.length - 1]?.player ?? "";
    const yakumanCell = parseYakumanCell(yakumanRow?.[col], rankedEntries, fileName, gameNo);
    const noteKey = `${IMPORT_NOTE_PREFIX}:${fileName}:G${gameNo}`;
    const notes = yakumanCell.noteSuffix ? `${noteKey} 役満:${yakumanCell.noteSuffix}` : noteKey;

    games.push({
      sourceFile: fileName,
      gameNo,
      noteKey,
      row: {
        date: dateIso,
        game_type: gameType,
        player_count: participants.length,
        score_total: total,
        top_player: topPlayer,
        last_player: lastPlayer,
        tobi_player: null,
        tobashi_player: null,
        yakitori_players: "",
        yakitori_player_ids: null,
        notes,
        created_at: buildCreatedAt(dateIso, Number(gameNo)),
      },
      entries: rankedEntries,
      yakumans: yakumanCell.occurrences,
    });
  }

  return games;
}

async function collectCsvGames() {
  const fileNames = (await fs.readdir(DATA_DIR))
    .filter((name) => /^\d{8}\.csv$/i.test(name))
    .sort();

  if (fileNames.length === 0) {
    throw new Error(`No csv files found in ${DATA_DIR}`);
  }

  const allGames = [];
  for (const fileName of fileNames) {
    const content = await fs.readFile(path.join(DATA_DIR, fileName), "utf8");
    const games = parseCsvToGames(fileName, content);
    allGames.push(...games);
  }
  return allGames;
}

function buildPgInsert(tableName, rows, returningCols = []) {
  if (!rows || rows.length === 0) {
    return null;
  }

  const colSet = new Set();
  for (const row of rows) {
    for (const col of Object.keys(row)) {
      colSet.add(col);
    }
  }
  const cols = Array.from(colSet);

  const values = [];
  const tuples = rows.map((row, rowIndex) => {
    const placeholders = cols.map((col, colIndex) => {
      const paramIndex = rowIndex * cols.length + colIndex + 1;
      const raw = row[col] ?? null;
      values.push(raw && typeof raw === "object" ? JSON.stringify(raw) : raw);
      return `$${paramIndex}`;
    });
    return `(${placeholders.join(",")})`;
  });

  const qCols = cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",");
  const returning = returningCols.length > 0 ? ` RETURNING ${returningCols.join(",")}` : "";
  const text = `INSERT INTO ${tableName} (${qCols}) VALUES ${tuples.join(",")}${returning}`;

  return { text, values };
}

async function createDataStore({ supabaseUrl, supabaseKey, databaseUrl }) {
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    return {
      mode: "supabase",
      async close() {},
      async fetchPlayersByNames(names) {
        const { data, error } = await supabase.from("players").select("id,name").in("name", names);
        if (error) throw new Error(`players resolve error: ${JSON.stringify(error)}`);
        return data ?? [];
      },
      async fetchImportedGames() {
        const { data, error } = await supabase
          .from("games")
          .select("id,notes")
          .like("notes", `${IMPORT_NOTE_PREFIX}:%`);
        if (error) throw new Error(`existing games check error: ${JSON.stringify(error)}`);
        return data ?? [];
      },
      async insertGames(rows) {
        if (rows.length === 0) return [];
        const { data, error } = await supabase.from("games").insert(rows).select("id,notes");
        if (error) throw new Error(`insert error: ${JSON.stringify(error)}`);
        return data ?? [];
      },
      async fetchYakumansByGameIds(gameIds) {
        if (gameIds.length === 0) return [];
        const { data, error } = await supabase
          .from("yakuman_occurrences")
          .select("game_id,player_id,yakuman_code,yakuman_name,meta")
          .in("game_id", gameIds);
        if (error) throw new Error(`existing yakuman check error: ${JSON.stringify(error)}`);
        return data ?? [];
      },
      async insertYakumans(rows) {
        if (rows.length === 0) return;
        const { error } = await supabase.from("yakuman_occurrences").insert(rows);
        if (error) throw new Error(`yakuman insert error: ${JSON.stringify(error)}`);
      },
    };
  }

  if (databaseUrl) {
    const { Client } = await import("pg");
    const dbHost = (() => {
      try {
        return new URL(databaseUrl).hostname;
      } catch {
        return "";
      }
    })();
    const requiresSsl = !!dbHost && dbHost !== "localhost" && dbHost !== "127.0.0.1";

    const client = new Client({
      connectionString: databaseUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    });
    await client.connect();

    return {
      mode: "postgres",
      async close() {
        await client.end();
      },
      async fetchPlayersByNames(names) {
        const res = await client.query("SELECT id,name FROM public.players WHERE name = ANY($1::text[])", [names]);
        return res.rows;
      },
      async fetchImportedGames() {
        const res = await client.query("SELECT id,notes FROM public.games WHERE notes LIKE $1", [`${IMPORT_NOTE_PREFIX}:%`]);
        return res.rows;
      },
      async insertGames(rows) {
        if (rows.length === 0) return [];
        const built = buildPgInsert("public.games", rows, ["id", "notes"]);
        if (!built) return [];
        const res = await client.query(built.text, built.values);
        return res.rows;
      },
      async fetchYakumansByGameIds(gameIds) {
        if (gameIds.length === 0) return [];
        const res = await client.query(
          "SELECT game_id,player_id,yakuman_code,yakuman_name,meta FROM public.yakuman_occurrences WHERE game_id = ANY($1::bigint[])",
          [gameIds]
        );
        return res.rows;
      },
      async insertYakumans(rows) {
        if (rows.length === 0) return;
        const built = buildPgInsert("public.yakuman_occurrences", rows);
        if (!built) return;
        await client.query(built.text, built.values);
      },
    };
  }

  throw new Error("SUPABASE_URL + key もしくは DATABASE_URL を設定してください。");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envLocal = await loadLocalEnv();

  const SUPABASE_URL = process.env.SUPABASE_URL || envLocal.SUPABASE_URL;
  const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    envLocal.SUPABASE_SERVICE_ROLE_KEY ||
    envLocal.SUPABASE_ANON_KEY;
  const DATABASE_URL = process.env.DATABASE_URL || envLocal.DATABASE_URL;

  const store = await createDataStore({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    databaseUrl: DATABASE_URL,
  });

  console.log(`Connection mode: ${store.mode}`);

  try {
    const plannedGames = await collectCsvGames();

    const allNames = Array.from(
      new Set(
        plannedGames.flatMap((g) => g.entries.map((entry) => entry.player))
      )
    );

    const players = await store.fetchPlayersByNames(allNames);
    const nameToId = new Map((players ?? []).map((p) => [String(p.name), Number(p.id)]));
    const unresolved = allNames.filter((name) => !nameToId.has(name));
    if (unresolved.length > 0) {
      console.error("players テーブルに未登録の名前があります:", unresolved.join(", "));
      console.error("先に `npm run seed:players` を実行してください。");
      process.exit(1);
    }

    const existingRows = await store.fetchImportedGames();
    const existingByNoteKey = new Map();
    for (const row of existingRows ?? []) {
      const noteKey = extractImportNoteKey(row.notes);
      if (!noteKey) continue;
      if (!existingByNoteKey.has(noteKey)) {
        existingByNoteKey.set(noteKey, Number(row.id));
      }
    }

    const insertRows = [];
    const pendingGames = [];
    for (const game of plannedGames) {
      const existingGameId = existingByNoteKey.get(String(game.noteKey)) ?? null;
      if (existingGameId) {
        pendingGames.push({
          ...game,
          existingGameId,
        });
        continue;
      }

      const row = { ...game.row };
      for (const entry of game.entries) {
        row[`player${entry.slot}`] = entry.player;
        row[`player${entry.slot}_id`] = nameToId.get(entry.player) ?? null;
        row[`score${entry.slot}`] = entry.score;
        row[`rank${entry.slot}`] = entry.rank;
        row[`is_tobi${entry.slot}`] = false;
        row[`is_tobashi${entry.slot}`] = false;
        row[`is_yakitori${entry.slot}`] = false;
      }

      if (game.entries.length === 3) {
        row.player4 = null;
        row.player4_id = null;
        row.score4 = null;
        row.rank4 = null;
        row.is_tobi4 = false;
        row.is_tobashi4 = false;
        row.is_yakitori4 = false;
      }

      row.top_player_id = nameToId.get(String(row.top_player)) ?? null;
      row.last_player_id = nameToId.get(String(row.last_player)) ?? null;
      row.tobi_player_id = null;
      row.tobashi_player_id = null;

      insertRows.push(row);
      pendingGames.push({
        ...game,
        existingGameId: null,
      });
    }

    const total = plannedGames.length;
    const skipped = total - insertRows.length;
    console.log(`Planned games: ${total}`);
    console.log(`Skipped (already imported): ${skipped}`);
    console.log(`To insert: ${insertRows.length}`);

    const plannedYakumans = pendingGames.reduce((sum, game) => sum + game.yakumans.length, 0);
    console.log(`Planned yakuman occurrences: ${plannedYakumans}`);

    if (!args.apply) {
      console.log("Dry-run mode. Insert を実行するには --apply を付けてください。");
      return;
    }

    const insertedGames = await store.insertGames(insertRows);

    const gameIdByNotes = new Map();
    for (const row of existingRows ?? []) {
      gameIdByNotes.set(String(row.notes ?? ""), Number(row.id));
    }
    for (const row of insertedGames) {
      gameIdByNotes.set(String(row.notes ?? ""), Number(row.id));
    }

    const targetGames = pendingGames
      .map((game) => ({
        ...game,
        gameId: game.existingGameId ?? gameIdByNotes.get(String(game.row.notes)),
      }))
      .filter((game) => Number.isInteger(game.gameId));

    const gameIds = Array.from(new Set(targetGames.map((g) => Number(g.gameId))));
    const existingYakRows = await store.fetchYakumansByGameIds(gameIds);

    const existingYakKeys = new Set();
    for (const row of existingYakRows) {
      const metaRaw = row.meta;
      let meta = null;
      if (metaRaw && typeof metaRaw === "object") {
        meta = metaRaw;
      } else if (typeof metaRaw === "string") {
        try {
          meta = JSON.parse(metaRaw);
        } catch {
          meta = null;
        }
      }
      const importKey = meta && typeof meta === "object" && "import_key" in meta ? String(meta.import_key ?? "") : "";
      if (importKey) {
        existingYakKeys.add(importKey);
        continue;
      }
      existingYakKeys.add(`legacy:${row.game_id}:${row.player_id}:${row.yakuman_code}:${row.yakuman_name}`);
    }

    const yakumanInsertRows = [];
    for (const game of targetGames) {
      for (const yak of game.yakumans) {
        const playerId = nameToId.get(yak.playerName);
        if (!playerId) {
          throw new Error(`yakuman player id resolve failed: ${yak.playerName}`);
        }

        const importKey = yak.importKey;
        const legacyKey = `legacy:${game.gameId}:${playerId}:${yak.yakumanCode}:${yak.yakumanName}`;
        if (existingYakKeys.has(importKey) || existingYakKeys.has(legacyKey)) {
          continue;
        }

        yakumanInsertRows.push({
          game_id: Number(game.gameId),
          player_id: playerId,
          yakuman_code: yak.yakumanCode,
          yakuman_name: yak.yakumanName,
          points: yak.points,
          meta: {
            source: "csv-import",
            source_file: game.sourceFile,
            game_no: game.gameNo,
            import_key: importKey,
            raw: yak.raw,
          },
        });
        existingYakKeys.add(importKey);
      }
    }

    await store.insertYakumans(yakumanInsertRows);

    console.log(`Inserted: ${insertRows.length}`);
    console.log(`Inserted yakuman occurrences: ${yakumanInsertRows.length}`);
  } finally {
    await store.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});