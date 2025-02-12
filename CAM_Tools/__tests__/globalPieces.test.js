import { injectStyles, overlayTemplate } from '../JS/globalPieces.js';

describe('globalPieces module', () => {
  beforeEach(() => {
    // Clear the head before each test to ensure a fresh start.
    document.head.innerHTML = '';
  });

  test('overlayTemplate returns markup containing provided content', () => {
    const content = '<p>Hello World</p>';
    const markup = overlayTemplate(content);
    expect(markup).toContain('class="overlay"');
    expect(markup).toContain(content);
  });

  test('injectStyles appends a style element to the document head', () => {
    injectStyles();
    const styleEl = document.querySelector('head style');
    expect(styleEl).not.toBeNull();
    expect(styleEl.innerHTML).toContain('.input-field');
    expect(styleEl.innerHTML).toContain('.button');
  });
});
