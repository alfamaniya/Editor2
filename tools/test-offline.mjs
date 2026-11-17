import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('/tmp/editor2-playwright/package.json');
const { chromium } = require('playwright');

const fileUrl = pathToFileURL(path.resolve('dist/offline.html')).href;
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
  await page.waitForSelector('.monaco-editor', { timeout: 30000 });

  await page.locator('[data-engine="codemirror"]').click();
  await page.waitForSelector('.cm-editor', { timeout: 20000 });

  await page.locator('[data-engine="alfamaniya"]').click();
  await page.waitForSelector('.alfamaniya-editor', { timeout: 20000 });
  await page.locator('.alfamaniya-input').fill('<h1>Alfamaniya sync passed</h1>');
  const alfamaniyaValue = await page.evaluate(() => window.monaco.editor.getModels()[0].getValue());
  if (alfamaniyaValue !== '<h1>Alfamaniya sync passed</h1>') throw new Error('Alfamaniya model synchronization failed.');
  await page.locator('[data-engine="monaco"]').click();
  await page.waitForSelector('.monaco-editor', { timeout: 20000 });

  await page.evaluate(() => {
    const model = window.monaco.editor.getModels()[0];
    model.setValue('<!DOCTYPE html><html><body><h1>Offline preview passed</h1></body></html>');
  });
  await page.waitForFunction(() => {
    const frame = document.querySelector('#preview');
    return frame?.contentDocument?.querySelector('h1')?.textContent === 'Offline preview passed';
  }, { timeout: 10000 });

  await page.locator('[data-open-panel="left"]').click();
  await page.waitForSelector('#left-panel.is-open');

  if (externalRequests.length) {
    throw new Error('External network requests detected: ' + externalRequests.join(', '));
  }
  if (pageErrors.length) {
    throw new Error('Browser runtime errors: ' + pageErrors.join(' | '));
  }

  console.log('Offline smoke test passed: Monaco, CodeMirror, Alfamaniya, live preview, and panels work without network access.');
} finally {
  await browser.close();
}
