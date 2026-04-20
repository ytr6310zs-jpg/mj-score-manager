#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

function isIgnored(fullPath) {
  return fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('.github/specs') || fullPath.includes('db-backups');
}

async function walk(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (isIgnored(full)) continue;
    if (e.isDirectory()) {
      await walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

const exts = new Set(['.md', '.ts', '.tsx', '.js', '.jsx', '.sql', '.json']);

async function main() {
  const allFiles = await walk(root);
  const files = allFiles.filter(f => exts.has(path.extname(f)));
  const resultFiles = [];

  for (const f of files) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    let content = '';
    try {
      content = await fs.readFile(f, 'utf8');
    } catch (e) {
      continue;
    }
    const obj = { path: rel, ext: path.extname(f), size: content.length };

    if (obj.ext === '.sql') {
      const tables = [...content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"]?([A-Za-z0-9_]+)/gi)].map(m => m[1]);
      if (tables.length) obj.tables = tables;
    }

    if (['.ts', '.tsx', '.js', '.jsx'].includes(obj.ext)) {
      const exports = [];
      for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) exports.push(m[1]);
      for (const m of content.matchAll(/export\s+const\s+([A-Za-z0-9_$]+)/g)) exports.push(m[1]);
      for (const m of content.matchAll(/export\s+default\s+function\s*([A-Za-z0-9_$]*)/g)) {
        if (m[1]) exports.push(m[1]); else exports.push('default');
      }
      const types = [...content.matchAll(/export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/g)].map(m => m[1]);
      if (exports.length) obj.exports = [...new Set(exports)];
      if (types.length) obj.types = types;
    }

    if (obj.ext === '.md') {
      const lines = content.split(/\r?\n/);
      const h1 = lines.find(l => l.startsWith('# '));
      if (h1) obj.title = h1.replace(/^#\s+/, '').trim();
    }

    resultFiles.push(obj);
  }

  // read package.json
  let packageJson = {};
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  } catch (e) {
    // ignore
  }

  const spec = {
    generatedAt: new Date().toISOString(),
    package: {
      name: packageJson.name || null,
      version: packageJson.version || null,
      scripts: packageJson.scripts || {},
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      engines: packageJson.engines || {}
    },
    files: resultFiles,
  };

  const outDir = path.join(root, '.github', 'specs');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'auto-extracted.json'), JSON.stringify(spec, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push('# Auto-extracted specs');
  mdLines.push('');
  mdLines.push(`Generated at: ${spec.generatedAt}`);
  mdLines.push('');

  mdLines.push('## Package');
  mdLines.push(`- name: ${spec.package.name || '-'} `);
  mdLines.push(`- version: ${spec.package.version || '-'} `);
  mdLines.push('');

  mdLines.push('## Scripts');
  const scripts = spec.package.scripts || {};
  if (Object.keys(scripts).length === 0) {
    mdLines.push('- (none)');
  } else {
    for (const k of Object.keys(scripts)) mdLines.push(`- ${k}: ${scripts[k]}`);
  }
  mdLines.push('');

  mdLines.push('## Tables (from SQL files)');
  const tableSet = new Set();
  for (const f of spec.files) if (f.tables) for (const t of f.tables) tableSet.add(t);
  if (tableSet.size === 0) mdLines.push('- (no CREATE TABLE statements found)');
  else for (const t of tableSet) mdLines.push(`- ${t}`);
  mdLines.push('');

  mdLines.push('## Exported functions / types (sample)');
  let sampleCount = 0;
  for (const f of spec.files.filter(x => x.exports || x.types)) {
    mdLines.push(`- ${f.path}`);
    if (f.exports) mdLines.push(`  - exports: ${f.exports.join(', ')}`);
    if (f.types) mdLines.push(`  - types: ${f.types.join(', ')}`);
    sampleCount++;
    if (sampleCount > 200) break;
  }

  await fs.writeFile(path.join(outDir, 'auto-extracted.md'), mdLines.join('\n'), 'utf8');

  console.log('Wrote .github/specs/auto-extracted.json and auto-extracted.md');
}

main().catch(err => { console.error(err); process.exit(1); });
