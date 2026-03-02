/**
 * @jest-environment jsdom
 */

describe('TmLog -- level-gated logging', () => {
  let tmThemeExports;
  const SETTINGS_KEY = 'cam_tools_settings';

  beforeEach(() => {
    // Clean DOM so the guard check passes
    const existing = document.getElementById('tm-theme-vars');
    if (existing) existing.remove();

    // Clean localStorage
    localStorage.clear();

    // Reset module cache so IIFE re-runs
    jest.resetModules();

    // Require fresh -- IIFE runs, sets window.TmLog and module.exports
    tmThemeExports = require('../JS/tm-theme.js');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.TmLog;
    delete window.TmTheme;
  });

  // ------------------------------------------------------------------
  //  Structural / smoke tests
  // ------------------------------------------------------------------
  test('module exports include TmLog object', () => {
    expect(tmThemeExports.TmLog).toBeDefined();
    expect(typeof tmThemeExports.TmLog.debug).toBe('function');
    expect(typeof tmThemeExports.TmLog.info).toBe('function');
    expect(typeof tmThemeExports.TmLog.warn).toBe('function');
    expect(typeof tmThemeExports.TmLog.error).toBe('function');
    expect(typeof tmThemeExports.TmLog.isDebug).toBe('function');
  });

  test('window.TmLog is set globally', () => {
    expect(window.TmLog).toBeDefined();
    expect(window.TmLog).toBe(tmThemeExports.TmLog);
  });

  test('_LOG_LEVELS are exported for testing', () => {
    expect(tmThemeExports._LOG_LEVELS).toEqual({
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      off: 4
    });
  });

  // ------------------------------------------------------------------
  //  debugMode OFF (default) -- debug messages suppressed
  // ------------------------------------------------------------------
  describe('when debugMode is OFF (default)', () => {
    test('isDebug() returns false', () => {
      expect(tmThemeExports.TmLog.isDebug()).toBe(false);
    });

    test('debug() does NOT call console.log', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.debug('[Test] should be suppressed');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    test('info() calls console.log', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.info('[Test] info message');
      expect(spy).toHaveBeenCalledWith('[Test] info message');
      spy.mockRestore();
    });

    test('warn() calls console.warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      tmThemeExports.TmLog.warn('[Test] warning');
      expect(spy).toHaveBeenCalledWith('[Test] warning');
      spy.mockRestore();
    });

    test('error() calls console.error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      tmThemeExports.TmLog.error('[Test] error');
      expect(spy).toHaveBeenCalledWith('[Test] error');
      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  //  debugMode ON -- all messages pass through
  // ------------------------------------------------------------------
  describe('when debugMode is ON', () => {
    beforeEach(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: true }));
    });

    test('isDebug() returns true', () => {
      expect(tmThemeExports.TmLog.isDebug()).toBe(true);
    });

    test('debug() calls console.log when debugMode is on', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.debug('[Test] debug message', { key: 'val' });
      expect(spy).toHaveBeenCalledWith('[Test] debug message', { key: 'val' });
      spy.mockRestore();
    });

    test('info() still calls console.log', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.info('[Test] info');
      expect(spy).toHaveBeenCalledWith('[Test] info');
      spy.mockRestore();
    });

    test('warn() still calls console.warn', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      tmThemeExports.TmLog.warn('[Test] warn');
      expect(spy).toHaveBeenCalledWith('[Test] warn');
      spy.mockRestore();
    });

    test('error() still calls console.error', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      tmThemeExports.TmLog.error('[Test] error');
      expect(spy).toHaveBeenCalledWith('[Test] error');
      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  //  Dynamic toggle -- responds to localStorage changes at call time
  // ------------------------------------------------------------------
  describe('dynamic toggle behavior', () => {
    test('switching debugMode ON at runtime enables debug output', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Off by default
      tmThemeExports.TmLog.debug('[Test] before toggle');
      expect(spy).not.toHaveBeenCalled();

      // Turn on
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: true }));
      tmThemeExports.TmLog.debug('[Test] after toggle');
      expect(spy).toHaveBeenCalledWith('[Test] after toggle');

      spy.mockRestore();
    });

    test('switching debugMode OFF at runtime suppresses debug output', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: true }));
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

      tmThemeExports.TmLog.debug('[Test] should appear');
      expect(spy).toHaveBeenCalledTimes(1);

      // Turn off
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: false }));
      tmThemeExports.TmLog.debug('[Test] should NOT appear');
      expect(spy).toHaveBeenCalledTimes(1); // still 1, no new call

      spy.mockRestore();
    });
  });

  // ------------------------------------------------------------------
  //  Edge cases
  // ------------------------------------------------------------------
  describe('edge cases', () => {
    test('handles corrupted localStorage gracefully (defaults to debugMode off)', () => {
      localStorage.setItem(SETTINGS_KEY, 'not-valid-json');
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.debug('[Test] corrupted storage');
      expect(spy).not.toHaveBeenCalled();
      expect(tmThemeExports.TmLog.isDebug()).toBe(false);
      spy.mockRestore();
    });

    test('handles missing settings key gracefully', () => {
      localStorage.removeItem(SETTINGS_KEY);
      expect(tmThemeExports.TmLog.isDebug()).toBe(false);
    });

    test('passes multiple arguments through to console', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: true }));
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      tmThemeExports.TmLog.debug('[Tag]', 'msg', 42, { a: 1 });
      expect(spy).toHaveBeenCalledWith('[Tag]', 'msg', 42, { a: 1 });
      spy.mockRestore();
    });

    test('_readDebugMode returns false when debugMode is not boolean true', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: 'yes' }));
      // 'yes' is truthy so !! makes it true
      expect(tmThemeExports._readDebugMode()).toBe(true);

      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: 0 }));
      expect(tmThemeExports._readDebugMode()).toBe(false);

      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ debugMode: null }));
      expect(tmThemeExports._readDebugMode()).toBe(false);

      localStorage.setItem(SETTINGS_KEY, JSON.stringify({}));
      expect(tmThemeExports._readDebugMode()).toBe(false);
    });
  });
});
