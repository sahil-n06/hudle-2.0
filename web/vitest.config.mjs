import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Our components live in .js files, so tell esbuild to treat them as JSX.
export default defineConfig({
  esbuild: { loader: 'jsx', include: /\.(js|jsx)$/, exclude: [], jsx: 'automatic' },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { environment: 'jsdom', setupFiles: ['./test/setup.js'] },
});
