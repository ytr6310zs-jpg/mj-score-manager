#!/usr/bin/env node
// Simple guard to prevent accidentally running dev against remote DB
const url = process.env.SUPABASE_URL || process.env.DATABASE_URL || '';
const allow = /^(1|true)$/i.test(process.env.ALLOW_REMOTE_DB || '');

if (!url) {
  console.warn('WARNING: SUPABASE_URL or DATABASE_URL is not set. Ensure you have a .env.local for local dev.');
  // don't fail hard here — developer might rely on other flows
  process.exit(0);
}

const isLocal = /localhost|127\.0\.0\.1|::1/.test(url);

if (!isLocal && !allow) {
  console.error(`Refusing to proceed: SUPABASE_URL/DATABASE_URL appears remote: ${url}`);
  console.error('If you really want to use a remote DB for local development, set ALLOW_REMOTE_DB=1 (not recommended).');
  process.exit(1);
}

console.log('Local DB check passed. SUPABASE_URL/DATABASE_URL looks local.');
