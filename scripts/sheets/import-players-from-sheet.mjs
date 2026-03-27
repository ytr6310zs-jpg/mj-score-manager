#!/usr/bin/env node
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// 環境変数
// load .env.local if env not present (similar to scripts/seed-to-supabase.mjs)
async function loadLocalEnv(){
  try{
    const root = path.join(process.cwd());
    const content = await fs.readFile(path.join(root,'.env.local'),'utf8');
    const env = {};
    for(const line of content.split('\n')){
      const trimmed = line.trim();
      if(!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if(eq===-1) continue;
      let key = trimmed.slice(0,eq).trim();
      let val = trimmed.slice(eq+1).trim();
      if(val.startsWith('"') && val.endsWith('"')) val = val.slice(1,-1);
      env[key]=val;
    }
    return env;
  }catch(e){ return {}; }
}

const envLocal = await loadLocalEnv();

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || envLocal.GOOGLE_SPREADSHEET_ID;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || envLocal.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || envLocal.GOOGLE_PRIVATE_KEY;
const sheetTitle = process.env.PLAYER_MASTER_SHEET_TITLE || envLocal.PLAYER_MASTER_SHEET_TITLE || "プレイヤーマスタ";
const supabaseUrl = process.env.SUPABASE_URL || envLocal.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_ANON_KEY;

function exitWith(msg) {
  console.error(msg);
  process.exit(1);
}

if (!spreadsheetId || !serviceAccountEmail || !privateKeyRaw) {
  exitWith("Google Sheets 用の環境変数が不足しています。GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY を設定してください。");
}

if (!supabaseUrl || !supabaseKey) {
  exitWith("Supabase 用の環境変数が不足しています。SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY または SUPABASE_ANON_KEY を設定してください。");
}

const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

async function fetchSheetNames() {
  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[sheetTitle] ?? doc.sheetsByIndex[0];
  if (!sheet) {
    throw new Error("指定されたシートが見つかりません。シート名を確認してください。");
  }

  const rows = await sheet.getRows();
  const names = rows.map((r) => String(r.get("name") ?? "").trim()).filter(Boolean);
  return names;
}

async function importToSupabase(names) {
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // 既存のプレーヤーを取得
  const { data: existing, error: selectErr } = await supabase.from("players").select("name");
  if (selectErr) throw selectErr;

  const existingNames = new Set((existing ?? []).map((r) => String(r.name)));
  const uniqueNames = Array.from(new Set(names));
  const toInsert = uniqueNames.filter((n) => !existingNames.has(n));

  if (toInsert.length === 0) {
    console.log("新規プレーヤーはありません。処理を終了します。");
    return { inserted: 0 };
  }

  const rows = toInsert.map((name) => ({ name }));
  const { error: insertErr, data } = await supabase.from("players").insert(rows);
  if (insertErr) throw insertErr;

  return { inserted: data ? data.length : 0 };
}

(async function main() {
  try {
    console.log("Google Sheets からプレーヤー名を取得しています...");
    const names = await fetchSheetNames();
    console.log(`取得: ${names.length} 件`);

    console.log("Supabase にインポートしています...");
    const result = await importToSupabase(names);
    console.log(`完了: ${result.inserted} 件を挿入しました。`);
  } catch (err) {
    console.error("エラー:", err.message ?? err);
    process.exitCode = 2;
  }
})();
