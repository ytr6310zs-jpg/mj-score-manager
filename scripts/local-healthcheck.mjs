#!/usr/bin/env node
// Simple local healthcheck for main pages
const PORT = process.env.PORT || process.env.NEXT_PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const base = `http://${HOST}:${PORT}`;
const paths = ['/', '/matches', '/stats', '/admin'];

async function check(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

(async function main(){
  console.log('Checking', base);
  let failed = 0;
  for (const p of paths) {
    const url = base + p;
    process.stdout.write(`GET ${p} ... `);
    // wait a short moment between requests
    const r = await check(url);
    if (r.ok) {
      console.log(`OK (${r.status})`);
    } else {
      failed++;
      console.log(`FAIL ${r.status || ''} ${r.error || ''}`);
    }
  }
  if (failed) {
    console.error(`${failed} path(s) failed`);
    process.exit(2);
  }
  console.log('All checks passed');
  process.exit(0);
})();
