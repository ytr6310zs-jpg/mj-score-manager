#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
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

const envLocal = await loadLocalEnv();
const SUPABASE_URL = process.env.SUPABASE_URL || envLocal.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  envLocal.SUPABASE_SERVICE_ROLE_KEY ||
  envLocal.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY のいずれかを設定してください');
  process.exit(1);
}

const PLAYERS = [
  '杉原',
  '沢尾望',
  '沢尾徹平',
  '山本有美',
  '横山',
  '前田',
  '村上',
  '田宮',
  '谷口',
  '加藤',
  '福本',
  '西村',
  '山本恭大',
  '長谷川彩未',
  '長谷川柊太',
  '太雅',
  '松原',
  '市川',
  '徳岡',
  '但田',
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: existingRows, error: selectError } = await supabase.from('players').select('name');
  if (selectError) {
    console.error('players 取得エラー:', selectError.message);
    process.exit(1);
  }

  const existingNames = new Set((existingRows ?? []).map((row) => String(row.name ?? '').trim()));
  const uniqueNames = Array.from(new Set(PLAYERS.map((name) => name.trim()).filter(Boolean)));
  const toInsert = uniqueNames.filter((name) => !existingNames.has(name));

  if (toInsert.length === 0) {
    console.log('新規プレーヤーはありません（全員登録済み）');
    return;
  }

  const payload = toInsert.map((name) => ({ name }));
  const { data, error: insertError } = await supabase.from('players').insert(payload).select('name');
  if (insertError) {
    console.error('players 追加エラー:', insertError.message);
    process.exit(1);
  }

  console.log(`追加完了: ${data?.length ?? toInsert.length} 件`);
  console.log('追加プレーヤー:', toInsert.join(', '));
}

main().catch((error) => {
  console.error('予期しないエラー:', error instanceof Error ? error.message : error);
  process.exit(1);
});
