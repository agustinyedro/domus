// scripts/run-tests.mjs
// Descubre tests/**/*.test.ts (TS con node:test) y los corre vía tsx.
// Multiplataforma: no depende de la expansión de globs del shell.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const testsDir = join(root, 'tests');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.test\.ts$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(testsDir);
if (files.length === 0) {
  console.log('No hay tests (*.test.ts). Nada que correr.');
  process.exit(0);
}

console.log(`Corriendo ${files.length} test(s)…`);
const res = spawnSync('node', ['--import', 'tsx', '--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);
