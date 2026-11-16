import { initializeEditor } from './core/editor/editor.js';
import { initializeLive } from './core/live/live.js';

const editorContainer = document.getElementById('editor-component');
const liveContainer = document.getElementById('live-component');
const saveStatus = document.getElementById('save-status');
const engineButtons = document.querySelectorAll('.engine-button');

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
        vs: './vendor/monaco/vs'
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
    const editor = initializeEditor(
      editorContainer,
      code => live.update(code),
      status => { saveStatus.textContent = status; }
    );

    engineButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const engine = button.dataset.engine;
        if (button.classList.contains('active')) return;

        engineButtons.forEach(item => {
          item.classList.toggle('active', item === button);
          item.setAttribute('aria-pressed', String(item === button));
        });

        try {
          await editor.setEngine(engine);
        } catch (error) {
          engineButtons.forEach(item => {
            const active = item.dataset.engine === 'monaco';
            item.classList.toggle('active', active);
            item.setAttribute('aria-pressed', String(active));
          });
          saveStatus.textContent = 'Unable to switch editor';
          console.error('Editor switch failed:', error);
        }
      });
      button.setAttribute('aria-pressed', String(button.dataset.engine === 'monaco'));
    });
  } catch (error) {
    saveStatus.textContent = 'Unable to load Editor2';
    console.error('Editor2 startup failed:', error);
  }
}

startApp();