import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/tmp/editor2-playwright/package.json');
const { chromium } = require('playwright');
const fileUrl = pathToFileURL(path.resolve('offline/index.html')).href;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const externalRequests = [];
const pageErrors = [];

page.on('request', request => {
  if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
});
page.on('pageerror', error => pageErrors.push(error.message));

try {
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.monaco?.editor?.create, { timeout: 30000 });
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'monaco-offline-test';
    host.style.width = '900px';
    host.style.height = '500px';
    document.body.appendChild(host);
    const editor = window.monaco.editor.create(host, {
      value: 'const offline = true;\\nconsole.log(offline);',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true
    });
    window.__monacoOfflineTestEditor = editor;
  });
  await page.waitForSelector('#monaco-offline-test .monaco-editor', { timeout: 20000 });
  const value = await page.evaluate(() => window.__monacoOfflineTestEditor.getValue());
  if (!value.includes('const offline = true')) throw new Error('Monaco editor content check failed.');
  if (externalRequests.length) throw new Error('External network requests detected: ' + externalRequests.join(', '));
  if (pageErrors.length) throw new Error('Browser runtime errors: ' + pageErrors.join(' | '));
  console.log('Standalone Monaco bundle passed: editor initialized and no external network requests were made.');
} finally {
  await browser.close();
}
