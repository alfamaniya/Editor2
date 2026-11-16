export function initializePanels(container) {
  const panels = {
    left: container.querySelector('#left-panel'),
    right: container.querySelector('#right-panel')
  };
  const toggles = document.querySelectorAll('[data-open-panel]');
  const backdrop = container.querySelector('#panel-backdrop');

  function closeAll() {
    Object.entries(panels).forEach(([name, panel]) => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      document.querySelectorAll(`[data-open-panel="${name}"]`).forEach(button => {
        button.setAttribute('aria-expanded', 'false');
      });
    });
    backdrop.classList.remove('is-visible');
  }

  function open(name) {
    closeAll();
    const panel = panels[name];
    if (!panel) return;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.querySelectorAll(`[data-open-panel="${name}"]`).forEach(button => {
      button.setAttribute('aria-expanded', 'true');
    });
    backdrop.classList.add('is-visible');
  }

  toggles.forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.openPanel;
      const isOpen = panels[name]?.classList.contains('is-open');
      if (isOpen) closeAll();
      else open(name);
    });
  });

  container.querySelectorAll('[data-close-panel]').forEach(button => {
    button.addEventListener('click', closeAll);
  });
  backdrop.addEventListener('click', closeAll);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAll();
  });

  closeAll();
  return { closeAll, open };
}