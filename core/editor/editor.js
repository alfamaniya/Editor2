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
  const models = {};
  const savedCode = loadSavedCode();

  models.html = monaco.editor.createModel(savedCode.html, 'html');
  models.css = monaco.editor.createModel(savedCode.css, 'css');
  models.javascript = monaco.editor.createModel(savedCode.javascript, 'javascript');

  const editor = monaco.editor.create(container.querySelector('#editor'), {
    model: models.html,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false
  });

  function getCode() {
    return {
      html: models.html.getValue(),
      css: models.css.getValue(),
      javascript: models.javascript.getValue()
    };
  }

  function saveCode() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getCode()));
      onStatus('Saved in browser');
    } catch (error) {
      onStatus('Unable to save');
    }
  }

  let saveTimer;
  function scheduleSave() {
    onStatus('Saving...');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCode, 300);
  }

  Object.values(models).forEach(model => {
    model.onDidChangeContent(() => {
      onChange(getCode());
      scheduleSave();
    });
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      editor.setModel(models[tab.dataset.language]);
      tabs.forEach(item => item.classList.toggle('active', item === tab));
    });
  });

  onChange(getCode());
  onStatus('Saved in browser');
}