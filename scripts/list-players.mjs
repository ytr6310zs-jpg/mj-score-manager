#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY){
  console.error('SUPABASE_URL or SUPABASE key not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main(){
  const { data, error } = await supabase.from('players').select('name').order('name', { ascending: true });
  if (error){
    console.error('Select error:', error);
    process.exit(2);
  }
  console.log(`players count: ${ (data || []).length }`);
  console.log('sample:', (data || []).slice(0,30).map(r => r.name).join(', '));
}

main().catch(e=>{ console.error(e); process.exit(1); });
