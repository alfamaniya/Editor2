(function (global) {
  'use strict';

  function create(host, options) {
    const settings = options || {};
    const root = document.createElement('div');
    root.className = 'alfamaniya-editor';
    const gutter = document.createElement('div');
    gutter.className = 'alfamaniya-gutter';
    gutter.setAttribute('aria-hidden', 'true');
    const input = document.createElement('textarea');
    input.className = 'alfamaniya-input';
    input.spellcheck = false;
    input.autocapitalize = 'off';
    input.autocomplete = 'off';
    input.autocorrect = 'off';
    input.wrap = 'off';
    input.setAttribute('aria-label', 'Alfamaniya code editor');
    input.value = settings.value || '';
    root.append(gutter, input);
    host.replaceChildren(root);

    function updateGutter() {
      const count = Math.max(1, input.value.split('\n').length);
      gutter.textContent = Array.from({ length: count }, (_, i) => String(i + 1)).join('\n');
      gutter.scrollTop = input.scrollTop;
    }
    function emit() {
      updateGutter();
      if (typeof settings.onChange === 'function') settings.onChange(input.value);
    }
    input.addEventListener('input', emit);
    input.addEventListener('scroll', () => { gutter.scrollTop = input.scrollTop; });
    input.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.setRangeText('  ', start, end, 'end');
        emit();
        return;
      }
      if (event.key === 'Enter') {
        const start = input.selectionStart;
        const before = input.value.slice(0, start);
        const line = before.slice(before.lastIndexOf('\n') + 1);
        const indent = (line.match(/^\s*/) || [''])[0];
        const extra = /[({[：:]\s*$/.test(line) ? '  ' : '';
        event.preventDefault();
        input.setRangeText('\n' + indent + extra, start, input.selectionEnd, 'end');
        emit();
        return;
      }
      const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
      if (pairs[event.key] && input.selectionStart === input.selectionEnd) {
        const position = input.selectionStart;
        input.setRangeText(event.key + pairs[event.key], position, position, 'end');
        input.setSelectionRange(position + 1, position + 1);
        emit();
      }
    });
    updateGutter();
    return {
      getValue() { return input.value; },
      setValue(value) { input.value = value || ''; updateGutter(); },
      focus() { input.focus(); },
      destroy() { root.remove(); }
    };
  }

  global.Alfamaniya = Object.freeze({ create });
})(globalThis);
