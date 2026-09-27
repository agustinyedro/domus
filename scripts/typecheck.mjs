// scripts/typecheck.mjs
// Corre `astro check` con un baseline de errores preexistentes:
// falla sólo si la cantidad de errores AUMENTA (evita regresiones sin
// bloquear por la deuda técnica legacy).
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const BASELINE_PATH = new URL('../typecheck.baseline.json', import.meta.url);
const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  : { errors: 0, hints: 0 };

const res = spawnSync('npx astro check', { shell: true, encoding: 'utf8' });
const out = `${res.stdout || ''}\n${res.stderr || ''}`.replace(/\u001b\[[0-9;]*m/g, '');

const num = (re) => {
  const m = out.match(re);
  return m ? Number(m[1]) : null;
};

const errors = num(/(\d+)\s+errors?/) ?? 0;
const hints = num(/(\d+)\s+hints?/) ?? 0;

if (errors > baseline.errors) {
  console.error(`\n✗ Typecheck: ${errors} errores (baseline ${baseline.errors}).`);
  console.error('  Aparecieron errores nuevos. Corregilos antes de subir:');
  console.error('    npx astro check\n');
  process.exit(1);
}

const mejora = errors < baseline.errors;
console.log(
  `✓ Typecheck: ${errors} errores (baseline ${baseline.errors})${mejora ? ' — mejoró, bajá el baseline' : ''}.`
);
console.log(`  hints: ${hints} · Deuda legacy tolerada hasta ${baseline.errors}.`);
process.exit(0);
