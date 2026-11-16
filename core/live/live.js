export function initializeLive(container) {
  const preview = container.querySelector('#preview');

  function update(code) {
    preview.srcdoc =
      code.html +
      '<style>' + code.css + '</style>' +
      '<script>' + code.javascript + '</script>';
  }

  return { update };
}