#!/usr/bin/env node
/**
 * Runs before the other npm commands. If packages are not installed yet
 * (the usual cause of "'tsx' is not recognized"), it installs them automatically.
 *   node scripts/ensure-deps.mjs          -> project tool + API + website
 *   node scripts/ensure-deps.mjs api|web  -> only that part
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  { key: 'root', name: 'project tools', dir: '.', marker: 'node_modules/concurrently' },
  { key: 'api', name: 'API', dir: 'services/api', marker: 'node_modules/tsx' },
  { key: 'web', name: 'website', dir: 'apps/web', marker: 'node_modules/next' },
];
const only = process.argv[2]; // "api" | "web" | undefined (= all)

for (const t of targets) {
  if (only && t.key !== only) continue;
  const dir = path.join(root, t.dir);
  if (fs.existsSync(path.join(dir, t.marker))) continue;

  console.log(`\n→ The ${t.name} packages are not installed yet. Installing them now (this can take a few minutes)…\n`);
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n✖ Installing the ${t.name} packages failed. Check your internet connection, then run:  npm run setup\n`);
    process.exit(1);
  }
}
