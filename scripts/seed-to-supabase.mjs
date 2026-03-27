#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// load .env.local if env not present
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
const SUPABASE_URL = process.env.SUPABASE_URL || envLocal.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const SAMPLE_GAMES = [
  { date: '2026-03-01', game_type: '4p', player_count: 4, player1: '杉原', score1: 45, rank1:1, is_tobi1:false, is_tobashi1:true, is_yakitori1:false, player2:'横山', score2:12, rank2:2, is_tobi2:false, is_tobashi2:false, is_yakitori2:false, player3:'前田', score3:-20, rank3:3, is_tobi3:false, is_tobashi3:false, is_yakitori3:false, player4:'村上', score4:-37, rank4:4, is_tobi4:true, is_tobashi4:false, is_yakitori4:false, score_total:0, top_player:'杉原', last_player:'村上', tobi_player:'村上', tobashi_player:'杉原', yakitori_players:'', notes:'サンプルデータ1', created_at:'2026-03-01T10:00:00.000Z' },
  { date: '2026-03-05', game_type: '4p', player_count: 4, player1: '田宮', score1:65, rank1:1, is_tobi1:false, is_tobashi1:false, is_yakitori1:false, player2:'谷口', score2:5, rank2:2, is_tobi2:false, is_tobashi2:false, is_yakitori2:false, player3:'加藤', score3:-15, rank3:3, is_tobi3:false, is_tobashi3:false, is_yakitori3:false, player4:'福本', score4:-55, rank4:4, is_tobi4:false, is_tobashi4:false, is_yakitori4:true, score_total:0, top_player:'田宮', last_player:'福本', tobi_player:null, tobashi_player:null, yakitori_players:'福本', notes:'サンプルデータ2', created_at:'2026-03-05T14:30:00.000Z' },
  { date: '2026-03-10', game_type: '4p', player_count: 4, player1: '西村', score1:38, rank1:1, is_tobi1:false, is_tobashi1:true, is_yakitori1:false, player2:'沢尾望', score2:20, rank2:2, is_tobi2:false, is_tobashi2:false, is_yakitori2:false, player3:'沢尾徹平', score3:-8, rank3:3, is_tobi3:false, is_tobashi3:false, is_yakitori3:true, player4:'山本有美', score4:-50, rank4:4, is_tobi4:true, is_tobashi4:false, is_yakitori4:false, score_total:0, top_player:'西村', last_player:'山本有美', tobi_player:'山本有美', tobashi_player:'西村', yakitori_players:'沢尾徹平', notes:'サンプルデータ3', created_at:'2026-03-10T19:00:00.000Z' },
];

async function main(){
  console.log('Inserting', SAMPLE_GAMES.length, 'sample rows to Supabase `games` table...');
  for (const g of SAMPLE_GAMES){
    const { data, error } = await supabase.from('games').insert([g]);
    if (error){
      console.error('Insert error:', error);
      process.exit(1);
    }
    console.log('Inserted:', g.created_at);
  }
  console.log('Done');
}

main().catch(e=>{ console.error(e); process.exit(1); });
