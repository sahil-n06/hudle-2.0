// Start the API and the website together: npm run dev
// Output is prefixed with [api] / [web]. Ctrl+C stops both.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { apiDir, webDir, c, fail } from './lib.mjs';

const missing = [
  [path.join(apiDir, '.env'), 'api/.env'],
  [path.join(apiDir, 'node_modules'), 'api/node_modules'],
  [path.join(webDir, 'node_modules'), 'web/node_modules'],
].filter(([p]) => !fs.existsSync(p));
if (missing.length)
  fail(`Not set up yet (missing ${missing.map(([, n]) => n).join(', ')}).`, [
    `Run ${c.bold('npm run setup')} first.`,
  ]);

const portFree = (port) =>
  new Promise((resolve) => {
    const srv = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => srv.close(() => resolve(true)))
      .listen(port);
  });
for (const port of [4000, 3000]) {
  if (!(await portFree(port)))
    fail(`Port ${port} is already in use. Is PlaySpot already running in another terminal?`, [
      `Find it:  lsof -i :${port}     Stop it: kill <PID>`,
    ]);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let stopping = false;

function start(name, dir, color) {
  const child = spawn(npm, ['run', 'dev'], {
    cwd: dir,
    env: { ...process.env, FORCE_COLOR: '1' },
    shell: process.platform === 'win32',
  });
  const prefix = color(`[${name}]`);
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) console.log(`${prefix} ${line}`);
    });
  }
  child.on('exit', (code) => {
    if (stopping) return;
    console.log(`${prefix} exited with code ${code}. Stopping everything.`);
    stop(code || 1);
  });
  children.push(child);
}

function stop(code = 0) {
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 500);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

console.log(`
${c.bold('PlaySpot dev')} ${c.dim('— Ctrl+C to stop')}
  Website       http://localhost:3000
  Admin panel   http://localhost:3000/admin
  API docs      http://localhost:4000/api/docs
`);
start('api', apiDir, c.magenta);
start('web', webDir, c.blue);
