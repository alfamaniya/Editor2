export function initializeLive(container) {
  const preview = container.querySelector('#preview');
  let previewTimer;

  function renderPreview(code) {
    const source =
      code.html +
      '<style>' + code.css + '</style>' +
      '<script>' + code.javascript + '</script>';

    const parsed = new DOMParser().parseFromString(source, 'text/html');
    const previewDocument = preview.contentDocument;

    if (!previewDocument) return;

    const nextRoot = previewDocument.importNode(parsed.documentElement, true);
    previewDocument.replaceChild(nextRoot, previewDocument.documentElement);

    // Recreate scripts so inline and external JavaScript runs in the preview.
    previewDocument.querySelectorAll('script').forEach(oldScript => {
      const newScript = previewDocument.createElement('script');
      for (const attribute of oldScript.attributes) {
        newScript.setAttribute(attribute.name, attribute.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }

  function update(code) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => renderPreview(code), 400);
  }

  return { update };
}
