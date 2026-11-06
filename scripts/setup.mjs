// One-command setup: npm run setup
// Installs dependencies, creates api/.env, creates the databases and loads demo
// data. Safe to run again: existing data is kept unless you pass --reset.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { apiDir, webDir, c, step, ok, warn, fail, run } from './lib.mjs';

const reset = process.argv.includes('--reset');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Node version
step('Checking Node.js');
const major = Number(process.versions.node.split('.')[0]);
if (major < 20)
  fail(`Node.js 20 or newer is required (you have ${process.versions.node}).`, [
    'Install it from https://nodejs.org or with nvm: nvm install 20',
  ]);
ok(`Node.js ${process.versions.node}`);

// 2. api/.env
step('Creating api/.env');
const envFile = path.join(apiDir, '.env');
if (fs.existsSync(envFile)) ok('api/.env already exists (kept as is)');
else {
  fs.copyFileSync(path.join(apiDir, '.env.example'), envFile);
  ok('Copied api/.env.example → api/.env');
}

// 3. Dependencies
for (const [name, dir] of [
  ['api', apiDir],
  ['web', webDir],
]) {
  step(`Installing ${name} dependencies`);
  await run(npm, ['install', '--no-audit', '--no-fund', '--loglevel=error'], dir);
  ok(`${name}/node_modules ready`);
}

// 4. Database
step('Checking PostgreSQL');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
apiRequire('dotenv').config({ path: envFile, quiet: true });
const { Client } = apiRequire('pg');
const databaseUrl =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/venue';
const target = new URL(databaseUrl);
const dbName = decodeURIComponent(target.pathname.slice(1)) || 'venue';
const testName = `${dbName}_test`;
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = '/postgres';

const server = new Client({ connectionString: adminUrl.toString() });
try {
  await server.connect();
} catch (err) {
  fail(`Could not connect to PostgreSQL at ${target.host} (${err.code || err.message}).`, [
    'Start PostgreSQL, then run `npm run setup` again. Options:',
    `  ${c.bold('Docker:')}  npm run db:docker          (Postgres 17 on port 5432, password "postgres")`,
    `  ${c.bold('macOS:')}   brew install postgresql@17 && brew services start postgresql@17`,
    `  ${c.bold('Other:')}   https://www.postgresql.org/download/`,
    '',
    `Using a different user, password or port? Edit DATABASE_URL in ${c.bold('api/.env')}.`,
  ]);
}
ok(`Connected to ${target.host}`);

let created = false;
for (const name of [dbName, testName]) {
  const { rowCount } = await server.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  if (rowCount) ok(`Database "${name}" exists`);
  else {
    await server.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
    ok(`Created database "${name}"`);
    if (name === dbName) created = true;
  }
}
await server.end();

// 5. Demo data: only when the database is new/empty, or with --reset.
step('Loading demo data');
const db = new Client({ connectionString: databaseUrl });
await db.connect();
const {
  rows: [{ exists }],
} = await db.query("SELECT to_regclass('public.venues') IS NOT NULL AS exists");
const venues = exists ? (await db.query('SELECT count(*)::int AS n FROM venues')).rows[0].n : 0;
await db.end();

if (created || reset || venues === 0) {
  await run(npm, ['run', 'seed', '--silent'], apiDir);
  ok('Seeded 6 demo venues and the admin account');
} else {
  warn(`Kept your existing data (${venues} venues). To wipe and reseed: npm run seed`);
}

// 6. Done
const adminEmail = process.env.ADMIN_EMAIL || 'admin@playspot.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
console.log(`
${c.green(c.bold('✔ Setup complete'))}

  Start everything:   ${c.bold('npm run dev')}

  Website       http://localhost:3000
  Admin panel   http://localhost:3000/admin   ${c.dim(`(${adminEmail} / ${adminPassword})`)}
  API docs      http://localhost:4000/api/docs
`);
