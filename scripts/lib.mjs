import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const apiDir = path.join(root, 'api');
export const webDir = path.join(root, 'web');

const useColor = process.stdout.isTTY;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
export const c = {
  bold: paint(1),
  dim: paint(2),
  red: paint(31),
  green: paint(32),
  yellow: paint(33),
  blue: paint(34),
  magenta: paint(35),
};

export const step = (msg) => console.log(`\n${c.blue('▸')} ${c.bold(msg)}`);
export const ok = (msg) => console.log(`  ${c.green('✓')} ${msg}`);
export const warn = (msg) => console.log(`  ${c.yellow('!')} ${msg}`);
export function fail(msg, help = []) {
  console.error(`\n${c.red('✗')} ${c.bold(msg)}`);
  for (const line of help) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}

/** Run a command, streaming output. Resolves on exit code 0. */
export function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`)),
    );
  });
}
