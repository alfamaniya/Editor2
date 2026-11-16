import { initializeEditor } from './core/editor/editor.js';
import { initializeLive } from './core/live/live.js';

const editorContainer = document.getElementById('editor-component');
const liveContainer = document.getElementById('live-component');
const saveStatus = document.getElementById('save-status');

async function loadComponent(container, path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load component: ${path} (${response.status})`);
  }
  container.innerHTML = await response.text();
}

function loadMonaco() {
  return new Promise((resolve, reject) => {
    if (!window.require) {
      reject(new Error('Monaco loader is unavailable'));
      return;
    }

    window.require.config({
      paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
      }
    });

    window.require(['vs/editor/editor.main'], resolve, reject);
  });
}

async function startApp() {
  try {
    await Promise.all([
      loadComponent(editorContainer, './core/editor/editor.html'),
      loadComponent(liveContainer, './core/live/live.html')
    ]);

    await loadMonaco();

    const live = initializeLive(liveContainer);
    initializeEditor(
      editorContainer,
      code => live.update(code),
      status => { saveStatus.textContent = status; }
    );
  } catch (error) {
    saveStatus.textContent = 'Unable to load Editor2';
    console.error('Editor2 startup failed:', error);
  }
}

startApp();