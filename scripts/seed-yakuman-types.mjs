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

console.log('seed-yakuman-types: SUPABASE_URL present:', SUPABASE_URL ? 'YES' : 'NO');
console.log('seed-yakuman-types: key source:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'env:SERVICE_ROLE' : process.env.SUPABASE_ANON_KEY ? 'env:ANON' : envLocal.SUPABASE_SERVICE_ROLE_KEY ? 'envLocal:SERVICE_ROLE' : envLocal.SUPABASE_ANON_KEY ? 'envLocal:ANON' : 'none');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY のいずれかを設定してください');
  process.exit(1);
}

const YAKUMAN_TYPES = [
  { code: 'ST', name: '四暗刻単騎', points: 32000, description: '四暗刻単騎 (Su Anko Tanki)', sort_order: 22 },
  { code: 'KZ', name: '数え役満', points: 32000, description: '数え役満 (Kazoe Yakuman)', sort_order: 8 },
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: existingRows, error: selectError } = await supabase.from('yakuman_types').select('code');
  if (selectError) {
    console.error('yakuman_types 取得エラー:', selectError.message || selectError);
    process.exit(1);
  }

  const existingCodes = new Set((existingRows ?? []).map((r) => String(r.code ?? '').trim()));
  const toInsert = YAKUMAN_TYPES.filter((t) => !existingCodes.has(t.code));

  if (toInsert.length === 0) {
    console.log('新規役満種別はありません（全て登録済み）');
    return;
  }

  const { data, error: insertError } = await supabase.from('yakuman_types').insert(toInsert).select('code');
  if (insertError) {
    console.error('yakuman_types 追加エラー:', insertError.message || insertError);
    process.exit(1);
  }

  console.log(`追加完了: ${data?.length ?? toInsert.length} 件`);
}

main().catch((err) => {
  console.error('予期しないエラー:', err instanceof Error ? err.message : err);
  process.exit(1);
});
