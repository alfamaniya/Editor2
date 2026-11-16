const STORAGE_KEY = 'editor2-project-v1';

const starterCode = {
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Editor2</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Live preview is ready.</p>\n</body>\n</html>',
  css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n}\n\nh1 {\n  color: #2563eb;\n}',
  javascript: 'console.log("Editor2 is ready");'
};

function loadSavedCode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...starterCode, ...JSON.parse(saved) } : starterCode;
  } catch (error) {
    return starterCode;
  }
}

export function initializeEditor(container, onChange, onStatus) {
  const tabs = container.querySelectorAll('.tab');
  const editorHost = container.querySelector('#editor');
  const models = {};
  const savedCode = loadSavedCode();

  models.html = monaco.editor.createModel(savedCode.html, 'html');
  models.css = monaco.editor.createModel(savedCode.css, 'css');
  models.javascript = monaco.editor.createModel(savedCode.javascript, 'javascript');

  let activeLanguage = 'html';
  let activeEngine = 'monaco';
  let monacoEditor = null;
  let codeMirrorView = null;
  let codeMirrorModules = null;
  let saveTimer;

  function getCode() {
    return {
      html: models.html.getValue(),
      css: models.css.getValue(),
      javascript: models.javascript.getValue()
    };
  }

  function saveCode() {
    onStatus('Saving...');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getCode()));
      onStatus('Saved in browser');
    } catch (error) {
      onStatus('Unable to save');
    }
  }

  function scheduleSave() {
    onStatus('Unsaved changes');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCode, 1000);
  }

  Object.values(models).forEach(model => {
    model.onDidChangeContent(() => {
      onChange(getCode());
      scheduleSave();
    });
  });

  async function loadCodeMirror() {
    if (codeMirrorModules) return codeMirrorModules;
    const modules = await import('../../vendor/codemirror.js');
    codeMirrorModules = {
      basicSetup: modules.basicSetup,
      EditorView: modules.EditorView,
      theme: modules.oneDark,
      languages: {
        html: modules.html(),
        css: modules.css(),
        javascript: modules.javascript()
      }
    };
    return codeMirrorModules;
  }

  async function renderEditor() {
    if (monacoEditor) {
      monacoEditor.dispose();
      monacoEditor = null;
    }
    if (codeMirrorView) {
      codeMirrorView.destroy();
      codeMirrorView = null;
    }

    editorHost.replaceChildren();

    if (activeEngine === 'monaco') {
      monacoEditor = monaco.editor.create(editorHost, {
        model: models[activeLanguage],
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false
      });
      return;
    }

    const modules = await loadCodeMirror();
    codeMirrorView = new modules.EditorView({
      doc: models[activeLanguage].getValue(),
      extensions: [
        modules.basicSetup,
        modules.theme,
        modules.languages[activeLanguage],
        modules.EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const value = update.state.doc.toString();
            if (models[activeLanguage].getValue() !== value) {
              models[activeLanguage].setValue(value);
            }
          }
        })
      ],
      parent: editorHost
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      activeLanguage = tab.dataset.language;
      tabs.forEach(item => item.classList.toggle('active', item === tab));
      try {
        await renderEditor();
      } catch (error) {
        console.error('Unable to render editor:', error);
        onStatus('Editor failed to load');
      }
    });
  });

  onChange(getCode());
  onStatus('Saved in browser');

  renderEditor().catch(error => {
    console.error('Unable to initialize editor:', error);
    onStatus('Editor failed to load');
  });

  return {
    async setEngine(engine) {
      if (!['monaco', 'codemirror'].includes(engine) || engine === activeEngine) return;
      activeEngine = engine;
      try {
        await renderEditor();
      } catch (error) {
        console.error('Unable to switch editor:', error);
        activeEngine = 'monaco';
        await renderEditor();
        throw error;
      }
    }
  };
}
