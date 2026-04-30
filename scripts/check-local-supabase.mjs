#!/usr/bin/env node
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

// Simple guard to prevent accidentally running dev against remote DB
const strict = process.argv.includes('--strict');
const url = process.env.SUPABASE_URL || process.env.DATABASE_URL || '';
const allow = /^(1|true)$/i.test(process.env.ALLOW_REMOTE_DB || '');

if (!url) {
  const message = 'SUPABASE_URL or DATABASE_URL is not set. Ensure you have a .env.local for local dev.';
  if (strict) {
    console.error(`Refusing to proceed: ${message}`);
    process.exit(1);
  }

  console.warn(`WARNING: ${message}`);
  // don't fail hard in non-strict mode — developer might rely on other flows
  process.exit(0);
}

const isLocal = /localhost|127\.0\.0\.1|::1/.test(url);

if (!isLocal && !allow) {
  console.error(`Refusing to proceed: SUPABASE_URL/DATABASE_URL appears remote: ${url}`);
  console.error('If you really want to use a remote DB for local development, set ALLOW_REMOTE_DB=1 (not recommended).');
  process.exit(1);
}

console.log('Local DB check passed. SUPABASE_URL/DATABASE_URL looks local.');
