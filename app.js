    const preview = document.getElementById('preview');
    const tabs = document.querySelectorAll('.tab');
    const saveStatus = document.getElementById('save-status');
    const STORAGE_KEY = 'editor2-project-v1';
    let editor;
    let saveTimer;

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

    function saveCode() {
      try {
        const data = {
          html: models.html.getValue(),
          css: models.css.getValue(),
          javascript: models.javascript.getValue()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        saveStatus.textContent = 'Saved in browser';
      } catch (error) {
        saveStatus.textContent = 'Unable to save';
      }
    }

    function scheduleSave() {
      saveStatus.textContent = 'Saving...';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveCode, 300);
    }

    const models = {};

    function updatePreview() {
      const html = models.html.getValue();
      const css = models.css.getValue();
      const javascript = models.javascript.getValue();

      preview.srcdoc =
        html +
        '<style>' + css + '</style>' +
        '<script>' + javascript + '</script>';
    }

    require.config({
      paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
      }
    });

    require(['vs/editor/editor.main'], function () {
      const savedCode = loadSavedCode();

      models.html = monaco.editor.createModel(savedCode.html, 'html');
      models.css = monaco.editor.createModel(savedCode.css, 'css');
      models.javascript = monaco.editor.createModel(savedCode.javascript, 'javascript');

      editor = monaco.editor.create(document.getElementById('editor'), {
        model: models.html,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false
      });

      Object.values(models).forEach(function (model) {
        model.onDidChangeContent(function () {
          updatePreview();
          scheduleSave();
        });
      });

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          editor.setModel(models[tab.dataset.language]);
          tabs.forEach(function (item) {
            item.classList.toggle('active', item === tab);
          });
        });
      });

      updatePreview();
      saveStatus.textContent = 'Saved in browser';
    });
