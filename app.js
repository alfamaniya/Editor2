import { initializeEditor } from './core/editor/editor.js';
import { initializeLive } from './core/live/live.js';

const editorContainer = document.getElementById('editor-component');
const liveContainer = document.getElementById('live-component');
const saveStatus = document.getElementById('save-status');

async function loadComponent(container, path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load component: ${path}`);
  }
  container.innerHTML = await response.text();
}

async function startApp() {
  try {
    await Promise.all([
      loadComponent(editorContainer, './core/editor/editor.html'),
      loadComponent(liveContainer, './core/live/live.html')
    ]);

    const live = initializeLive(liveContainer);
    initializeEditor(
      editorContainer,
      code => live.update(code),
      status => { saveStatus.textContent = status; }
    );
  } catch (error) {
    saveStatus.textContent = 'Unable to load Editor2';
    console.error(error);
  }
}

startApp();