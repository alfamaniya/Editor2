export function initializeLive(container) {
  const preview = container.querySelector('#preview');
  let previewTimer;

  function update(code) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      preview.srcdoc =
        code.html +
        '<style>' + code.css + '</style>' +
        '<script>' + code.javascript + '</script>';
    }, 400);
  }

  return { update };
}
