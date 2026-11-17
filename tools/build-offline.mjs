import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { build } = require('../codemirror/node_modules/esbuild');
const monacoRoot = path.join(root, 'monaco/node_modules/monaco-editor');
const outputDir = path.join(root, 'dist');
const read = relativePath => readFile(path.join(root, relativePath), 'utf8');

async function bundleWorker(entry) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [path.join(monacoRoot, 'esm', entry)],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    write: false
  });
  return result.outputFiles[0].text;
}

const [editorWorker, htmlWorker, cssWorker, tsWorker] = await Promise.all([
  bundleWorker('vs/editor/editor.worker.js'),
  bundleWorker('vs/language/html/html.worker.js'),
  bundleWorker('vs/language/css/css.worker.js'),
  bundleWorker('vs/language/typescript/ts.worker.js')
]);

const componentPaths = [
  'core/editor/editor.html',
  'core/live/live.html',
  'core/panels/panels.html'
];
const components = {};
for (const file of componentPaths) components['./' + file] = await read(file);

const workerPayload = JSON.stringify({
  editor: editorWorker,
  html: htmlWorker,
  css: cssWorker,
  typescript: tsWorker
});
const componentPayload = JSON.stringify(components);

const entry = `
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';

const workerSources = ${workerPayload};
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    let source = workerSources.editor;
    if (label === 'html' || label === 'handlebars' || label === 'razor') source = workerSources.html;
    else if (label === 'css' || label === 'scss' || label === 'less') source = workerSources.css;
    else if (label === 'javascript' || label === 'typescript') source = workerSources.typescript;
    const blob = new Blob([source], { type: 'text/javascript' });
    return new Worker(URL.createObjectURL(blob), { name: 'editor2-' + label });
  }
};
globalThis.monaco = monaco;
globalThis.__EDITOR2_OFFLINE_COMPONENTS = ${componentPayload};
await import('../app.js');
`;

const bundled = await build({
  absWorkingDir: root,
  stdin: {
    contents: entry,
    resolveDir: root,
    sourcefile: 'tools/offline-entry.js',
    loader: 'js'
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  write: false,
  nodePaths: [
    path.join(root, 'monaco/node_modules'),
    path.join(root, 'codemirror/node_modules')
  ]
});
const appBundle = bundled.outputFiles[0].text;

const cssFiles = [
  'style.css',
  'core/editor/editor.css',
  'core/live/live.css',
  'core/panels/panels.css'
];
const cssParts = [];
for (const file of cssFiles) cssParts.push(await read(file));

let monacoCss = await readFile(path.join(monacoRoot, 'min/vs/editor/editor.main.css'), 'utf8');
const codiconFont = await readFile(
  path.join(monacoRoot, 'min/vs/base/browser/ui/codicons/codicon/codicon.ttf')
);
const codiconData = codiconFont.toString('base64');
monacoCss = monacoCss.replace(
  /url\((['"]?)[^)]*codicon\.ttf(?:\?[^)]*)?\1\)/g,
  `url("data:font/ttf;base64,${codiconData}")`
);
cssParts.push(monacoCss);

let html = await read('index.html');
html = html
  .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
  .replace(/<script\b[^>]*src=["'][^"']*vendor\/monaco\/vs\/loader\.js["'][^>]*><\/script>/gi, '')
  .replace(/<script\b[^>]*type=["']module["'][^>]*src=["'][^"']*app\.js["'][^>]*><\/script>/gi, '');

const inlineCss = cssParts.join('\n').replace(/<\/style/gi, '<\\/style');
const safeBundle = appBundle.replace(/<\/script/gi, '<\\/script');
html = html.replace('</head>', `<style>\n${inlineCss}\n</style>\n</head>`);
html = html.replace('</body>', `<script>\n${safeBundle}\n</script>\n</body>`);

if (/<(?:script|link)\b[^>]*(?:src|href)=["'](?:https?:)?\/\//i.test(html)) {
  throw new Error('Offline build still contains an external script or stylesheet reference.');
}
if (!html.includes('MonacoEnvironment') || !html.includes('codicon')) {
  throw new Error('Offline build is missing Monaco runtime assets.');
}

await mkdir(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'offline.html');
await writeFile(outputPath, '<!DOCTYPE html>\n' + html, 'utf8');
const stats = await readFile(outputPath);
console.log(`Offline build created: ${outputPath} (${(stats.length / 1024 / 1024).toFixed(2)} MB)`);
