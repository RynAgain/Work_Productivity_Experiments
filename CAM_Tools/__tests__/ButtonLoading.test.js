/**
 * @jest-environment jsdom
 */

describe('TmTheme -- setButtonLoading / clearButtonLoading', () => {
  let tmThemeExports;

  beforeEach(() => {
    // Clean DOM so the guard check passes
    const existing = document.getElementById('tm-theme-vars');
    if (existing) existing.remove();

    localStorage.clear();
    jest.resetModules();
    tmThemeExports = require('../JS/tm-theme.js');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.TmLog;
    delete window.TmTheme;
  });

  // ------------------------------------------------------------------
  //  Structural tests
  // ------------------------------------------------------------------
  test('setButtonLoading and clearButtonLoading are exported', () => {
    expect(typeof tmThemeExports.setButtonLoading).toBe('function');
    expect(typeof tmThemeExports.clearButtonLoading).toBe('function');
  });

  test('setButtonLoading and clearButtonLoading are on window.TmTheme', () => {
    expect(typeof window.TmTheme.setButtonLoading).toBe('function');
    expect(typeof window.TmTheme.clearButtonLoading).toBe('function');
  });

  // ------------------------------------------------------------------
  //  setButtonLoading behavior
  // ------------------------------------------------------------------
  describe('setButtonLoading', () => {
    test('disables the button and adds tm-btn-loading class', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Download';
      tmThemeExports.setButtonLoading(btn);
      expect(btn.disabled).toBe(true);
      expect(btn.classList.contains('tm-btn-loading')).toBe(true);
    });

    test('replaces innerHTML with spinner + default "Loading..." text', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Download';
      tmThemeExports.setButtonLoading(btn);
      expect(btn.innerHTML).toContain('tm-spinner');
      expect(btn.innerHTML).toContain('Loading...');
    });

    test('uses custom loading text when provided', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Submit';
      tmThemeExports.setButtonLoading(btn, 'Uploading...');
      expect(btn.innerHTML).toContain('Uploading...');
      expect(btn.innerHTML).not.toContain('Loading...');
    });

    test('stores original innerHTML in dataset', () => {
      const btn = document.createElement('button');
      btn.innerHTML = '<svg>icon</svg> Download Data';
      tmThemeExports.setButtonLoading(btn);
      expect(btn.dataset.tmOriginalHtml).toBe('<svg>icon</svg> Download Data');
    });

    test('stores original disabled state in dataset', () => {
      const btn = document.createElement('button');
      btn.disabled = false;
      tmThemeExports.setButtonLoading(btn);
      expect(btn.dataset.tmOriginalDisabled).toBe('false');

      // Button that was already disabled
      const btn2 = document.createElement('button');
      btn2.disabled = true;
      tmThemeExports.setButtonLoading(btn2);
      expect(btn2.dataset.tmOriginalDisabled).toBe('true');
    });

    test('does not overwrite stored original on double-call', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Original Text';
      tmThemeExports.setButtonLoading(btn, 'First...');
      tmThemeExports.setButtonLoading(btn, 'Second...');
      // Original should still be preserved from first call
      expect(btn.dataset.tmOriginalHtml).toBe('Original Text');
    });

    test('handles null button gracefully', () => {
      expect(() => tmThemeExports.setButtonLoading(null)).not.toThrow();
    });
  });

  // ------------------------------------------------------------------
  //  clearButtonLoading behavior
  // ------------------------------------------------------------------
  describe('clearButtonLoading', () => {
    test('restores original innerHTML', () => {
      const btn = document.createElement('button');
      btn.innerHTML = '<svg>icon</svg> Download Data';
      tmThemeExports.setButtonLoading(btn, 'Working...');
      tmThemeExports.clearButtonLoading(btn);
      expect(btn.innerHTML).toBe('<svg>icon</svg> Download Data');
    });

    test('removes tm-btn-loading class', () => {
      const btn = document.createElement('button');
      tmThemeExports.setButtonLoading(btn);
      expect(btn.classList.contains('tm-btn-loading')).toBe(true);
      tmThemeExports.clearButtonLoading(btn);
      expect(btn.classList.contains('tm-btn-loading')).toBe(false);
    });

    test('restores original disabled=false state', () => {
      const btn = document.createElement('button');
      btn.disabled = false;
      tmThemeExports.setButtonLoading(btn);
      expect(btn.disabled).toBe(true);
      tmThemeExports.clearButtonLoading(btn);
      expect(btn.disabled).toBe(false);
    });

    test('restores original disabled=true state', () => {
      const btn = document.createElement('button');
      btn.disabled = true;
      tmThemeExports.setButtonLoading(btn);
      tmThemeExports.clearButtonLoading(btn);
      expect(btn.disabled).toBe(true);
    });

    test('uses override text instead of restoring original when provided', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Download';
      tmThemeExports.setButtonLoading(btn, 'Working...');
      tmThemeExports.clearButtonLoading(btn, 'Done!');
      expect(btn.innerHTML).toBe('Done!');
    });

    test('cleans up dataset attributes after restore', () => {
      const btn = document.createElement('button');
      btn.innerHTML = 'Click';
      tmThemeExports.setButtonLoading(btn);
      tmThemeExports.clearButtonLoading(btn);
      expect(btn.dataset.tmOriginalHtml).toBeUndefined();
      expect(btn.dataset.tmOriginalDisabled).toBeUndefined();
    });

    test('handles null button gracefully', () => {
      expect(() => tmThemeExports.clearButtonLoading(null)).not.toThrow();
    });
  });

  // ------------------------------------------------------------------
  //  CSS injection
  // ------------------------------------------------------------------
  test('spinner CSS is injected via tm-theme-vars style element', () => {
    const styleEl = document.getElementById('tm-theme-vars');
    expect(styleEl).not.toBeNull();
    expect(styleEl.textContent).toContain('.tm-spinner');
    expect(styleEl.textContent).toContain('tm-spin');
    expect(styleEl.textContent).toContain('.tm-btn-loading');
  });
});
