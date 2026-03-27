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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function signatureForRow(row){
  const copy = { ...row };
  delete copy.id;
  delete copy.created_at;
  const keys = Object.keys(copy).sort();
  const obj = {};
  for(const k of keys){ obj[k] = copy[k] === undefined ? null : copy[k]; }
  return JSON.stringify(obj);
}

async function main(){
  console.log('Fetching all rows from `games`...');
  const { data: rows, error } = await supabase.from('games').select('*');
  if (error){ console.error('Failed to fetch games:', error); process.exit(1); }
  if (!rows || rows.length === 0){ console.log('No rows found in `games`.'); return; }

  const existingCreated = new Set(rows.map(r => String(r.created_at ?? '')));
  const byCreated = new Map();
  for(const r of rows){ const ca = String(r.created_at ?? ''); if(!byCreated.has(ca)) byCreated.set(ca, []); byCreated.get(ca).push(r); }

  const idsToDelete = [];
  const updates = [];

  for(const [createdAt, group] of byCreated.entries()){
    if (group.length <= 1) continue;
    const sigMap = new Map();
    for(const r of group){ const sig = signatureForRow(r); if(!sigMap.has(sig)) sigMap.set(sig, []); sigMap.get(sig).push(r); }

    for(const [sig, items] of sigMap.entries()){
      if (items.length > 1){ const [, ...dups] = items; for(const d of dups){ idsToDelete.push(d.id); existingCreated.delete(String(d.created_at ?? '')); } sigMap.set(sig, [items[0]]); }
    }

    const remaining = [];
    for(const items of sigMap.values()) remaining.push(...items);
    if (remaining.length <= 1) continue;

    remaining.sort((a,b) => (a.id || 0) - (b.id || 0));
    const baseMs = createdAt ? new Date(createdAt).getTime() : Date.now();

    for(let i = 1; i < remaining.length; i++){
      let candidateMs = baseMs + i * 1000;
      let candidateIso = new Date(candidateMs).toISOString();
      while(existingCreated.has(candidateIso)){ candidateMs += 1000; candidateIso = new Date(candidateMs).toISOString(); }
      updates.push({ id: remaining[i].id, created_at: candidateIso });
      existingCreated.add(candidateIso);
    }
  }

  if (idsToDelete.length > 0){ console.log('Deleting', idsToDelete.length, 'exact duplicate rows...'); const { error: delErr } = await supabase.from('games').delete().in('id', idsToDelete); if (delErr){ console.error('Delete error:', delErr); process.exit(1); } } else { console.log('No exact duplicate rows to delete.'); }

  if (updates.length > 0){ console.log('Updating', updates.length, 'rows to make created_at unique...'); for(const u of updates){ const { error: upErr } = await supabase.from('games').update({ created_at: u.created_at }).eq('id', u.id); if (upErr){ console.error('Update error for id', u.id, upErr); process.exit(1); } console.log('Updated id', u.id, '->', u.created_at); } } else { console.log('No created_at updates required.'); }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
