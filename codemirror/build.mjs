import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const vendor = resolve(root, 'vendor');

await mkdir(vendor, { recursive: true });
await build({
  entryPoints: [resolve(here, 'src/codemirror-entry.js')],
  outfile: resolve(vendor, 'codemirror.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false
});

const monacoSource = resolve(root, 'monaco/node_modules/monaco-editor/min/vs');
const monacoTarget = resolve(vendor, 'monaco/vs');
await rm(resolve(vendor, 'monaco'), { recursive: true, force: true });
await mkdir(resolve(vendor, 'monaco'), { recursive: true });
await cp(monacoSource, monacoTarget, { recursive: true });

console.log('Local editor libraries built in /vendor.');
