import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const vendor = resolve(root, 'vendor');
const offline = resolve(root, 'offline');
const entry = resolve(here, 'src/codemirror-entry.js');

await mkdir(vendor, { recursive: true });
await mkdir(offline, { recursive: true });

// Keep the existing ESM build used by the online application.
await build({
  entryPoints: [entry],
  outfile: resolve(vendor, 'codemirror.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false
});

// Produce a classic-script bundle for the standalone offline folder.
// All CodeMirror packages and their transitive dependencies are embedded.
const offlineBuild = await build({
  entryPoints: [entry],
  outfile: resolve(offline, 'codemirror.js'),
  bundle: true,
  format: 'iife',
  globalName: 'Editor2CodeMirror',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  metafile: true
});

const output = await readFile(resolve(offline, 'codemirror.js'), 'utf8');
const externalRuntimeUrls = output.match(/https?:\/\/[^ ]+/gi) || [];
if (externalRuntimeUrls.length) {
  throw new Error('CodeMirror offline bundle contains URL-like runtime references: ' +
    [...new Set(externalRuntimeUrls)].join(', '));
}
if (!output.includes('EditorView') && !output.includes('EditorState')) {
  throw new Error('CodeMirror offline bundle appears incomplete.');
}

// Record the module inputs so the build log shows exactly what was embedded.
const inputs = Object.keys(offlineBuild.metafile.inputs);
console.log('Standalone CodeMirror bundle created in /offline/codemirror.js');
console.log(`Bundled ${inputs.length} source modules; output size: ${Buffer.byteLength(output)} bytes.`);
console.log('Runtime external URL references: 0');

// Keep the existing local Monaco vendor copy used by the online app.
const monacoSource = resolve(root, 'monaco/node_modules/monaco-editor/min/vs');
const monacoTarget = resolve(vendor, 'monaco/vs');
await rm(resolve(vendor, 'monaco'), { recursive: true, force: true });
await mkdir(resolve(vendor, 'monaco'), { recursive: true });
await cp(monacoSource, monacoTarget, { recursive: true });

console.log('Local editor libraries built in /vendor and /offline.');
