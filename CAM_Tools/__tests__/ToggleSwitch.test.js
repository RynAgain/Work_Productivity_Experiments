/**
 * @jest-environment jsdom
 */

/**
 * ToggleSwitch.test.js
 * ---------------------
 * Regression tests for the tm-toggle CSS component in tm-theme.js.
 *
 * Bug: Two competing .tm-toggle CSS blocks existed -- an orphaned
 * "button-style" block (using .active class + ::after pseudo-element)
 * and the correct "checkbox-style" block (using hidden input +
 * .tm-toggle-slider span). The orphan applied conflicting background,
 * border-radius, and a duplicate knob pseudo-element, causing the
 * Settings.js auto-check toggle to render as a broken red pill.
 *
 * Fix: Removed the orphaned button-style block, keeping only the
 * checkbox-based toggle pattern.
 */

describe('tm-toggle CSS -- no duplicate definitions', () => {
  let tmThemeExports;
  let styleContent;

  beforeEach(() => {
    // Clean DOM so the guard check passes
    const existing = document.getElementById('tm-theme-vars');
    if (existing) existing.remove();

    localStorage.clear();
    jest.resetModules();
    tmThemeExports = require('../JS/tm-theme.js');

    const styleEl = document.getElementById('tm-theme-vars');
    styleContent = styleEl ? styleEl.textContent : '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.TmLog;
    delete window.TmTheme;
  });

  // ------------------------------------------------------------------
  //  Orphaned button-style toggle must NOT be present
  // ------------------------------------------------------------------
  test('does NOT contain .tm-toggle.active rule (orphaned button-style)', () => {
    expect(styleContent).not.toMatch(/\.tm-toggle\.active\s*\{/);
  });

  test('does NOT contain .tm-toggle.active::after rule (orphaned knob)', () => {
    expect(styleContent).not.toMatch(/\.tm-toggle\.active::after\s*\{/);
  });

  test('does NOT apply ::after pseudo-element directly on .tm-toggle', () => {
    // The correct pattern uses .tm-toggle-slider::before, not .tm-toggle::after
    expect(styleContent).not.toMatch(/\.tm-toggle::after\s*\{/);
  });

  // ------------------------------------------------------------------
  //  Correct checkbox-based toggle MUST be present
  // ------------------------------------------------------------------
  test('contains .tm-toggle base rule with display: inline-block', () => {
    expect(styleContent).toMatch(/\.tm-toggle\s*\{[^}]*display:\s*inline-block/);
  });

  test('contains .tm-toggle input rule hiding the checkbox', () => {
    expect(styleContent).toMatch(/\.tm-toggle\s+input\s*\{[^}]*opacity:\s*0/);
  });

  test('contains .tm-toggle-slider base rule', () => {
    expect(styleContent).toMatch(/\.tm-toggle-slider\s*\{/);
  });

  test('contains .tm-toggle-slider::before rule for the knob', () => {
    expect(styleContent).toMatch(/\.tm-toggle-slider::before\s*\{/);
  });

  test('contains .tm-toggle input:checked + .tm-toggle-slider rule for active state', () => {
    expect(styleContent).toMatch(
      /\.tm-toggle\s+input:checked\s*\+\s*\.tm-toggle-slider\s*\{/
    );
  });

  test('checked slider uses accent-primary background', () => {
    expect(styleContent).toMatch(
      /\.tm-toggle\s+input:checked\s*\+\s*\.tm-toggle-slider\s*\{[^}]*background:\s*var\(--tm-accent-primary\)/
    );
  });

  test('contains .tm-toggle input:checked + .tm-toggle-slider::before rule for knob translation', () => {
    expect(styleContent).toMatch(
      /\.tm-toggle\s+input:checked\s*\+\s*\.tm-toggle-slider::before\s*\{[^}]*transform:\s*translateX\(16px\)/
    );
  });

  test('contains focus-visible ring on slider', () => {
    expect(styleContent).toMatch(
      /\.tm-toggle\s+input:focus-visible\s*\+\s*\.tm-toggle-slider\s*\{/
    );
  });

  // ------------------------------------------------------------------
  //  Only ONE .tm-toggle { ... } block should exist
  // ------------------------------------------------------------------
  test('defines .tm-toggle { exactly once (no duplicate blocks)', () => {
    // Match standalone .tm-toggle { (not .tm-toggle-slider, not .tm-toggle input, etc.)
    const matches = styleContent.match(/\.tm-toggle\s*\{/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(1);
  });
});

describe('Settings.js toggle HTML structure', () => {
  beforeEach(() => {
    // Clean DOM
    const existing = document.getElementById('tm-theme-vars');
    if (existing) existing.remove();
    document.body.innerHTML = '';

    localStorage.clear();
    jest.resetModules();

    // tm-theme must load first (provides TmTheme global)
    require('../JS/tm-theme.js');

    // Add nav bar buttons that Settings.js expects
    ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton'].forEach(id => {
      const btn = document.createElement('button');
      btn.id = id;
      document.body.appendChild(btn);
    });

    require('../JS/Settings.js');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.TmTheme;
    delete window.TmLog;
  });

  test('settings panel exists in the DOM', () => {
    const settingsBtn = document.getElementById('settings-btn');
    expect(settingsBtn).not.toBeNull();
  });

  test('clicking settings button opens the panel with toggle elements', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    // Find autoCheckUpdates toggle
    const autoCheckInput = document.getElementById('autoCheckUpdates');
    expect(autoCheckInput).not.toBeNull();
    expect(autoCheckInput.type).toBe('checkbox');
  });

  test('autoCheckUpdates toggle uses tm-toggle wrapper + tm-toggle-slider pattern', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    const autoCheckInput = document.getElementById('autoCheckUpdates');
    // Parent should be a span with class tm-toggle
    const toggleWrapper = autoCheckInput.parentElement;
    expect(toggleWrapper.tagName.toLowerCase()).toBe('span');
    expect(toggleWrapper.classList.contains('tm-toggle')).toBe(true);

    // Sibling should be the slider span
    const slider = autoCheckInput.nextElementSibling;
    expect(slider).not.toBeNull();
    expect(slider.classList.contains('tm-toggle-slider')).toBe(true);
  });

  test('debugMode toggle uses tm-toggle wrapper + tm-toggle-slider pattern', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    const debugInput = document.getElementById('debugMode');
    expect(debugInput).not.toBeNull();
    expect(debugInput.type).toBe('checkbox');

    const toggleWrapper = debugInput.parentElement;
    expect(toggleWrapper.classList.contains('tm-toggle')).toBe(true);

    const slider = debugInput.nextElementSibling;
    expect(slider).not.toBeNull();
    expect(slider.classList.contains('tm-toggle-slider')).toBe(true);
  });

  test('autoCheckUpdates toggle does NOT use .active class pattern', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    const autoCheckInput = document.getElementById('autoCheckUpdates');
    const toggleWrapper = autoCheckInput.parentElement;
    // The wrapper should never have an "active" class -- state is driven by :checked
    expect(toggleWrapper.classList.contains('active')).toBe(false);
  });

  test('toggling autoCheckUpdates changes checked state', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    const autoCheckInput = document.getElementById('autoCheckUpdates');
    const initialState = autoCheckInput.checked;

    // Simulate toggle
    autoCheckInput.checked = !initialState;
    autoCheckInput.dispatchEvent(new Event('change'));

    // Re-open settings to verify persistence
    settingsBtn.click(); // close
    settingsBtn.click(); // reopen

    const reopenedInput = document.getElementById('autoCheckUpdates');
    expect(reopenedInput.checked).toBe(!initialState);
  });

  test('toggling debugMode changes checked state', () => {
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.click();

    const debugInput = document.getElementById('debugMode');
    const initialState = debugInput.checked;

    debugInput.checked = !initialState;
    debugInput.dispatchEvent(new Event('change'));

    settingsBtn.click();
    settingsBtn.click();

    const reopenedInput = document.getElementById('debugMode');
    expect(reopenedInput.checked).toBe(!initialState);
  });
});
