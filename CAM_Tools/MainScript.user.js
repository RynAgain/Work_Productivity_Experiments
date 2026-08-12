// ==UserScript==
// @name         CAM_Admin_Tools
// @namespace    http://tampermonkey.net/
// @version      4.0.2
// @description  CAM admin tool suite for WFM CAM (bundled build)
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        GM_xmlhttpRequest
// @connect      grocerycentral.amazon.dev
// @connect      tamarin.aces.amazon.dev
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js
// @require      https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js
// @run-at       document-end
// @updateURL    https://tamarin.aces.amazon.dev/scripts/cam-admin-tools/install.user.js
// @downloadURL  https://tamarin.aces.amazon.dev/scripts/cam-admin-tools/install.user.js
// ==/UserScript==

/* ================================================================
 * MODULE: tm-theme.js
 * ================================================================ */
try {
/**
 * tm-theme.js -- Shared CSS Variable Injector & Theme Engine
 * -----------------------------------------------------------
 * Injects the --tm-* design-token block defined in Anti-AI_Style-Guide.md
 * into <head> exactly once, before any module renders.
 *
 * Also provides:
 *   - Accent theme toggle (blue / red / green) persisted via localStorage
 *   - A one-shot style-tag helper other modules can reuse
 *   - A shared toast notification primitive (replaces alert())
 *   - TmLog: level-gated logging (debug/info/warn/error) controlled by Settings.debugMode
 *
 * Load order: this file MUST be @require'd BEFORE all other CAM_Tools modules.
 */
(function () {
  'use strict';

  // ----------------------------------------------------------------
  //  GUARD: inject only once
  // ----------------------------------------------------------------
  if (document.getElementById('tm-theme-vars')) return;

  // ----------------------------------------------------------------
  //  ACCENT THEMES
  // ----------------------------------------------------------------
  const ACCENT_THEMES = {
    blue:   { label: 'Blue',   primary: '#3ea6ff', hover: '#65b8ff' },
    red:    { label: 'Red',    primary: '#ff0000', hover: '#ff3333' },
    green:  { label: 'WFM',    primary: '#00a650', hover: '#2ebe6a' },
    purple: { label: 'Purple', primary: '#a970ff', hover: '#bd8dff' },
    orange: { label: 'Orange', primary: '#ff8a00', hover: '#ffa133' },
    pink:   { label: 'Pink',   primary: '#ff5c8a', hover: '#ff7da1' },
    teal:   { label: 'Teal',   primary: '#00bcd4', hover: '#33c9dd' },
    gold:   { label: 'Gold',   primary: '#f2b01e', hover: '#f5c04b' },
    mono:   { label: 'Mono',   primary: '#e0e0e0', hover: '#ffffff' }
  };

  const HEX_RE = /^#[0-9a-fA-F]{6}$/;

  /** Mix a hex color toward white (for derived hover shades). */
  function lighten(hex, amt) {
    if (!HEX_RE.test(hex)) return hex;
    const f = typeof amt === 'number' ? amt : 0.18;
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.min(255, Math.round(c + (255 - c) * f));
    const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /** Stored custom accent hex (settings.accentCustom), or null. */
  function readCustomHex() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return HEX_RE.test(settings.accentCustom) ? settings.accentCustom : null;
    } catch {
      return null;
    }
  }

  /** Resolve an accent name ('custom' included) to {primary, hover}. */
  function resolveAccentColors(accent) {
    if (accent === 'custom') {
      const hex = readCustomHex();
      if (hex) return { primary: hex, hover: lighten(hex) };
    }
    return ACCENT_THEMES[accent] || ACCENT_THEMES.blue;
  }

  const SETTINGS_KEY = 'cam_tools_settings';

  function readAccent() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      if (settings.accentTheme === 'custom' && HEX_RE.test(settings.accentCustom)) return 'custom';
      return ACCENT_THEMES[settings.accentTheme] ? settings.accentTheme : 'blue';
    } catch {
      return 'blue';
    }
  }

  // ----------------------------------------------------------------
  //  CSS VARIABLE BLOCK  (from Anti-AI_Style-Guide.md :root template)
  // ----------------------------------------------------------------
  function buildVarBlock(accent) {
    const t = resolveAccentColors(accent);
    return `
:root {
  /* -- Backgrounds -- */
  --tm-bg-primary:   #0f0f0f;
  --tm-bg-secondary: #1a1a1a;
  --tm-bg-tertiary:  #242424;
  --tm-bg-elevated:  #2d2d2d;

  /* -- Text -- */
  --tm-text-primary:   #f1f1f1;
  --tm-text-secondary: #aaaaaa;
  --tm-text-disabled:  #717171;

  /* -- Borders -- */
  --tm-border-subtle:  #303030;
  --tm-border-default: #3f3f3f;
  --tm-border-strong:  #525252;

  /* -- Accent (dynamic) -- */
  --tm-accent-primary: ${t.primary};
  --tm-accent-hover:   ${t.hover};
  --tm-accent-success: #2e7d32;
  --tm-accent-warning: #f9a825;
  --tm-accent-error:   #d32f2f;

  /* -- Spacing (4px grid) -- */
  --tm-space-1: 4px;
  --tm-space-2: 8px;
  --tm-space-3: 12px;
  --tm-space-4: 16px;
  --tm-space-5: 20px;
  --tm-space-6: 24px;

  /* -- Typography -- */
  --tm-font-family: 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  --tm-font-xs:   11px;
  --tm-font-sm:   12px;
  --tm-font-base: 14px;
  --tm-font-md:   16px;
  --tm-font-lg:   18px;

  /* -- Transitions -- */
  --tm-transition-fast:   100ms ease;
  --tm-transition-normal: 150ms ease;
  --tm-transition-slow:   250ms ease-out;

  /* -- Radius -- */
  --tm-radius-sm: 4px;
  --tm-radius-md: 8px;
  --tm-radius-lg: 12px;

  /* -- Z-Index Scale -- */
  --tm-z-dropdown:  9990;
  --tm-z-modal:     9995;
  --tm-z-panel:     9999;
  --tm-z-toast:     10000;
}`;
  }

  // ----------------------------------------------------------------
  //  SHARED COMPONENT STYLES
  // ----------------------------------------------------------------
  const COMPONENT_CSS = `
/* ---- Floating Panel ---- */
.tm-floating-panel {
  position: fixed;
  z-index: var(--tm-z-panel);
  font-family: var(--tm-font-family);
  font-size: var(--tm-font-base);
  color: var(--tm-text-primary);
  background: var(--tm-bg-secondary);
  border: 1px solid var(--tm-border-subtle);
  border-radius: var(--tm-radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.tm-floating-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--tm-bg-secondary);
  border: 1px solid var(--tm-border-subtle);
  border-radius: var(--tm-radius-md);
  cursor: grab;
  transition: background var(--tm-transition-normal);
}
.tm-floating-toggle:hover { background: var(--tm-bg-tertiary); }
.tm-floating-toggle:active { cursor: grabbing; }

.tm-panel-content {
  padding: var(--tm-space-3);
  max-height: calc(80vh - 48px);
  overflow-y: auto;
}

/* ---- Buttons ---- */
.tm-btn-primary {
  background: var(--tm-accent-primary);
  color: var(--tm-bg-primary);
  border: none;
  border-radius: var(--tm-radius-sm);
  padding: var(--tm-space-2) var(--tm-space-4);
  font-weight: 500;
  font-family: var(--tm-font-family);
  font-size: var(--tm-font-base);
  cursor: pointer;
  transition: background var(--tm-transition-normal);
}
.tm-btn-primary:hover { background: var(--tm-accent-hover); }

.tm-btn-secondary {
  background: transparent;
  color: var(--tm-accent-primary);
  border: 1px solid var(--tm-accent-primary);
  border-radius: var(--tm-radius-sm);
  padding: var(--tm-space-2) var(--tm-space-4);
  font-weight: 500;
  font-family: var(--tm-font-family);
  font-size: var(--tm-font-base);
  cursor: pointer;
  transition: all var(--tm-transition-normal);
}
.tm-btn-secondary:hover { background: rgba(62, 166, 255, 0.1); }

.tm-btn-ghost {
  background: transparent;
  color: var(--tm-text-secondary);
  border: none;
  padding: var(--tm-space-2);
  font-family: var(--tm-font-family);
  font-size: var(--tm-font-base);
  cursor: pointer;
  transition: color var(--tm-transition-normal);
}
.tm-btn-ghost:hover { color: var(--tm-text-primary); }

/* ---- Form Elements ---- */
.tm-input {
  background: var(--tm-bg-primary);
  color: var(--tm-text-primary);
  border: 1px solid var(--tm-border-default);
  border-radius: var(--tm-radius-sm);
  padding: var(--tm-space-2) var(--tm-space-3);
  font-size: var(--tm-font-base);
  font-family: var(--tm-font-family);
  transition: border-color var(--tm-transition-normal);
}
.tm-input:focus {
  outline: none;
  border-color: var(--tm-accent-primary);
}
.tm-input::placeholder { color: var(--tm-text-disabled); }

/* ---- Checkbox ---- */
.tm-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--tm-text-primary);
  font-size: var(--tm-font-base);
  font-weight: 500;
  cursor: pointer;
  margin: 0;
  width: 100%;
  user-select: none;
}
.tm-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--tm-accent-primary);
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}
.tm-checkbox-label input[type="checkbox"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- Form Field Label ---- */
.tm-field-label {
  color: var(--tm-text-secondary);
  font-size: 13px;
  margin: 0;
  font-weight: 400;
}

/* ---- Form Layout ---- */
.tm-form-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--tm-space-4);
  max-height: 80vh;
  overflow-y: auto;
}

/* ---- Primary Action Button (form context) ---- */
.tm-form-action {
  width: 100%;
  margin-top: var(--tm-space-2);
  background: var(--tm-accent-primary);
  color: var(--tm-bg-primary);
  border: none;
  border-radius: var(--tm-radius-sm);
  padding: 10px 0;
  font-size: var(--tm-font-base);
  font-weight: 600;
  font-family: var(--tm-font-family);
  cursor: pointer;
  transition: background var(--tm-transition-normal);
}
.tm-form-action:hover { background: var(--tm-accent-hover); }
.tm-form-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Cancel/Secondary Action Button (form context) ---- */
.tm-form-cancel {
  width: 100%;
  margin-top: var(--tm-space-1);
  background: transparent;
  color: var(--tm-text-secondary);
  border: 1px solid var(--tm-border-default);
  border-radius: var(--tm-radius-sm);
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--tm-font-family);
  cursor: pointer;
  transition: all var(--tm-transition-normal);
}
.tm-form-cancel:hover {
  color: var(--tm-text-primary);
  border-color: var(--tm-border-strong);
}

/* ---- Select (dark) ---- */
.tm-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--tm-border-default);
  border-radius: var(--tm-radius-sm);
  font-size: var(--tm-font-base);
  background: var(--tm-bg-primary);
  color: var(--tm-text-primary);
  font-family: var(--tm-font-family);
  box-sizing: border-box;
  transition: border-color var(--tm-transition-normal);
}
.tm-select:focus {
  outline: none;
  border-color: var(--tm-accent-primary);
}

/* ---- Overlay / Modal ---- */
.tm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--tm-z-modal);
  font-family: var(--tm-font-family);
}

.tm-modal {
  background: var(--tm-bg-secondary);
  border: 1px solid var(--tm-border-subtle);
  border-radius: var(--tm-radius-lg);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: tm-fade-in 150ms ease-out;
}

.tm-modal-header {
  background: var(--tm-bg-tertiary);
  color: var(--tm-text-primary);
  padding: var(--tm-space-3) var(--tm-space-4);
  font-size: var(--tm-font-md);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--tm-border-subtle);
}

.tm-modal-body {
  padding: var(--tm-space-4);
  overflow-y: auto;
  flex: 1;
  color: var(--tm-text-primary);
}

.tm-modal-footer {
  padding: var(--tm-space-3) var(--tm-space-4);
  display: flex;
  gap: var(--tm-space-3);
  justify-content: flex-end;
  border-top: 1px solid var(--tm-border-subtle);
}

/* ---- Toast ---- */
.tm-toast-container {
  position: fixed;
  bottom: var(--tm-space-6);
  right: var(--tm-space-6);
  z-index: var(--tm-z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--tm-space-2);
  pointer-events: none;
}

.tm-toast {
  background: var(--tm-bg-elevated);
  color: var(--tm-text-primary);
  border: 1px solid var(--tm-border-default);
  border-radius: var(--tm-radius-md);
  padding: var(--tm-space-3) var(--tm-space-4);
  font-family: var(--tm-font-family);
  font-size: var(--tm-font-sm);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--tm-space-2);
  animation: tm-slide-in 150ms ease-out;
  max-width: 360px;
}
.tm-toast--success { border-left: 3px solid var(--tm-accent-success); }
.tm-toast--warning { border-left: 3px solid var(--tm-accent-warning); }
.tm-toast--error   { border-left: 3px solid var(--tm-accent-error); }
.tm-toast--info    { border-left: 3px solid var(--tm-accent-primary); }

.tm-toast-action {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--tm-accent-primary);
  cursor: pointer;
  font-weight: 500;
  font-size: var(--tm-font-sm);
  padding: var(--tm-space-1) var(--tm-space-2);
  border-radius: var(--tm-radius-sm);
  transition: background var(--tm-transition-fast);
}
.tm-toast-action:hover { background: rgba(62, 166, 255, 0.1); }

/* ---- Toggle Switch ---- */
.tm-toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
}
.tm-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.tm-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--tm-border-default);
  border-radius: 20px;
  transition: background var(--tm-transition-normal);
}
.tm-toggle-slider::before {
  content: '';
  position: absolute;
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background: var(--tm-text-primary);
  border-radius: 50%;
  transition: transform var(--tm-transition-normal);
}
.tm-toggle input:checked + .tm-toggle-slider {
  background: var(--tm-accent-primary);
}
.tm-toggle input:checked + .tm-toggle-slider::before {
  transform: translateX(16px);
}
.tm-toggle input:focus-visible + .tm-toggle-slider {
  box-shadow: 0 0 0 2px var(--tm-accent-primary);
}

/* ---- Accessibility ---- */
*:focus-visible {
  outline: 2px solid var(--tm-accent-primary);
  outline-offset: 2px;
}

/* ---- Spinner ---- */
.tm-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: tm-spin 600ms linear infinite;
  vertical-align: -2px;
  margin-right: 6px;
  flex-shrink: 0;
}
.tm-spinner--sm  { width: 12px; height: 12px; border-width: 1.5px; }
.tm-spinner--lg  { width: 20px; height: 20px; border-width: 2.5px; }

.tm-btn-loading {
  pointer-events: none;
  opacity: 0.6;
  cursor: not-allowed !important;
}

/* ---- Animations ---- */
@keyframes tm-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes tm-slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes tm-slide-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(20px); }
}
@keyframes tm-spin {
  to { transform: rotate(360deg); }
}
`;

  // ----------------------------------------------------------------
  //  INJECT INTO <head>
  // ----------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'tm-theme-vars';
  styleEl.textContent = buildVarBlock(readAccent()) + COMPONENT_CSS;
  document.head.appendChild(styleEl);

  // ----------------------------------------------------------------
  //  FAVICON INJECTION (WFM logo)
  // ----------------------------------------------------------------
  (function injectFavicon() {
    // Remove any existing favicons
    const existing = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existing.forEach(function(el) { el.remove(); });

    // WFM green leaf favicon as inline SVG data URI
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill="#004E36"/>
      <text x="16" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="18" fill="#fff">W</text>
    </svg>`;
    const faviconUrl = 'data:image/svg+xml,' + encodeURIComponent(faviconSvg);

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = faviconUrl;
    document.head.appendChild(link);
  })();

  // ----------------------------------------------------------------
  //  GLOBAL OVERLAY ESCAPE KEY & CLICK-OUTSIDE HANDLER
  //  Closes any overlay with z-index >= 9990 when Escape is pressed
  //  or when clicking the overlay backdrop directly.
  // ----------------------------------------------------------------
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    // Find the topmost open overlay
    const overlays = document.querySelectorAll('[style*="z-index"]');
    let topOverlay = null;
    let topZ = 0;
    overlays.forEach(function(el) {
      const z = parseInt(el.style.zIndex, 10);
      if (z >= 9990 && el.style.display !== 'none' && el.offsetParent !== null && z > topZ) {
        // Must be a full-screen overlay (position fixed, covering viewport)
        const rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
          topOverlay = el;
          topZ = z;
        }
      }
    });
    if (topOverlay && topOverlay.parentNode) {
      topOverlay.parentNode.removeChild(topOverlay);
    }
  });

  // Global click-outside-to-close: if user clicks directly on a
  // full-screen overlay backdrop (not its child content), close it.
  document.addEventListener('click', function(e) {
    const el = e.target;
    const z = parseInt(el.style.zIndex, 10);
    if (z >= 9990 && el.style.position === 'fixed') {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) {
        // Click was on the backdrop itself, not a child
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    }
  });

  // ----------------------------------------------------------------
  //  PUBLIC API -- window.TmTheme
  // ----------------------------------------------------------------

  /**
   * Switch accent theme and persist.
   * @param {string} accent  Preset name from ACCENT_THEMES, or 'custom'.
   * @param {string} [customHex]  #rrggbb -- required the first time 'custom' is used.
   */
  function setAccent(accent, customHex) {
    if (accent === 'custom') {
      if (!HEX_RE.test(customHex) && !readCustomHex()) return;
    } else if (!ACCENT_THEMES[accent]) {
      return;
    }
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      settings.accentTheme = accent;
      if (accent === 'custom' && HEX_RE.test(customHex)) settings.accentCustom = customHex;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* storage unavailable */ }
    // Hot-swap the two accent variables without full re-inject
    const colors = (accent === 'custom' && HEX_RE.test(customHex))
      ? { primary: customHex, hover: lighten(customHex) }
      : resolveAccentColors(accent);
    const root = document.documentElement;
    root.style.setProperty('--tm-accent-primary', colors.primary);
    root.style.setProperty('--tm-accent-hover', colors.hover);
  }

  /** List preset accents for building pickers: [{name, label, primary}]. */
  function listAccents() {
    return Object.keys(ACCENT_THEMES).map((name) => ({
      name: name,
      label: ACCENT_THEMES[name].label || name,
      primary: ACCENT_THEMES[name].primary
    }));
  }

  /** Resolved {primary, hover} for the active accent. */
  function getAccentColors() {
    return resolveAccentColors(readAccent());
  }

  /** Get current accent name. */
  function getAccent() {
    return readAccent();
  }

  /**
   * Inject a <style> tag with deduplication.
   * @param {string} id   Unique identifier (used as element ID)
   * @param {string} css  CSS text
   * @returns {HTMLStyleElement}
   */
  function injectStyle(id, css) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
    return el;
  }

  // ----------------------------------------------------------------
  //  TOAST SYSTEM
  // ----------------------------------------------------------------
  let toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'tm-toast-container';
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  /**
   * Show a toast notification.
   * @param {string}  message   Text to display
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {number}  [duration=3000]  Auto-dismiss ms
   * @param {{label:string, callback:Function}|null} [action=null]
   */
  function showToast(message, type, duration, action) {
    type = type || 'info';
    duration = typeof duration === 'number' ? duration : 3000;

    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'tm-toast tm-toast--' + type;

    // Icon (simple SVG per type)
    const icons = {
      info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    };
    toast.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>';

    if (action && action.label && typeof action.callback === 'function') {
      const btn = document.createElement('button');
      btn.className = 'tm-toast-action';
      btn.textContent = action.label;
      btn.onclick = function () {
        action.callback();
        dismiss();
      };
      toast.appendChild(btn);
    }

    container.appendChild(toast);

    function dismiss() {
      toast.style.animation = 'tm-slide-out 150ms ease-in forwards';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 160);
    }

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return { dismiss: dismiss };
  }

  // ----------------------------------------------------------------
  //  LEVEL-GATED LOGGING -- TmLog
  //  Reads debugMode from cam_tools_settings in localStorage.
  //  Levels: debug (0), info (1), warn (2), error (3), off (4)
  //  When debugMode is OFF  -> effective level = info (1)
  //  When debugMode is ON   -> effective level = debug (0)
  // ----------------------------------------------------------------
  const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };

  function readDebugMode() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return !!settings.debugMode;
    } catch {
      return false;
    }
  }

  function effectiveLevel() {
    return readDebugMode() ? LOG_LEVELS.debug : LOG_LEVELS.info;
  }

  /**
   * Shared logger with level gating.
   * Usage:  TmLog.debug('[Module]', 'message', data);
   *         TmLog.info('[Module]', 'loaded');
   *         TmLog.warn('[Module]', 'deprecation notice');
   *         TmLog.error('[Module]', 'crash', err);
   */
  const TmLog = {
    /** Log only when debugMode is enabled. */
    debug: function () {
      if (effectiveLevel() <= LOG_LEVELS.debug) {
        console.log.apply(console, arguments);
      }
    },
    /** Always logged (informational entry-point messages). */
    info: function () {
      if (effectiveLevel() <= LOG_LEVELS.info) {
        console.log.apply(console, arguments);
      }
    },
    /** Always logged (warnings). */
    warn: function () {
      if (effectiveLevel() <= LOG_LEVELS.warn) {
        console.warn.apply(console, arguments);
      }
    },
    /** Always logged (errors). */
    error: function () {
      if (effectiveLevel() <= LOG_LEVELS.error) {
        console.error.apply(console, arguments);
      }
    },
    /** Check if debug-level logging is active. */
    isDebug: function () {
      return readDebugMode();
    }
  };

  // ----------------------------------------------------------------
  //  BUTTON LOADING STATE HELPERS
  //  Adds a spinner + disabled state to any button, stores original
  //  content so it can be restored later.
  // ----------------------------------------------------------------

  /**
   * Put a button into loading state with spinner and optional custom text.
   * Stores original innerHTML on the element for later restoration.
   * @param {HTMLElement} btn        The button element
   * @param {string}      [text]     Loading text (default: 'Loading...')
   */
  function setButtonLoading(btn, text) {
    if (!btn) return;
    // Store original state only once (avoid double-save)
    if (!btn.dataset.tmOriginalHtml) {
      btn.dataset.tmOriginalHtml = btn.innerHTML;
      btn.dataset.tmOriginalDisabled = btn.disabled ? 'true' : 'false';
    }
    btn.disabled = true;
    btn.classList.add('tm-btn-loading');
    btn.innerHTML = '<span class="tm-spinner"></span>' + (text || 'Loading...');
  }

  /**
   * Restore a button from loading state.
   * @param {HTMLElement} btn          The button element
   * @param {string}      [text]       Override text (if omitted, restores original innerHTML)
   */
  function clearButtonLoading(btn, text) {
    if (!btn) return;
    btn.disabled = btn.dataset.tmOriginalDisabled === 'true';
    btn.classList.remove('tm-btn-loading');
    if (text !== undefined) {
      btn.innerHTML = text;
    } else if (btn.dataset.tmOriginalHtml) {
      btn.innerHTML = btn.dataset.tmOriginalHtml;
    }
    delete btn.dataset.tmOriginalHtml;
    delete btn.dataset.tmOriginalDisabled;
  }

  // ----------------------------------------------------------------
  //  EXPOSE
  // ----------------------------------------------------------------
  window.TmTheme = {
    setAccent: setAccent,
    getAccent: getAccent,
    listAccents: listAccents,
    getAccentColors: getAccentColors,
    injectStyle: injectStyle,
    showToast: showToast,
    setButtonLoading: setButtonLoading,
    clearButtonLoading: clearButtonLoading,
    ACCENT_THEMES: ACCENT_THEMES
  };

  window.TmLog = TmLog;

  // Module export for testing
  try {
    module.exports = {
      setAccent: setAccent,
      getAccent: getAccent,
      listAccents: listAccents,
      getAccentColors: getAccentColors,
      injectStyle: injectStyle,
      showToast: showToast,
      setButtonLoading: setButtonLoading,
      clearButtonLoading: clearButtonLoading,
      ACCENT_THEMES: ACCENT_THEMES,
      TmLog: TmLog,
      _readDebugMode: readDebugMode,
      _LOG_LEVELS: LOG_LEVELS
    };
  } catch (e) {
    // Browser environment
  }
})();
} catch (e) {
  console.error('[CAM_Tools] Module tm-theme.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: AddItemButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // ------------------------------------------------------------------
    //  HELPER: Generate CSV for add-item data
    // ------------------------------------------------------------------
    function generateCSV(storeCodes, plu, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate) {
        let csvContent = 'Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date\n';

        storeCodes.forEach(store => {
            plu.forEach(pluCode => {
                csvContent += `${store},Name_Does_Not_Matter,${pluCode},${availability},${currentInventory},,${andonCord},${trackingStartDate},${trackingEndDate}\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'add_item_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ------------------------------------------------------------------
    //  HELPER: Fetch all store TLCs from the CAM API
    // ------------------------------------------------------------------
    function fetchAllStoreCodes() {
        return new Promise((resolve, reject) => {
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            const headersStores = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
            };

            fetch(apiUrlBase, {
                method: 'POST',
                headers: headersStores,
                body: JSON.stringify({}),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(storeData => {
                if (!storeData || !storeData.storesInformation) {
                    throw new Error('Invalid store data received');
                }

                const storeCodes = [];
                for (const region in storeData.storesInformation) {
                    const states = storeData.storesInformation[region];
                    for (const st in states) {
                        const stores = states[st];
                        stores.forEach(store => {
                            storeCodes.push(store.storeTLC);
                        });
                    }
                }
                resolve(storeCodes);
            })
            .catch(error => {
                console.error('[AddItem] Error fetching store codes:', error);
                reject(error);
            });
        });
    }

    // ------------------------------------------------------------------
    //  STYLES  (styles are now provided by globalPieces.js / tm-theme.js;
    //           only module-specific overrides go here)
    // ------------------------------------------------------------------

    function addAddItemButton() {
        console.log('[AddItem] Attempting to add button');

        // Check if the button already exists
        if (document.getElementById('addItemButton')) {
            console.log('[AddItem] Button already exists');
            return;
        }

        // Create the add new item(s) button
        const addItemButton = document.createElement('button');
        addItemButton.className = 'button';
        addItemButton.id = 'addItemButton';
        addItemButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Add New Item(s)';
        addItemButton.style.position = 'fixed';
        addItemButton.style.bottom = '0';
        addItemButton.style.left = '20%';
        addItemButton.style.width = '20%';
        addItemButton.style.height = '40px';
        addItemButton.style.zIndex = '1000';
        addItemButton.style.fontSize = '14px';
        addItemButton.style.backgroundColor = '#1a1a1a';
        addItemButton.style.color = '#f1f1f1';
        addItemButton.style.border = '1px solid #303030';
        addItemButton.style.borderRadius = '4px';
        addItemButton.style.cursor = 'pointer';
        addItemButton.style.transition = 'background 150ms ease';
        addItemButton.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

        // Append the button to the body
        document.body.appendChild(addItemButton);
        console.log('[AddItem] Button added');
        addItemButton.addEventListener('mouseover', function(){
            addItemButton.style.backgroundColor = '#242424';
        });
        addItemButton.addEventListener('mouseout', function(){
            addItemButton.style.backgroundColor = '#1a1a1a';
        });

        // Add click event to the add new item(s) button
        addItemButton.addEventListener('click', function() {
            // Password requirement before opening overlay
            var pw = prompt('Enter password to access Add New Item(s):');
            if (pw !== 'Leeloo') {
                alert('Incorrect password. Access denied.');
                return;
            }
            console.log('[AddItem] Button clicked');
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'addItemOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '360px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar
            var headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '10px 16px 8px 16px';
            headerBar.style.fontSize = '17px';
            headerBar.style.fontWeight = 'bold';
            headerBar.style.letterSpacing = '0.5px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.innerHTML = `<span>Add New Item</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'addItemOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
            closeButton.style.color = '#fff';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'background 0.2s';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.background = 'rgba(0,0,0,0.12)';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.background = 'transparent';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
            formContainer.appendChild(headerBar);
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
var infoBox = document.createElement('div');
infoBox.id = 'addItemOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '48px';
infoBox.style.left = '16px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid #004E36';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
infoBox.style.zIndex = '2002';
infoBox.style.minWidth = '240px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="22" height="22" fill="#004E36" viewBox="0 0 20 20" style="flex-shrink:0;margin-top:2px;">
            <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
            <text x="10" y="15" text-anchor="middle" font-size="13" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;">Add New Item(s)</div>
            Use this tool to generate upload files for adding new items to selected stores.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Enter a store code or check "All Stores" to include all stores.</li>
                <li>Enter one or more PLU codes (comma-separated) for the items to add.</li>
                <li>Fill in the current inventory, availability, andon cord state, and tracking dates as needed.</li>
                <li>Click <b>Generate File</b> to compile the data. Progress will be shown.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Use "All Stores" to add items to every store in the system.</li>
                <li>Both tracking dates must be filled if one is provided.</li>
                <li>If you encounter issues, check that all required fields are filled and try again.</li>
            </ul>
            <div style="margin:7px 0 0 0;font-weight:600;">Disclaimer:</div>
            The downloaded file <b>can cause extreme damage to the data integrity of CAM's catalog use with caution.</b>
        </div>
        <button id="closeAddItemInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Add info icon to headerBar
var infoIcon = document.createElement('span');
infoIcon.id = 'addItemOverlayInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#e0e0e0';
infoIcon.style.color = '#004E36';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
        <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
        <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
    </svg>
`;
headerBar.querySelector('span').appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('addItemOverlayInfoIcon');
    var infoBox = document.getElementById('addItemOverlayInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(16, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeAddItemInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);

            // Content area
            var contentArea = document.createElement('div');
            contentArea.style.padding = '12px 16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '6px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Main content HTML
            contentArea.className = 'tm-form-stack';
            contentArea.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="flex:1;">
                        <label class="tm-field-label" style="display:block;margin-bottom:4px;">Store - 3 Letter Code</label>
                        <input type="text" id="storeCode" class="tm-input" placeholder="AAA">
                    </div>
                    <label class="tm-checkbox-label" style="margin-top:18px;width:auto;flex-shrink:0;">
                        <input type="checkbox" id="allStoresCheckbox">
                        <span>All Stores</span>
                    </label>
                </div>
                <label class="tm-field-label">PLU</label>
                <input type="text" id="plu" class="tm-input" placeholder="Enter PLU(s) separated by commas">
                <label class="tm-field-label">Current Inventory</label>
                <input type="number" id="currentInventory" class="tm-input" placeholder="0">
                <label class="tm-field-label">Availability</label>
                <select id="availability" class="tm-select">
                    <option value="Limited">Limited</option>
                    <option value="Unlimited">Unlimited</option>
                </select>
                <label class="tm-field-label">Andon Cord</label>
                <select id="andonCord" class="tm-select">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <label class="tm-field-label">Tracking Start Date</label>
                <input type="date" id="trackingStartDate" class="tm-input">
                <label class="tm-field-label">Tracking End Date</label>
                <input type="date" id="trackingEndDate" class="tm-input">
                <button id="generateFileButton" class="tm-form-action">Generate File</button>
            `;
            formContainer.appendChild(contentArea);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Ensure elements exist before attaching event listeners
            var availabilityElement = document.getElementById('availability');
            var generateFileButton = document.getElementById('generateFileButton');

            // Add event listener to the "All Stores" checkbox
            document.getElementById('allStoresCheckbox').addEventListener('change', function() {
                const storeCodeInput = document.getElementById('storeCode');
                storeCodeInput.disabled = this.checked;
                if (this.checked) {
                    storeCodeInput.value = '';
                }
            });

            if (availabilityElement) {
                availabilityElement.addEventListener('change', function() {
                    var currentInventoryField = document.getElementById('currentInventory');
                    if (this.value === 'Unlimited') {
                        currentInventoryField.value = 0;
                        currentInventoryField.disabled = true;
                    } else {
                        currentInventoryField.disabled = false;
                    }

                });
            }

            if (generateFileButton) {
                generateFileButton.addEventListener('click', function() {
                    // Collect input values
                    var storeCode = document.getElementById('storeCode').value;
                    if (document.getElementById('allStoresCheckbox').checked) {
                        // Fetch all store codes
                        fetchAllStoreCodes().then(allStoreCodes => {
                            console.log('All Store Codes:', allStoreCodes);
                            if (!Array.isArray(allStoreCodes)) {
                                console.error('Error: storeCodes is not an array');
                                return;
                            }
                            // Extract all values from the DOM inside the .then() callback to ensure correct context
                            const plu = Array.from(new Set((document.getElementById('plu').value || '').split(',').map(p => p.trim())));
                            const currentInventory = document.getElementById('currentInventory') ? document.getElementById('currentInventory').value : '';
                            const availability = document.getElementById('availability') ? document.getElementById('availability').value : '';
                            const andonCord = document.getElementById('andonCord') ? document.getElementById('andonCord').value : '';
                            const trackingStartDate = document.getElementById('trackingStartDate') ? document.getElementById('trackingStartDate').value : '';
                            const trackingEndDate = document.getElementById('trackingEndDate') ? document.getElementById('trackingEndDate').value : '';

                            // Debug log for all values
                            console.log('PLU Array:', plu);
                            console.log('Current Inventory:', currentInventory);
                            console.log('Availability:', availability);
                            console.log('Andon Cord:', andonCord);
                            console.log('Tracking Start Date:', trackingStartDate);
                            console.log('Tracking End Date:', trackingEndDate);

                            if (!Array.isArray(plu)) {
                                console.error('Error: plu is not an array');
                                return;
                            }
                            generateCSV(allStoreCodes, plu, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate);
                        }).catch(error => {
                            console.error('Error fetching store codes:', error);
                        });
                        return;
                    }
                    var plu = document.getElementById('plu').value;
                    var currentInventory = document.getElementById('currentInventory').value;
                    var availability = document.getElementById('availability').value;
                    var andonCord = document.getElementById('andonCord').value;
                    
                    console.log('PLU:', plu);
                    console.log('Current Inventory:', currentInventory);
                    console.log('Availability:', availability);
                    console.log('Andon Cord:', andonCord);

                    // Check if all required fields are filled
                    if ((!storeCode && !document.getElementById('allStoresCheckbox').checked) || !plu || !availability || !andonCord) {
                        alert('Please fill in all required fields before generating the file.');
                        return;
                    }

                    // Check if both tracking dates are filled if one is provided
                    const trackingStartDate = document.getElementById('trackingStartDate').value;
                    const trackingEndDate = document.getElementById('trackingEndDate').value;

                    if ((trackingStartDate && !trackingEndDate) || (!trackingStartDate && trackingEndDate)) {
                        if (window.TmTheme && window.TmTheme.showToast) {
                            window.TmTheme.showToast('Please provide both Tracking Start Date and Tracking End Date.', 'warning', 4000);
                        } else {
                            alert('Please provide both Tracking Start Date and Tracking End Date.');
                        }
                        return;
                    }

                    // Split store codes and PLUs by commas
                    const storeCodes = Array.from(new Set(storeCode.split(',').map(code => code.trim())));
                    const plus = Array.from(new Set(plu.split(',').map(p => p.trim())));

                    generateCSV(storeCodes, plus, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate);
                });
            }
        });
    }

    // Initialize the add item button
    addAddItemButton();

    // Module export for testing (at end of IIFE)
    try {
        module.exports = {
            addAddItemButton,
            generateCSV,
            fetchAllStoreCodes
        };
    } catch (e) {
        // Browser environment
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module AddItemButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: activateButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addActivateButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addActivateButton() {
        console.log('[Activate] Attempting to add button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('[Activate] Button already exists');
            return;
        }

        // Create the activate/deactivate item(s) button
        const activateButton = document.createElement('button');
        activateButton.id = 'activateButton';
        activateButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> Activate/Deactivate';
        activateButton.className = 'button';
        activateButton.style.position = 'fixed';
        activateButton.style.bottom = '0';
        activateButton.style.left = '40%';
        activateButton.style.width = '20%';
        activateButton.style.height = '40px';
        activateButton.style.zIndex = '1000';
        activateButton.style.fontSize = '14px';
        activateButton.style.backgroundColor = '#1a1a1a';
        activateButton.style.color = '#f1f1f1';
        activateButton.style.border = '1px solid #303030';
        activateButton.style.borderRadius = '4px';
        activateButton.style.cursor = 'pointer';
        activateButton.style.transition = 'background 150ms ease';
        activateButton.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

        document.body.appendChild(activateButton);
        activateButton.addEventListener('mouseover', function() {
            activateButton.style.backgroundColor = '#242424';
        });
        activateButton.addEventListener('mouseout', function() {
            activateButton.style.backgroundColor = '#1a1a1a';
        });
        console.log('[Activate] Button added');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('[Activate] Button clicked');
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'activateOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '300px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.maxHeight = '90vh';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar
            const headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '12px 16px';
            headerBar.style.fontSize = '16px';
            headerBar.style.fontWeight = '600';
            headerBar.style.letterSpacing = '0.3px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.borderBottom = '1px solid #303030';
            headerBar.innerHTML = `<span>Activate/Deactivate Item(s)</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'activateOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
            closeButton.style.color = '#aaaaaa';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'color 150ms ease';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.color = '#f1f1f1';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.color = '#aaaaaa';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
const infoBox = document.createElement('div');
infoBox.id = 'activateOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '48px';
infoBox.style.left = '16px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '8px';
infoBox.style.fontSize = '14px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
infoBox.style.zIndex = '9999';
infoBox.style.border = '1px solid #303030';
infoBox.style.minWidth = '240px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;color:#f1f1f1;">Activate/Deactivate Item(s)</div>
            Use this tool to generate upload files for activating or deactivating items in selected stores.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Enter one or more PLU codes (comma-separated) to select items.</li>
                <li>Choose whether to filter by Store or Region, then enter the relevant codes.</li>
                <li>Check "All Stores" to include all stores (overrides the Store/Region field).</li>
                <li>Select the desired Andon Cord state (Enabled/Disabled).</li>
                <li>Click <b>Generate Upload File</b> to fetch and compile the data. Progress will be shown.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Use filters to limit the data for faster downloads.</li>
                <li>If you encounter issues, try reducing the number of stores or PLUs selected.</li>
            </ul>
        </div>
        <button id="closeActivateInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Add info icon to headerBar
const infoIcon = document.createElement('span');
infoIcon.id = 'activateOverlayInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#3f3f3f';
infoIcon.style.color = '#f1f1f1';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
`;
headerBar.querySelector('span').appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('activateOverlayInfoIcon');
    var infoBox = document.getElementById('activateOverlayInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(16, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeActivateInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);
            formContainer.appendChild(headerBar);

            // Content area
            const contentArea = document.createElement('div');
            contentArea.style.padding = '16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '6px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Main content HTML
            contentArea.className = 'tm-form-stack';
            contentArea.innerHTML = `
                <label class="tm-field-label">PLU(s)</label>
                <input type="text" id="pluInput" class="tm-input" placeholder="PLUs, comma-separated">
                <label class="tm-field-label">By</label>
                <select id="bySelect" class="tm-select">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="flex:1;">
                        <label class="tm-field-label" style="display:block;margin-bottom:4px;">Store/Region</label>
                        <input type="text" id="storeRegionInput" class="tm-input" placeholder="Codes, comma-separated">
                    </div>
                    <label class="tm-checkbox-label" style="margin-top:18px;width:auto;flex-shrink:0;">
                        <input type="checkbox" id="allStoresCheckbox">
                        <span>All Stores</span>
                    </label>
                </div>
                <label class="tm-field-label">Andon Cord</label>
                <select id="andonCordSelect" class="tm-select">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <button id="generateUploadFileButton" class="tm-form-action">Generate Upload File</button>
            `;
            formContainer.appendChild(contentArea);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to close the overlay
            overlay.addEventListener('click', function(event) {
                if (event.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });

            // Add event listener to the "All Stores" checkbox
            document.getElementById('allStoresCheckbox').addEventListener('change', function() {
                const storeRegionInput = document.getElementById('storeRegionInput');
                storeRegionInput.disabled = this.checked;
                if (this.checked) {
                    storeRegionInput.value = '';
                }
            });

            document.getElementById('generateUploadFileButton').addEventListener('click', function() {
                const generateButton = document.getElementById('generateUploadFileButton');
                if (window.TmTheme) window.TmTheme.setButtonLoading(generateButton, 'Processing...');
                
                
                // Logic to generate the upload file
                const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim())));
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim())));
                const andonCord = document.getElementById('andonCordSelect').value;
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loadingIndicator';
                loadingIndicator.innerHTML = 'Processing...';
                loadingIndicator.style.textAlign = 'center';
                loadingIndicator.style.marginTop = '10px';
                loadingIndicator.style.fontSize = '14px';
                loadingIndicator.style.color = 'var(--tm-accent-primary, #3ea6ff)';
                formContainer.appendChild(loadingIndicator);

                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

                // Define the API endpoint and headers for getting stores
                const headersStores = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                    'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
                };

                // Call the API to get the list of stores
                delay(500).then(() => fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include' // Include cookies in the request
                }))
                .then(response => response.json())
                .then(storeData => {
                    console.log('Store data received:', storeData);

                    if (!storeData || !storeData.storesInformation) {
                        throw new Error('Invalid store data received');
                    }

                    // Extract store IDs
                    const storeIds = [];
                    for (const region in storeData.storesInformation) {
                        const states = storeData.storesInformation[region];
                        for (const state in states) {
                            const stores = states[state];
                            stores.forEach(store => {
                                if (document.getElementById('allStoresCheckbox').checked) {
                                    storeIds.push(store.storeTLC);
                                } else {
                                    const regionParts = region.split('-');
                                    const regionCode = regionParts[regionParts.length - 1]; // Extract short region code
                                    if ((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                        (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                        storeIds.push(store.storeTLC);
                                    }
                                }
                            });
                        }
                    }

                    // Define batching for fetching items for stores
                    const batchSize = 10;
                    const storeIdBatches = [];
                    for (let i = 0; i < storeIds.length; i += batchSize) {
                        storeIdBatches.push(storeIds.slice(i, i + batchSize));
                    }
                    loadingIndicator.innerHTML = 'Processing batches...';
                    const retryLimit = 10;
                    const fetchItemsForStores = (storeIdsBatch) => {
                        const headersItems = {
                            'accept': '*/*',
                            'accept-encoding': 'gzip, deflate, br',
                            'accept-language': 'en-US,en;q=0.9',
                            'content-type': 'application/x-amz-json-1.0',
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                            'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                        };

                        const payloadItems = {
                            "filterContext": {
                                "storeIds": storeIdsBatch
                            },
                            "paginationContext": {
                                "pageNumber": 0,
                                "pageSize": 10000
                            }
                        };

                        return delay(500).then(() => fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersItems,
                            body: JSON.stringify(payloadItems),
                            credentials: 'include'
                        }))
                        .then(response => response.json())
                        .then(data => {
                            console.log(`Data for store batch:`, data);
                            return data.itemsAvailability.filter(item => pluInput.includes(item.wfmScanCode)).map(item => {
                                return {
                                    'Store - 3 Letter Code': item.storeCode || item.storeTLC || item.storeId || item.store || '', //didnt remember what the actual id was.
                                    'Andon Cord': andonCord,
                                    'Item Name': item.itemName,
                                    'Item PLU/UPC': item.wfmScanCode,
                                    'Availability': item.inventoryStatus,
                                    'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                                    'Sales Floor Capacity': '',
                                    'Tracking Start Date': '',
                                    'Tracking End Date': ''
                                };
                                console.log(item);
                            });
                        })
                        .catch(error => {
                            console.error(`Error downloading data for store batch:`, error);
                            return [];
                        });
                    };

                    const fetchWithRetry = async (storeIdsBatch, attempt = 1) => {
                        try {
                            await delay(100);
                            return fetchItemsForStores(storeIdsBatch);
                        } catch (error) {
                            if (attempt < retryLimit) {
                                console.warn(`Retrying store batch, attempt ${attempt + 1}`);
                                return fetchWithRetry(storeIdsBatch, attempt + 1);
                            } else {
                                console.error(`Failed after ${retryLimit} attempts`);
                                return [];
                            }
                        }
                    };

                    async function processBatches() {
                        const results = [];
                        for (let i = 0; i < storeIdBatches.length; i++) {
                            loadingIndicator.innerHTML = 'Processing batch ' + (i + 1) + ' of ' + storeIdBatches.length;
                            const res = await fetchWithRetry(storeIdBatches[i]);
                            results.push(res);
                        }
                        return results;
                    }
                    processBatches().then(results => {
                        const allItems = results.flat();
                        console.log('Filtered items data:', allItems);

                        if (allItems.length > 0) {
                            // Specify the correct headers to include
                            const desiredHeaders = [
                                'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC', 'Availability',
                                'Current Inventory', 'Sales Floor Capacity', 'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
                            ];
                            // RFC 4180 compliant field escaping: wrap every field in
                            // double quotes and double any embedded double quotes. This
                            // keeps commas, quotes, and newlines safely contained within
                            // a field.
                            const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
                            const csvBody = desiredHeaders.join(",") + "\r\n"
                                + allItems.map(e => desiredHeaders.map(header => escapeCsv(e[header])).join(",")).join("\r\n");

                            // Build the file via a Blob instead of a data: URI. A data
                            // URI passed through encodeURI() leaves '#' unencoded, and
                            // the browser treats '#' as the URI fragment delimiter,
                            // silently truncating the payload at the first '#' in any
                            // item name. A Blob carries the data verbatim with no
                            // URI-reserved-character interpretation. The BOM ensures
                            // Excel reads UTF-8 correctly.
                            loadingIndicator.innerHTML = 'Downloading...';
                            const blob = new Blob(["\uFEFF" + csvBody], { type: 'text/csv;charset=utf-8;' });
                            const objectUrl = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", objectUrl);
                            link.setAttribute("download", "upload_items_data.csv");
                            document.body.appendChild(link);

                            // Trigger the download
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(objectUrl);
                        } else {
                            console.log('No items data available to download.');
                        }
                    });
                })
                .catch(error => console.error('Error downloading data:', error))
                .finally(function() {
                    if (window.TmTheme) {
                        window.TmTheme.clearButtonLoading(generateButton);
                    } else {
                        generateButton.disabled = false;
                    }
                    generateButton.style.cursor = 'pointer';
                });
            });
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addActivateButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the activate/deactivate item(s) button
    addActivateButton();

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addActivateButton
        };
    } catch (e) {
        // Handle the error if needed
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module activateButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: RedriveButton.js
 * ================================================================ */
try {
(function () {
    'use strict';

    function addRedriveButton() {
        console.log('[Redrive] Attempting to add redrive button');

        // Check if the button already exists
        if (document.getElementById('redriveButton')) {
            console.log('Redrive button already exists');
            return;
        }

        // Create the redrive button
        const redriveButton = document.createElement('button');
        redriveButton.id = 'redriveButton';
        redriveButton.className = 'button';
        redriveButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Redrive';
        redriveButton.style.position = 'fixed';
        redriveButton.style.bottom = '0';
        redriveButton.style.left = '60%';
        redriveButton.style.width = '20%';
        redriveButton.style.height = '40px';
        redriveButton.style.zIndex = '1000';
        redriveButton.style.fontSize = '14px';
        redriveButton.style.backgroundColor = '#1a1a1a';
        redriveButton.style.color = '#f1f1f1';
        redriveButton.style.border = '1px solid #303030';
        redriveButton.style.borderRadius = '4px';
        redriveButton.style.cursor = 'pointer';
        redriveButton.style.transition = 'background 150ms ease';
        redriveButton.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

        document.body.appendChild(redriveButton);
        console.log('[Redrive] Button added to the page');
        redriveButton.addEventListener('mouseover', function () {
            redriveButton.style.backgroundColor = '#242424';
        });
        redriveButton.addEventListener('mouseout', function () {
            redriveButton.style.backgroundColor = '#1a1a1a';
        });

        // Add click event to the redrive button
        redriveButton.addEventListener('click', function () {
            console.log('[Redrive] Button clicked');

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'redriveOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container (dark)
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '700px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.maxHeight = '90vh';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar (dark)
            const headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '12px 16px';
            headerBar.style.fontSize = '16px';
            headerBar.style.fontWeight = '600';
            headerBar.style.letterSpacing = '0.3px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.borderBottom = '1px solid #303030';
            headerBar.innerHTML = `<span>Redrive Item(s)</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'redriveOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
            closeButton.style.color = '#aaaaaa';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'color 150ms ease';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.color = '#f1f1f1';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.color = '#aaaaaa';
            });
            closeButton.addEventListener('click', function () {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
const infoBox = document.createElement('div');
infoBox.id = 'redriveOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '48px';
infoBox.style.left = '16px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
infoBox.style.zIndex = '9999';
infoBox.style.border = '1px solid #303030';
infoBox.style.minWidth = '240px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;color:#f1f1f1;">Redrive Item(s)</div>
            This tool provides two ways to generate redrive files with flipped Andon Cord states.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">Method 1 - Generate from API:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Enter one or more PLU codes (comma-separated) to select items.</li>
                <li>Choose whether to filter by Store or Region, then enter the relevant codes.</li>
                <li>Check "All Stores" to include all stores (overrides the Store/Region field).</li>
                <li>Click <b>Generate Redrive Files</b> to fetch and compile the data.</li>
                <li>Downloads a ZIP file containing both Redrive and Restore CSVs.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Method 2 - Upload & Convert:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Upload a CSV file containing an "Andon Cord" column.</li>
                <li>Review the conversion statistics showing how many states will be flipped.</li>
                <li>Click <b>Make Redrive File</b> to download the converted CSV.</li>
                <li>Enabled states become Disabled, and Disabled states become Enabled.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>For API method: Use filters to limit data for faster downloads.</li>
                <li>For upload method: Ensure your CSV has proper "Andon Cord" column headers.</li>
                <li>Check conversion statistics before downloading to catch any issues.</li>
            </ul>
        </div>
        <button id="closeRedriveInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Add info icon to headerBar
const infoIcon = document.createElement('span');
infoIcon.id = 'redriveOverlayInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#3f3f3f';
infoIcon.style.color = '#f1f1f1';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
`;
headerBar.querySelector('span').appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('redriveOverlayInfoIcon');
    var infoBox = document.getElementById('redriveOverlayInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(16, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeRedriveInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);
            formContainer.appendChild(headerBar);

            // Content area - Two column layout
            const contentArea = document.createElement('div');
            contentArea.style.padding = '12px 16px';
            contentArea.style.display = 'flex';
            contentArea.style.gap = '20px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Left column - Original functionality
            const leftColumn = document.createElement('div');
            leftColumn.style.flex = '1';
            leftColumn.style.display = 'flex';
            leftColumn.style.flexDirection = 'column';
            leftColumn.style.gap = '6px';
            leftColumn.innerHTML = `
                <h3 style="margin:0 0 8px 0;font-size:14px;color:var(--tm-accent-primary, #3ea6ff);font-weight:600;">Generate from API</h3>
                <label style="margin-bottom:2px;color:#aaaaaa;font-size:13px;">PLU(s)</label>
                <input type="text" id="pluInput" style="width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;background:#0f0f0f;color:#f1f1f1;font-family:inherit;box-sizing:border-box;" placeholder="Enter PLU(s) separated by commas">
                <label style="margin-bottom:2px;color:#aaaaaa;font-size:13px;">By</label>
                <select id="bySelect" style="width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;background:#0f0f0f;color:#f1f1f1;font-family:inherit;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <div style="display:flex;align-items:center;gap:18px;">
                    <div style="flex:1;">
                        <label style="margin-bottom:2px;display:block;color:#aaaaaa;font-size:13px;">Store/Region</label>
                        <input type="text" id="storeRegionInput" style="width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;background:#0f0f0f;color:#f1f1f1;font-family:inherit;box-sizing:border-box;" placeholder="Codes, comma-separated">
                    </div>
                    <label class="tm-checkbox-label" style="margin-top:18px;">
                        <input type="checkbox" id="allStoresCheckbox">
                        <span>All Stores</span>
                    </label>
                </div>
                <button id="generateRedriveFileButton" class="tm-form-action">Generate Redrive Files</button>
            `;

            // Separator
            const separator = document.createElement('div');
            separator.style.width = '1px';
            separator.style.background = 'linear-gradient(to bottom, transparent, #3f3f3f 20%, #3f3f3f 80%, transparent)';
            separator.style.minHeight = '200px';
            separator.style.alignSelf = 'stretch';

            // Right column - File upload functionality
            const rightColumn = document.createElement('div');
            rightColumn.style.flex = '1';
            rightColumn.style.display = 'flex';
            rightColumn.style.flexDirection = 'column';
            rightColumn.style.gap = '6px';
            rightColumn.innerHTML = `
                <h3 style="margin:0 0 8px 0;font-size:14px;color:var(--tm-accent-primary, #3ea6ff);font-weight:600;">Upload & Convert</h3>
                <label style="margin-bottom:2px;color:#aaaaaa;font-size:13px;">Upload CSV File</label>
                <div style="position:relative;">
                    <input type="file" id="csvFileInput" accept=".csv" style="width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;cursor:pointer;background:#0f0f0f;color:#f1f1f1;">
                </div>
                <div id="fileUploadStatus" style="margin-top:4px;font-size:12px;color:#717171;min-height:18px;"></div>
                <div id="conversionStats" style="margin-top:8px;padding:8px;background:#242424;border:1px solid #303030;border-radius:4px;font-size:13px;display:none;color:#f1f1f1;">
                    <div style="font-weight:600;margin-bottom:4px;color:var(--tm-accent-primary, #3ea6ff);">Conversion Summary:</div>
                    <div id="statsContent"></div>
                </div>
                <button id="makeRedriveFileButton" class="tm-form-action" disabled>Make Redrive File</button>
            `;

            contentArea.appendChild(leftColumn);
            contentArea.appendChild(separator);
            contentArea.appendChild(rightColumn);
            formContainer.appendChild(contentArea);

            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'redriveLoadingIndicator';
            loadingIndicator.innerHTML = 'Processing...';
            loadingIndicator.style.textAlign = 'center';
            loadingIndicator.style.marginTop = '10px';
            loadingIndicator.style.fontSize = '14px';
            loadingIndicator.style.color = 'var(--tm-accent-primary, #3ea6ff)';
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.padding = '8px';
            loadingIndicator.style.background = '#242424';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.border = '1px solid #303030';
            formContainer.appendChild(loadingIndicator);

            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to close the overlay
            overlay.addEventListener('click', function (event) {
                if (event.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });

            // Add event listener to the "All Stores" checkbox
            document.getElementById('allStoresCheckbox').addEventListener('change', function () {
                const storeRegionInput = document.getElementById('storeRegionInput');
                storeRegionInput.disabled = this.checked;
                if (this.checked) {
                    storeRegionInput.value = '';
                }
            });

            // File upload functionality
            let uploadedCsvData = null;
            let conversionStats = { enabled: 0, disabled: 0, total: 0 };

            // CSV parsing function
            function parseCSV(csvText) {
                const lines = csvText.trim().split('\n');
                if (lines.length < 2) {
                    throw new Error('CSV file must have at least a header row and one data row');
                }
                
                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                const data = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    if (values.length === headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index];
                        });
                        data.push(row);
                    }
                }
                
                return { headers, data };
            }

            // Function to flip andon cord states and generate stats
            function processAndonCordFlipping(csvData) {
                const processedData = [];
                const stats = { enabled: 0, disabled: 0, total: 0, errors: 0 };
                
                csvData.data.forEach(row => {
                    const processedRow = { ...row };
                    const andonCordValue = row['Andon Cord'] || '';
                    
                    if (andonCordValue.toLowerCase() === 'enabled') {
                        processedRow['Andon Cord'] = 'Disabled';
                        stats.enabled++;
                    } else if (andonCordValue.toLowerCase() === 'disabled') {
                        processedRow['Andon Cord'] = 'Enabled';
                        stats.disabled++;
                    } else {
                        // Handle unexpected values
                        console.warn(`Unexpected Andon Cord value: "${andonCordValue}" - defaulting to Enabled`);
                        processedRow['Andon Cord'] = 'Enabled';
                        stats.errors++;
                    }
                    
                    stats.total++;
                    processedData.push(processedRow);
                });
                
                return { data: processedData, headers: csvData.headers, stats };
            }

            // Function to convert data back to CSV
            function dataToCSV(headers, data) {
                const csvRows = [headers.join(',')];
                data.forEach(row => {
                    const values = headers.map(header => `"${row[header] || ''}"`);
                    csvRows.push(values.join(','));
                });
                return csvRows.join('\n');
            }

            // File input change handler
            document.getElementById('csvFileInput').addEventListener('change', function(event) {
                const file = event.target.files[0];
                const statusDiv = document.getElementById('fileUploadStatus');
                const makeButton = document.getElementById('makeRedriveFileButton');
                const statsDiv = document.getElementById('conversionStats');
                
                if (!file) {
                    statusDiv.textContent = '';
                    makeButton.disabled = true;
                    makeButton.style.opacity = '0.5';
                    statsDiv.style.display = 'none';
                    uploadedCsvData = null;
                    return;
                }
                
                if (!file.name.toLowerCase().endsWith('.csv')) {
                    statusDiv.textContent = 'Please select a CSV file';
                    statusDiv.style.color = '#d32f2f';
                    makeButton.disabled = true;
                    makeButton.style.opacity = '0.5';
                    statsDiv.style.display = 'none';
                    uploadedCsvData = null;
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csvText = e.target.result;
                        const parsedData = parseCSV(csvText);
                        
                        // Check if Andon Cord column exists
                        if (!parsedData.headers.includes('Andon Cord')) {
                            throw new Error('CSV file must contain an "Andon Cord" column');
                        }
                        
                        // Process the data to generate stats
                        const processed = processAndonCordFlipping(parsedData);
                        uploadedCsvData = processed;
                        conversionStats = processed.stats;
                        
                        // Update status
                        statusDiv.textContent = `File loaded: ${file.name} (${processed.data.length} rows)`;
                        statusDiv.style.color = '#2e7d32';
                        
                        // Show conversion stats
                        const statsContent = document.getElementById('statsContent');
                        let statsHtml = `
                            <div>• Enabled → Disabled: <strong>${conversionStats.enabled}</strong></div>
                            <div>• Disabled → Enabled: <strong>${conversionStats.disabled}</strong></div>
                            <div>• Total rows: <strong>${conversionStats.total}</strong></div>
                        `;
                        if (conversionStats.errors > 0) {
                            statsHtml += `<div style="color:#d32f2f;">• Unexpected values (defaulted to Enabled): <strong>${conversionStats.errors}</strong></div>`;
                        }
                        statsContent.innerHTML = statsHtml;
                        statsDiv.style.display = 'block';
                        
                        // Enable the button
                        makeButton.disabled = false;
                        makeButton.style.opacity = '1';
                        
                    } catch (error) {
                        statusDiv.textContent = `Error: ${error.message}`;
                        statusDiv.style.color = '#d32f2f';
                        makeButton.disabled = true;
                        makeButton.style.opacity = '0.5';
                        statsDiv.style.display = 'none';
                        uploadedCsvData = null;
                        console.error('CSV parsing error:', error);
                    }
                };
                reader.readAsText(file);
            });

            // Make Redrive File button handler
            document.getElementById('makeRedriveFileButton').addEventListener('click', function() {
                if (!uploadedCsvData) {
                    alert('Please upload a CSV file first');
                    return;
                }
                
                try {
                    // Convert processed data back to CSV
                    const csvContent = dataToCSV(uploadedCsvData.headers, uploadedCsvData.data);
                    
                    // Create and download the file
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'Redrive_Converted.csv');
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log('Redrive file generated successfully');
                } catch (error) {
                    alert(`Error generating redrive file: ${error.message}`);
                    console.error('Error generating redrive file:', error);
                }
            });

            document.getElementById('generateRedriveFileButton').addEventListener('click', function () {
                const genRedriveBtn = document.getElementById('generateRedriveFileButton');
                if (window.TmTheme) window.TmTheme.setButtonLoading(genRedriveBtn, 'Generating...');
                document.getElementById('redriveLoadingIndicator').style.display = 'block';
                // Logic to generate the redrive files
                const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim())));
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim())));

                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

                // Define the API endpoint and headers for getting stores
                const headersStores = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                    'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
                };

                // Call the API to get the list of stores
                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include' // Include cookies in the request
                })
                    .then(response => response.json())
                    .then(storeData => {
                        console.log('Store data received:', storeData);

                        if (!storeData || !storeData.storesInformation) {
                            throw new Error('Invalid store data received');
                        }

                        // Extract store IDs
                        const storeIds = [];
                        for (const region in storeData.storesInformation) {
                            const states = storeData.storesInformation[region];
                            for (const state in states) {
                                const stores = states[state];
                                stores.forEach(store => {
                                    if (document.getElementById('allStoresCheckbox').checked) {
                                        storeIds.push(store.storeTLC);
                                    } else {
                                        const regionCode = region.split('-').pop(); // Extract short region code
                                        if ((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                            (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                            storeIds.push(store.storeTLC);
                                        }
                                    }
                                });
                            }
                        }

                        // Function to fetch items for a single store
                        const fetchItemsForStore = (storeId) => {
                            const headersItems = {
                                'accept': '*/*',
                                'accept-encoding': 'gzip, deflate, br',
                                'accept-language': 'en-US,en;q=0.9',
                                'content-type': 'application/x-amz-json-1.0',
                                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                                'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                            };

                            const payloadItems = {
                                "filterContext": {
                                    "storeIds": [storeId]
                                },
                                "paginationContext": {
                                    "pageNumber": 0,
                                    "pageSize": 10000
                                }
                            };

                            return fetch(apiUrlBase, {
                                method: 'POST',
                                headers: headersItems,
                                body: JSON.stringify(payloadItems),
                                credentials: 'include' // Include cookies in the request
                            })
                                .then(response => response.json())
                                .then(data => {
                                    console.log(`Data for store ${storeId}:`, data);
                                    return data.itemsAvailability.filter(item => pluInput.includes(item.wfmScanCode)).map(item => {
                                        // Transformations
                                        // The API returns 'andon' as a boolean property (true = Enabled, false = Disabled)
                                        // This matches DownloadButton.js line 424 and ExistingItemEditor.js line 1324
                                        let currentState;
                                        let oppositeState;
                                        
                                        if (item.andon === true) {
                                            currentState = 'Enabled';
                                            oppositeState = 'Disabled';
                                        } else {
                                            // false, null, undefined, or any other falsy value = Disabled
                                            currentState = 'Disabled';
                                            oppositeState = 'Enabled';
                                        }
                                        return {
                                            'Store - 3 Letter Code': storeId,
                                            'originalAndonCord': currentState,
                                            'oppositeAndonCord': oppositeState,
                                            'Item Name': item.itemName,
                                            'Item PLU/UPC': item.wfmScanCode,
                                            'Availability': item.inventoryStatus,
                                            'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                                            'Sales Floor Capacity': '',
                                            'Tracking Start Date': '',
                                            'Tracking End Date': ''
                                        };
                                    });
                                })
                                .catch(error => {
                                    console.error(`Error downloading data for store ${storeId}:`, error);
                                    return [];
                                });
                        };

                        // Helper to split CSV into chunks of up to 1000 data rows (plus header)
                        function splitCsvIntoChunks(csvString, maxRowsPerChunk) {
                            const lines = csvString.split('\n');
                            const header = lines[0];
                            const dataRows = lines.slice(1);
                            const chunks = [];
                            for (let i = 0; i < dataRows.length; i += maxRowsPerChunk) {
                                const chunkRows = dataRows.slice(i, i + maxRowsPerChunk);
                                chunks.push([header, ...chunkRows].join('\n'));
                            }
                            return chunks;
                        }

                        // Fetch items for all stores and compile results
                        Promise.all(storeIds.map(storeId => fetchItemsForStore(storeId)))
                            .then(results => {
                                const allItems = results.flat();
                                console.log('Filtered items data:', allItems);

                                if (allItems.length > 0) {
                                    // Specify the correct headers to include
                                    const desiredHeaders = [
                                        'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC', 'Availability',
                                        'Current Inventory', 'Sales Floor Capacity', 'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
                                    ];

                                    // RFC 4180 compliant field escaping: wrap every
                                    // field in double quotes and double any embedded
                                    // double quotes so commas/quotes in item names do
                                    // not break the CSV structure.
                                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

                                    // For restore: use originalAndonCord
                                    const csvContentRestore = desiredHeaders.join(",") + "\n"
                                        + allItems.map(e =>
                                            desiredHeaders.map(header => {
                                                if (header === 'Andon Cord') return escapeCsv(e['originalAndonCord']);
                                                return escapeCsv(e[header]);
                                            }).join(",")
                                        ).join("\n");

                                    // For redrive: use oppositeAndonCord
                                    const csvContentRedrive = desiredHeaders.join(",") + "\n"
                                        + allItems.map(e =>
                                            desiredHeaders.map(header => {
                                                if (header === 'Andon Cord') return escapeCsv(e['oppositeAndonCord']);
                                                return escapeCsv(e[header]);
                                            }).join(",")
                                        ).join("\n");

                                    // Use JSZip to create a zip file containing both CSV files
                                    const zip = new JSZip();
                                    zip.file("Redrive Restore.csv", csvContentRestore);
                                    zip.file("Redrive.csv", csvContentRedrive);

                                    // Chunking logic for large files
                                    const maxRowsPerChunk = 1000;
                                    // For Restore
                                    const restoreRows = csvContentRestore.split('\n').length - 1;
                                    if (restoreRows > maxRowsPerChunk) {
                                        const restoreChunks = splitCsvIntoChunks(csvContentRestore, maxRowsPerChunk);
                                        const restoreFolder = zip.folder("Redrive Restore Chunks");
                                        restoreChunks.forEach((chunk, idx) => {
                                            restoreFolder.file(`chunk_${idx + 1}.csv`, chunk);
                                        });
                                    }
                                    // For Redrive
                                    const redriveRows = csvContentRedrive.split('\n').length - 1;
                                    if (redriveRows > maxRowsPerChunk) {
                                        const redriveChunks = splitCsvIntoChunks(csvContentRedrive, maxRowsPerChunk);
                                        const redriveFolder = zip.folder("Redrive Chunks");
                                        redriveChunks.forEach((chunk, idx) => {
                                            redriveFolder.file(`chunk_${idx + 1}.csv`, chunk);
                                        });
                                    }

                                    zip.generateAsync({ type: "blob" })
                                        .then(function (content) {
                                            // Create a download link for the zip file
                                            const link = document.createElement("a");
                                            link.href = URL.createObjectURL(content);
                                            link.download = "RedriveFiles.zip";
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        });
                                } else {
                                    console.log('No items data available to download.');
                                }
                            });
                    })
                    .catch(error => console.error('Error downloading data:', error))
                    .finally(function() {
                        if (window.TmTheme) window.TmTheme.clearButtonLoading(genRedriveBtn);
                        document.getElementById('redriveLoadingIndicator').style.display = 'none';
                    });
            });
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addRedriveButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the redrive button
    addRedriveButton();

    // Module export for testing (at end of IIFE)
    try {
        module.exports = { addRedriveButton };
    } catch (e) {
        // Browser environment
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module RedriveButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: GeneralHelpToolsButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Style configurations
    // Dark-mode style configurations using --tm-* design tokens
    const STYLES = {
        button: {
            position: 'fixed',
            bottom: '0',
            left: '80%',
            width: '20%',
            height: '40px',
            zIndex: '1000',
            fontSize: '14px',
            backgroundColor: '#1a1a1a',
            color: '#f1f1f1',
            border: '1px solid #303030',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background 150ms ease',
            fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
        },
        overlay: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            zIndex: '9995',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        },
        formContainer: {
            position: 'relative',
            background: '#1a1a1a',
            padding: '0',
            borderRadius: '12px',
            width: '650px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid #303030',
            fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            overflow: 'hidden',
            color: '#f1f1f1'
        },
        headerBar: {
            background: '#242424',
            color: '#f1f1f1',
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #303030'
        },
        closeButton: {
            fontSize: '22px',
            cursor: 'pointer',
            color: '#aaaaaa',
            background: 'transparent',
            border: 'none',
            padding: '0 4px',
            borderRadius: '4px',
            transition: 'color 150ms ease'
        },
        contentArea: {
            padding: '16px',
            maxHeight: '80vh',
            overflowY: 'auto'
        },
        buttonGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '16px'
        },
        toolButton: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #3f3f3f',
            borderRadius: '4px',
            backgroundColor: '#242424',
            color: '#f1f1f1',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            textAlign: 'center',
            fontFamily: 'inherit'
        },
        sectionHeader: {
            margin: '8px 0 4px 0',
            fontSize: '13px',
            color: 'var(--tm-accent-primary, #3ea6ff)',
            fontWeight: '600',
            gridColumn: '1 / -1',
            padding: '6px 0 2px',
            borderBottom: '1px solid #303030'
        },
        linkSection: {
            textAlign: 'center',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #303030'
        },
        link: {
            display: 'block',
            marginTop: '8px',
            color: 'var(--tm-accent-primary, #3ea6ff)',
            textDecoration: 'none',
            fontSize: '13px'
        }
    };

    // Apply styles to element
    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    // Create main button
    function createMainButton() {
        const button = document.createElement('button');
        button.id = 'generalHelpToolsButton';
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Help Tools';
        button.className = 'button';
        
        applyStyles(button, STYLES.button);
        
        // Hover effects
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#242424';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#1a1a1a';
        });
        
        return button;
    }

    // Create overlay structure
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'generalHelpOverlay';
        applyStyles(overlay, STYLES.overlay);
        
        // Close overlay when clicking outside
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                overlay.style.display = 'none';
            }
        });
        
        return overlay;
    }

    // Create header with close button
    function createHeader() {
        const headerBar = document.createElement('div');
        applyStyles(headerBar, STYLES.headerBar);
        
        const title = document.createElement('span');
        title.textContent = 'General Help Tools';
        
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        applyStyles(closeButton, STYLES.closeButton);
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#f1f1f1';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#aaaaaa';
        });
        closeButton.addEventListener('click', () => {
            document.getElementById('generalHelpOverlay').style.display = 'none';
        });
        
        headerBar.appendChild(title);
        headerBar.appendChild(closeButton);
        
        return headerBar;
    }

    // Create main tool buttons -- organized by category
    function createToolButtons() {
        const svgAttr = 'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"';
        const toolCategories = [
            {
                label: `<svg ${svgAttr}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Text / Code Tools`,
                buttons: [
                    { id: 'pluDedupeListButton', text: 'PLU Dedupe & List' },
                    { id: 'scanCodeTo13PLUButton', text: 'Scan Code to 13-PLU' },
                    { id: 'pluToAsinButton', text: 'PLU to ASIN' }
                ]
            },
            {
                label: `<svg ${svgAttr}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Store / Item Lookup`,
                buttons: [
                    { id: 'getMerchantIdButton', text: 'Get eMerchant IDs' },
                    { id: 'getAllStoreInfoButton', text: 'Get All Store Info' },
                    { id: 'auditHistoryPullButton', text: 'Audit History Pull' },
                    { id: 'desyncFinderButton', text: 'Desync Finder' }
                ]
            },
            {
                label: `<svg ${svgAttr}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> File Processing`,
                buttons: [
                    { id: 'filechunker', text: 'File Chunker' },
                    { id: 'massUploaderButton', text: 'Mass File Upload' },
                    { id: 'componentUploadBuilderButton', text: 'Component Upload Builder' }
                ]
            },
            {
                label: `<svg ${svgAttr}><path d="M16 16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="12" height="12" rx="2"/></svg> Inventory Converters`,
                buttons: [
                    { id: 'meatInventoryToUploadConverterButton', text: 'Meat Inventory Converter' },
                    { id: 'prepFoodsInventoryButton', text: 'PFDS Inventory Converter' }
                ]
            }
        ];

        const buttonGrid = document.createElement('div');
        applyStyles(buttonGrid, STYLES.buttonGrid);

        toolCategories.forEach(({ label, buttons }) => {
            const sectionHeader = document.createElement('div');
            applyStyles(sectionHeader, STYLES.sectionHeader);
            sectionHeader.innerHTML = label;
            buttonGrid.appendChild(sectionHeader);

            buttons.forEach(({ id, text }) => {
                const button = document.createElement('button');
                button.id = id;
                button.textContent = text;
                applyStyles(button, STYLES.toolButton);
                
                // Hover effects
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = '#2d2d2d';
                    button.style.borderColor = 'var(--tm-accent-primary, #3ea6ff)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.backgroundColor = '#242424';
                    button.style.borderColor = '#3f3f3f';
                });
                
                buttonGrid.appendChild(button);
            });
        });

        return buttonGrid;
    }

    // Create links section
    function createLinksSection() {
        const linksSection = document.createElement('div');
        applyStyles(linksSection, STYLES.linkSection);
        
        const creditsLink = document.createElement('a');
        creditsLink.href = '#';
        creditsLink.id = 'creditsLink';
        creditsLink.textContent = 'Credits';
        applyStyles(creditsLink, STYLES.link);
        
        creditsLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.TmTheme && window.TmTheme.showToast) {
                window.TmTheme.showToast('v3.2.0 -- Ryan Satterfield -- Unofficial tool', 'info', 4000);
            }
        });
        
        const dailyLink = document.createElement('a');
        dailyLink.href = 'https://share.amazon.com/sites/WFM_eComm_ABI/_layouts/15/download.aspx?SourceUrl=%2Fsites%2FWFM%5FeComm%5FABI%2FShared%20Documents%2FWFMOAC%2FDailyInventory%2FWFMOAC%20Inventory%20Data%2Exlsx&FldUrl=&Source=https%3A%2F%2Fshare%2Eamazon%2Ecom%2Fsites%2FWFM%5FeComm%5FABI%2FShared%2520Documents%2FForms%2FAllItems%2Easpx%3FRootFolder%3D%252Fsites%252FWFM%255FeComm%255FABI%252FShared%2520Documents%252FWFMOAC%252FDailyInventory%26FolderCTID%3D0x0120007B3CF5C516656843AD728338D9C2AFA4';
        dailyLink.target = '_blank';
        dailyLink.id = 'dailyLink';
        dailyLink.textContent = 'Daily Seller Inventory';
        applyStyles(dailyLink, STYLES.link);
        
        linksSection.appendChild(creditsLink);
        linksSection.appendChild(dailyLink);
        
        return linksSection;
    }

    // Create complete modal content
    function createModalContent() {
        const formContainer = document.createElement('div');
        applyStyles(formContainer, STYLES.formContainer);
        
        const contentArea = document.createElement('div');
        applyStyles(contentArea, STYLES.contentArea);
        
        // Assemble the modal
        formContainer.appendChild(createHeader());
        contentArea.appendChild(createToolButtons());
        contentArea.appendChild(createLinksSection());
        formContainer.appendChild(contentArea);
        
        return formContainer;
    }

    // Show overlay
    function showOverlay() {
        const existingOverlay = document.getElementById('generalHelpOverlay');
        if (existingOverlay) {
            existingOverlay.style.display = 'flex';
            return;
        }
        
        const overlay = createOverlay();
        const modalContent = createModalContent();
        
        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
    }

    // Main function to add the General Help Tools button
    function addGeneralHelpToolsButton() {
        console.log('[HelpTools] Attempting to add General Help Tools button');

        // Check if the button already exists
        if (document.getElementById('generalHelpToolsButton')) {
            console.log('General Help Tools button already exists');
            return;
        }

        const button = createMainButton();
        button.addEventListener('click', () => {
            console.log('General Help Tools button clicked');
            showOverlay();
        });

        document.body.appendChild(button);
        console.log('General Help Tools button added to the page');
    }

    // Export for testing
    try {
        module.exports = {
            addGeneralHelpToolsButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(() => {
        if (!document.getElementById('generalHelpToolsButton')) {
            addGeneralHelpToolsButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the General Help Tools button
    addGeneralHelpToolsButton();
})();
} catch (e) {
  console.error('[CAM_Tools] Module GeneralHelpToolsButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: PLUDedupeListButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addPLUDedupeListFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addPLUDedupeListFunctionality() {
        console.log('[PLUDedupe] Button clicked');
        if(document.getElementById('pluDedupeOverlay')) return;
        // Create overlay
const overlay = document.createElement('div');
        overlay.id = 'pluDedupeOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        let uniqueNumbers = [];
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
            // Copy to clipboard
            navigator.clipboard.writeText(uniqueNumbers.join(', ')).then(() => {
                // Display "Copied!" message
                const copiedMessage = document.createElement('div');
                copiedMessage.innerText = 'Copied!';
                copiedMessage.style.position = 'fixed';
                copiedMessage.style.bottom = '10px';
                copiedMessage.style.right = '10px';
                copiedMessage.style.backgroundColor = '#4CAF50';
                copiedMessage.style.color = '#fff';
                copiedMessage.style.padding = '10px';
                copiedMessage.style.borderRadius = '5px';
                document.body.appendChild(copiedMessage);

                // Remove the message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(copiedMessage);
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
        });
        });

const formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create input and output elements
        formContainer.innerHTML = `
            <h3>PLU Dedupe & List</h3>
            <textarea id="pluInput" style="width: 100%; height: 100px; margin-bottom: 10px;" placeholder="Paste numbers here..."></textarea>
            <button id="transformButton" style="width: 100%; margin-bottom: 10px;">Transform</button>
            <div id="pluOutput" style="width: 100%; height: 100px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Transform" button
        document.getElementById('transformButton').addEventListener('click', function() {
            const input = document.getElementById('pluInput').value;
            const numbers = input.split(/\s+/).map(num => num.trim()).filter(num => num !== '');
            uniqueNumbers = Array.from(new Set(numbers));
            const outputText = uniqueNumbers.join(', ');
            document.getElementById('pluOutput').innerText = outputText;

            // Copy to clipboard
            navigator.clipboard.writeText(outputText).then(() => {
                // Display "Copied!" message on the Transform button
                const transformButton = document.getElementById('transformButton');
                const originalText = transformButton.innerText;
                transformButton.innerText = 'Copied!';
                setTimeout(() => {
                    transformButton.innerText = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const pluDedupeListButton = document.getElementById('pluDedupeListButton');
                if (pluDedupeListButton) {
                    pluDedupeListButton.addEventListener('click', addPLUDedupeListFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module PLUDedupeListButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: NISFileToCAMUploadButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addNISFileToCAMUploadFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addNISFileToCAMUploadFunctionality() {
        console.log('[NISUpload] Button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'nisFileUploadOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
        var closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>NIS File to CAM Upload</h3>
            <input type="file" id="nisFileInput" style="width: 100%; margin-bottom: 10px;">
            <label>Andon Cord</label>
            <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
            </select>
            <label>Store/Region</label>
            <input type="text" id="storeRegionInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter Store/Region codes separated by commas">
            <button id="uploadButton" style="width: 100%;">Convert & Download</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Upload" button
        document.getElementById('uploadButton').addEventListener('click', function() {
            const fileInput = document.getElementById('nisFileInput');
            if (fileInput.files.length === 0) {
                alert('Please select a file to upload.');
                return;
            }

            const file = fileInput.files[0];
            console.log('File selected:', file.name);
            // Logic to handle file upload goes here
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const nisFileToCAMUploadButton = document.getElementById('nisFileToCAMUploadButton');
                if (nisFileToCAMUploadButton) {
                    nisFileToCAMUploadButton.addEventListener('click', addNISFileToCAMUploadFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module NISFileToCAMUploadButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: ScanCodeTo13PLUButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Function to add the Scan Code to 13-PLU button functionality
    function addScanCodeTo13PLUFunctionality() {
        console.log('[ScanCode] Button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'scanCodeTo13PLUOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
        var closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Scan Code to 13-PLU</h3>
            <textarea id="scanCodeInput" style="width: 100%; height: 100px; margin-bottom: 10px;" placeholder="Enter scan codes here..."></textarea>
            <label>Output Format</label>
            <select id="outputFormatSelect" style="width: 100%; margin-bottom: 10px;">
                <option value="excel">Excel</option>
                <option value="comma">Comma Separated List</option>
            </select>
            <button id="convertButton" style="width: 100%; margin-bottom: 10px;">Convert</button>
            <div id="pluOutput" style="width: 100%; height: 100px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
            <button id="copyButton" style="width: 100%; margin-top: 10px;">Copy to Clipboard</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Convert" button
        document.getElementById('convertButton').addEventListener('click', function() {
            const input = document.getElementById('scanCodeInput').value;
            const scanCodes = input.split(/[\s,]+/).map(code => code.replace(/\s+/g, '').trim()).filter(code => code !== '');
            const pluCodes = scanCodes.map(code => {
                const upcCode = getUPC(code);
                return getEAN(upcCode);
            });
            const outputFormat = document.getElementById('outputFormatSelect').value;
            const outputText = outputFormat === 'excel' ? pluCodes.join('\n') : pluCodes.join(', ');
            document.getElementById('pluOutput').innerText = outputText;
        });

        // Add event listener to the "Copy to Clipboard" button
        document.getElementById('copyButton').addEventListener('click', function() {
            const outputText = document.getElementById('pluOutput').innerText;
            navigator.clipboard.writeText(outputText).then(() => {
                alert('Output copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });

        // Function to convert to 12-digit UPC
        function getUPC(sku) {
            const upc = ('000000000000' + sku).slice(-12);
            return upc;
        }

        // Function to calculate EAN-13 from 12-digit UPC
        function getEAN(upc) {
            if (upc.length !== 12) {
                return 'Length not 12';
            }
            return upc + calculateCheckDigit(upc);
        }

        // Function to calculate check digit
        function calculateCheckDigit(code) {
            const oddSum = [0, 2, 4, 6, 8, 10].reduce((sum, i) => sum + parseInt(code[i]), 0);
            const evenSum = [1, 3, 5, 7, 9, 11].reduce((sum, i) => sum + parseInt(code[i]), 0);
            const totalSum = oddSum + evenSum * 3;
            const nextTen = Math.ceil(totalSum / 10) * 10;
            return nextTen - totalSum;
        }

    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const scanCodeTo13PLUButton = document.getElementById('scanCodeTo13PLUButton');
                if (scanCodeTo13PLUButton) {
                    scanCodeTo13PLUButton.addEventListener('click', addScanCodeTo13PLUFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module ScanCodeTo13PLUButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: PLUToASINButton.js
 * ================================================================ */
try {
(function () {
    'use strict';
  
    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addPLUToASINFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addPLUToASINFunctionality() {
      console.log('[PLUtoASIN] Button clicked');
  
      // Create overlay
      var overlay = document.createElement('div');
      overlay.id = 'pluToAsinOverlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      overlay.style.zIndex = '9995';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
  
      // Create close button
      var closeButton = document.createElement('span');
      closeButton.innerHTML = '&times;';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.color = '#fff';
      closeButton.style.backgroundColor = '#000';
      closeButton.style.padding = '5px';
      closeButton.style.borderRadius = '0';
      closeButton.addEventListener('click', function () {
        document.body.removeChild(overlay);
      });
  
      // Container for the form
      var formContainer = document.createElement('div');
      formContainer.style.position = 'relative';
      formContainer.style.backgroundColor = '#1a1a1a';
      formContainer.style.color = '#f1f1f1';
      formContainer.style.padding = '20px';
      formContainer.style.borderRadius = '5px';
      formContainer.style.width = '300px';
  
      // Create form elements
      formContainer.innerHTML = `
        <h3>PLU to ASIN</h3>
        <label>Store Code</label>
        <input type="text" id="storeCodeInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter 3-letter store code">
        <label>PLU(s)</label>
        <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
        <button id="convertButton" style="width: 100%; margin-bottom: 10px;">Convert</button>
        <div id="outputTable" style="width: 100%; height: 200px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        <button id="exportCsvButton" style="width: 100%; margin-top: 10px;">Export to CSV</button>
      `;
  
      formContainer.appendChild(closeButton);
      overlay.appendChild(formContainer);
      document.body.appendChild(overlay);
  
      // Event listener for the "Convert" button
      document.getElementById('convertButton').addEventListener('click', function () {
        const storeCode = document.getElementById('storeCodeInput').value.trim();
        const pluInput = document.getElementById('pluInput').value;
        const pluCodes = pluInput.split(',').map(plu => plu.trim()).filter(plu => plu !== '');
  
        // Detect gamma or prod environment
        const apiUrlBase = `https://${window.location.hostname.includes('gamma') ? 'gamma' : 'prod'}.cam.wfm.amazon.dev/api/`;
  
        Promise.all(
          pluCodes.map(plu => {
            const payload = { storeId: storeCode, wfmScanCode: plu };
            console.log('Payload:', payload);
  
            return fetch(apiUrlBase, {
              method: 'POST',
              headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                // 'amz-sdk-invocation-id': '4e6108fd-1eee-4e74-afc3-c9f68d0237c1', // if required, uncomment
                'amz-sdk-request': 'attempt=1; max=1',
                'content-type': 'application/x-amz-json-1.0',
                'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Microsoft_Edge_131.0.0.0',
                'Referer': `https://prod.cam.wfm.amazon.dev/store/${storeCode}/item/${plu}`,
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'x-amz-target': 'WfmCamBackendService.GetItemAvailability'
              },
              body: JSON.stringify(payload),
              credentials: 'include' // Ensure cookies/certs are sent with the request
            })
              .then(response => {
                console.log('Response:', response);
                return response.json();
              })
              .then(data => {
                console.log('Data:', data);
                console.log('Item Availability:', data.itemAvailability);
                
                // If itemAvailability isn't present, fallback:
                if (!data.itemAvailability) {
                  return {
                    plu,
                    asin: 'error',
                    merchantId: 'error',
                    currentInventoryQuantity: 'error',
                    itemName: 'error'
                  };
                }
  
                // Return only the relevant fields
                return {
                  plu,
                  asin: data.itemAvailability.asin || 'error',
                  merchantId: data.itemAvailability.merchantId || 'error',
                  currentInventoryQuantity: data.itemAvailability.currentInventoryQuantity || 'error',
                  itemName: data.itemAvailability.itemName || 'error'
                };
              })
              .catch(err => {
                console.error(`Fetch error for PLU "${plu}":`, err);
                return {
                  plu,
                  asin: 'error',
                  merchantId: 'error',
                  currentInventoryQuantity: 'error',
                  itemName: 'error'
                };
              });

          })
        ).then(results => {
          document.getElementById('exportCsvButton').addEventListener('click', function () {
            // RFC 4180 compliant field escaping: wrap each field in double quotes and
            // double any embedded double quotes so commas/quotes in item names do not
            // break the CSV structure.
            const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
            const csvContent = ["PLU,ASIN,Merchant ID,Item Name"]
              .concat(results.map(result =>
                [result.plu, result.asin, result.merchantId, result.itemName].map(escapeCsv).join(",")
              ))
              .join("\r\n");

            // Use a Blob instead of a data: URI: a data URI run through encodeURI()
            // leaves '#' unencoded, and the browser treats '#' as the URI fragment
            // delimiter, silently truncating the file at the first '#' in any item
            // name. The BOM ensures Excel reads UTF-8.
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", objectUrl);
            link.setAttribute("download", "plu_to_asin_data.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
          });

          // Build the table content with the 5 columns
          const tableContent = results
            .map(result => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: left;">${result.plu}</td>
                <td style="padding: 8px; text-align: left;">${result.asin}</td>
              </tr>
            `)
            .join('');
  
          document.getElementById('outputTable').innerHTML = `
            <table style="width: auto; border-collapse: collapse; table-layout: auto;">
              <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                  <th style="padding: 8px; text-align: left;">PLU</th>
                  <th style="padding: 8px; text-align: left;">ASIN</th>
                </tr>
              </thead>
              <tbody>
                ${tableContent}
              </tbody>
            </table>
          `;
        });
      });
    }
  
    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
          const pluToAsinButton = document.getElementById('pluToAsinButton');
          if (pluToAsinButton) {
            pluToAsinButton.addEventListener('click', addPLUToASINFunctionality);
            observer.disconnect(); // Stop observing once the button is found
          }
        }
      });
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  })();
} catch (e) {
  console.error('[CAM_Tools] Module PLUToASINButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: DownloadButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    function addDownloadButton() {
        console.log('[Download] Attempting to add download data button');

        // Check if the button already exists
        if (document.getElementById('downloadDataButton')) {
            console.log('Download data button already exists');
            return;
        }

        // Create the download data button
        const downloadButton = document.createElement('button');
        downloadButton.id = 'downloadDataButton';
        downloadButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Data`;
        downloadButton.className = 'button';

        downloadButton.style.position = 'fixed';
        downloadButton.style.bottom = '0';
        downloadButton.style.left = '0';
        downloadButton.style.width = '20%';
        downloadButton.style.height = '40px';
        downloadButton.style.zIndex = '1000';

        document.body.appendChild(downloadButton);
        console.log('[Download] Button added to the page');

        // Add click event to the download data button to show options overlay
        downloadButton.addEventListener('click', function() {
            console.log('[Download] Button clicked');

            // Create overlay (dark)
            const overlay = document.createElement('div');
            overlay.id = 'downloadOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container (dark)
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '400px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.maxHeight = '90vh';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar (dark)
            const headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '12px 16px';
            headerBar.style.fontSize = '16px';
            headerBar.style.fontWeight = '600';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.borderBottom = '1px solid #303030';

            headerBar.innerHTML = `
                <span style="display:flex;align-items:center;gap:8px;">
                    Download Data
                    <span id="overlayInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#3f3f3f;color:#f1f1f1;cursor:pointer;outline:none;transition:background 150ms ease;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                    </span>
                </span>
            `;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'downloadOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '16px';
            closeButton.style.color = '#aaaaaa';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'color 150ms ease';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.color = '#f1f1f1';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.color = '#aaaaaa';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
            formContainer.appendChild(headerBar);
// Info/disclaimer box (dark)
const infoBox = document.createElement('div');
infoBox.id = 'downloadOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '54px';
infoBox.style.left = '24px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.padding = '16px 22px 16px 18px';
infoBox.style.borderRadius = '8px';
infoBox.style.fontSize = '14px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
infoBox.style.zIndex = '9999';
infoBox.style.border = '1px solid #303030';
infoBox.style.minWidth = '270px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;color:#f1f1f1;">Download Data</div>
            Download item data as a CSV file based on your selected filters.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li><b>Everything, Everywhere</b>: Select this to download all available data, ignoring other filters.</li>
                <li><b>Specific PLUs</b>: Enter one or more PLU codes (comma-separated) to limit the download to those items.</li>
                <li><b>All PLUs</b>: Check to include all PLUs (overrides the specific PLUs field).</li>
                <li><b>By Store/Region</b>: Choose whether to filter by Store or Region, then enter the relevant codes in the field below.</li>
                <li><b>All Stores/Regions</b>: Check to include all stores/regions (overrides the Store/Region field).</li>
                <li>Click <b>Download</b> to start the process. The system will fetch and compile the data based on your selections. Progress will be shown during the download.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>If you select "Everything, Everywhere", all other options are ignored.</li>
                <li>Use filters to limit the data to only what you need for faster downloads.</li>
                <li>If you encounter issues, try reducing the number of stores or PLUs selected.</li>
            </ul>
            <div style="margin:7px 0 0 0;font-weight:600;">Disclaimer:</div>
            The downloaded file <b>cannot be directly uploaded</b> elsewhere. You must convert or format it as required for uploads.
        </div>
        <button id="closeInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('overlayInfoIcon');
    var infoBox = document.getElementById('downloadOverlayInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(24, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);


            // Content area (dark)
            const contentArea = document.createElement('div');
            contentArea.style.padding = '16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '10px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            contentArea.className = 'tm-form-stack';

            contentArea.innerHTML = `
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="everythingCheckbox">
                    <span>Everything, Everywhere</span>
                </label>
                <label class="tm-field-label">Specific PLUs</label>
                <input type="text" id="pluInput" class="tm-input" placeholder="PLUs, comma-separated">
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="allPlusCheckbox">
                    <span>All PLUs</span>
                </label>
                <label class="tm-field-label">By</label>
                <select id="bySelect" class="tm-select">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label class="tm-field-label">Store/Region</label>
                <input type="text" id="storeRegionInput" class="tm-input" placeholder="Codes, comma-separated">
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="allStoresCheckbox">
                    <span>All Stores/Regions</span>
                </label>
                <button id="executeDownloadButton" class="tm-form-action">Download</button>
                <div id="downloadProgress" style="display:none;text-align:center;font-size:13px;color:var(--tm-accent-primary, #3ea6ff);">Wait for Parameters</div>
                <button id="cancelDownloadButton" class="tm-form-cancel">Cancel</button>
            `;
            formContainer.appendChild(contentArea);

            // "Everything" checkbox disables all other options if checked
            formContainer.querySelector('#everythingCheckbox').addEventListener('change', function() {
                const allPlus = document.getElementById('allPlusCheckbox');
                const bySelect = document.getElementById('bySelect');
                const storeRegionInput = document.getElementById('storeRegionInput');
                const allStores = document.getElementById('allStoresCheckbox');
                if(this.checked) {
                    allPlus.disabled = true;
                    bySelect.disabled = true;
                    storeRegionInput.disabled = true;
                    allStores.disabled = true;
                } else {
                    allPlus.disabled = false;
                    bySelect.disabled = false;
                    storeRegionInput.disabled = false;
                    allStores.disabled = false;
                }
            });

            // If "All Stores/Regions" is checked, disable storeRegionInput
            formContainer.querySelector('#allStoresCheckbox').addEventListener('change', function() {
                const storeRegionInput = document.getElementById('storeRegionInput');
                storeRegionInput.disabled = this.checked;
                if(this.checked) {
                    storeRegionInput.value = '';
                }
            });

            // Cancel download: remove overlay
            formContainer.querySelector('#cancelDownloadButton').addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Execute download button event
            formContainer.querySelector('#executeDownloadButton').addEventListener('click', function() {
                const dlBtn = document.getElementById('executeDownloadButton');
                const progress = document.getElementById('downloadProgress');
                progress.style.display = 'block';
                progress.innerHTML = 'Wait for Parameters';
                if (window.TmTheme) window.TmTheme.setButtonLoading(dlBtn, 'Downloading...');

                const everythingChecked = document.getElementById('everythingCheckbox').checked;
                const allPlusChecked = document.getElementById('allPlusCheckbox').checked;
                
                // For PLUs, if allPlus or everything is checked, use all PLUs (empty array means no filtering)
                const pluInput = allPlusChecked || everythingChecked ? [] : Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim()))).filter(Boolean);
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim()))).filter(Boolean);
                
                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

                // Update progress: processing parameters
                progress.innerHTML = 'Processing...';

                // Define the API endpoint and headers for getting stores
                const headersStores = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
                };

                // Call the API to get stores information
                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(storeData => {
                    console.log('Store data received:', storeData);
                    if(!storeData || !storeData.storesInformation) {
                        throw new Error('Invalid store data received');
                    }
                    
                    // Build storeIds array based on user selections.
                    const storeIds = [];
                    for(const region in storeData.storesInformation) {
                        const states = storeData.storesInformation[region];
                        for(const state in states) {
                            const stores = states[state];
                            stores.forEach(store => {
                                if(document.getElementById('allStoresCheckbox').checked || everythingChecked) {
                                    storeIds.push(store.storeTLC);
                                } else {
                                    const regionCode = region.split('-').pop();
                                    if((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                       (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                        storeIds.push(store.storeTLC);
                                    }
                                }
                            });
                        }
                    }

                    // Update progress: Downloading
                    progress.innerHTML = 'Downloading';

                    const batchSize = 5;
                    const storeIdBatches = [];
                    for(let i = 0; i < storeIds.length; i += batchSize) {
                        storeIdBatches.push(storeIds.slice(i, i + batchSize));
                    }
                    let completed = 0;
                    const total = storeIds.length;
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                    const headersItems = {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                    };
                    
                    const fetchItemsForStores = (storeIdsBatch) => {
                        const payloadItems = {
                            "filterContext": {
                                "storeIds": storeIdsBatch
                            },
                            "paginationContext": {
                                "pageNumber": 0,
                                "pageSize": 9999
                            }
                        };
                        return fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersItems,
                            body: JSON.stringify(payloadItems),
                            credentials: 'include'
                        })
                        .then(response => response.json())
    .then(data => {
        console.log('Data for store batch:', data);
        let items = data.itemsAvailability;
        // Filter items by PLU if user provided specific PLUs in the text field (pluInput)
        if (pluInput.length > 0) {
            items = items.filter(item => pluInput.includes(item.wfmScanCode));
        }
        return items.map(item => {
            item.andon = item.andon === true ? 'Enabled' : 'Disabled';
            if (item.inventoryStatus === 'Unlimited') {
                item.currentInventoryQuantity = 0;
            } else if (item.inventoryStatus === 'Limited') {
                const currQty = Number(item.currentInventoryQuantity);
                item.currentInventoryQuantity = isNaN(currQty) ? 0 : Math.max(0, Math.min(10000, currQty));
            }
            item.reservedQuantity = (item.reservedQuantity !== undefined && item.reservedQuantity !== '') ? Number(item.reservedQuantity) : 0;
            item.hasAndonEnabledComponent = item.hasAndonEnabledComponent || 'FALSE';
            item.isMultiChannel = item.isMultiChannel || 'FALSE';
            item.salesFloorCapacity = (item.salesFloorCapacity !== undefined && item.salesFloorCapacity !== '') ? Number(item.salesFloorCapacity) : 0;
            item.wfmoaReservedQuantity = (item.wfmoaReservedQuantity !== undefined && item.wfmoaReservedQuantity !== '') ? Number(item.wfmoaReservedQuantity) : 0;
            return item;
        });
    })
                        .catch(error => {
                            console.error('Error fetching items for batch:', error);
                            return [];
                        });
                    };

                    const retryLimit = 10;
                    const fetchWithRetry = async (storeIdsBatch, attempt = 1) => {
                        try {
                            await delay(100);
                            return fetchItemsForStores(storeIdsBatch);
                        } catch (error) {
                            if(attempt < retryLimit) {
                                console.warn(`Retrying batch, attempt ${attempt+1}`);
                                return fetchWithRetry(storeIdsBatch, attempt + 1);
                            } else {
                                console.error('Failed batch after retries');
                                return [];
                            }
                        }
                    };

                    Promise.all(storeIdBatches.map(batch => {
                        return fetchWithRetry(batch).then(result => {
                            completed += batch.length;
                            const percent = Math.round((completed / total) * 100);
                            progress.innerHTML = `Compiling Data: ${completed}/${total} stores (${percent}%)`;
                            return result;
                        });
                    }))
                    .then(results => {
                        const allItems = results.flat();
                        console.log('All items data:', allItems);
                        if(allItems.length > 0) {
                            const desiredHeaders = Object.keys(allItems[0]);
                            
                            // RFC 4180 compliant field escaping: wrap each field in
                            // double quotes and double any embedded double quotes so
                            // commas/quotes in item names do not break the CSV.
                            const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

                            // Build CSV content efficiently without stack overflow
                            const csvRows = [desiredHeaders.join(",")];
                            
                            // Process items in chunks to avoid stack overflow
                            for (let i = 0; i < allItems.length; i++) {
                                const row = desiredHeaders.map(header => escapeCsv(allItems[i][header])).join(",");
                                csvRows.push(row);
                            }
                            
                            const csvContent = csvRows.join("\r\n");
                            
                            // Use Blob instead of data URI to handle large files
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", "Cam_Item_Data.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up the blob URL
                            URL.revokeObjectURL(url);
                            
                            progress.innerHTML = 'Done';
                            if (window.TmTheme) window.TmTheme.clearButtonLoading(dlBtn, 'Download');
                        } else {
                            progress.innerHTML = 'No data available.';
                            if (window.TmTheme) window.TmTheme.clearButtonLoading(dlBtn, 'Download');
                        }
                    })
                    .catch(error => {
                        console.error('Error during download process:', error);
                        progress.innerHTML = 'An error occurred.';
                        if (window.TmTheme) window.TmTheme.clearButtonLoading(dlBtn, 'Download');
                    });
                })
                .catch(error => {
                    console.error('Error fetching stores:', error);
                    progress.innerHTML = 'Error fetching store data.';
                    if (window.TmTheme) window.TmTheme.clearButtonLoading(dlBtn, 'Download');
                });
            });
        });
    }

    // Use MutationObserver to detect changes and add the download button when needed
    const observer = new MutationObserver(addDownloadButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the download data button
    addDownloadButton();

    // Module export for testing (at end of IIFE)
    try {
        module.exports = { addDownloadButton };
    } catch (e) {
        // Browser environment
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module DownloadButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: GetMerchantIDFromStoreCode.js
 * ================================================================ */
try {
(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            getMerchantIDFromStoreCode
        };
    } catch (e) {
        // Handle the error if needed
    }

    function getMerchantIDFromStoreCode() {
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'merchantIdOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
        var closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        closeButton.addEventListener('click', function () {
            document.body.removeChild(overlay);
        });

        // Container for the form
        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Get Merchant ID from Store Code</h3>
            <label>Store Code</label>
            <input type="text" id="storeCodeInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter 3-letter store code">
            <button id="getMerchantIdButtonUnique" style="width: 100%; margin-bottom: 10px;">Get Merchant ID</button>
            <div id="merchantIdOutput" style="width: 100%; height: 50px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        `;  //TODO: Confirm the event listener for the button here is properly enabled.

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Event listener for the "Get Merchant ID" button
        document.getElementById('getMerchantIdButtonUnique').addEventListener('click', function () {
            const storeCode = document.getElementById('storeCodeInput').value.trim().toUpperCase();
            const storeCodePattern = /^[A-Z]{3}$/;
            if (!storeCodePattern.test(storeCode)) {
                console.error('[GetMerchantIDFromStoreCode.js] Store code is empty or invalid.');
                document.getElementById('merchantIdOutput').innerText = 'Invalid store code. Please enter a valid code.';
                return;
            }
            console.log('[GetMerchantIDFromStoreCode.js] Store Code:', storeCode);
            console.log('Getting Merchant ID for Store Code:', storeCode);

            // Determine the environment (prod or gamma)
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            // Define the API endpoint and headers for getting items
            const headersItems = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
            };

            const payloadItems = {
                "filterContext": {
                    "storeIds": [storeCode]
                },
                "paginationContext": {
                    "pageNumber": 0,
                    "pageSize": 10000
                }
            };

            // Fetch all store items
            fetch(apiUrlBase, {
                method: 'POST',
                headers: headersItems,
                body: JSON.stringify(payloadItems),
                credentials: 'include' // Include cookies in the request
            })
            .then(response => response.json())
            .then(data => {
                console.log('[GetMerchantIDFromStoreCode.js] Items data received:', data);
                const items = data.itemsAvailability;
                if (!items || items.length === 0) {
                    throw new Error('No items found for this store code.');
                }
                // Pick a random PLU
                const randomPLU = items[Math.floor(Math.random() * items.length)].wfmScanCode;
                console.log('Random PLU selected:', randomPLU);

                // Use the random PLU to get Merchant ID
                const merchantApiUrl = apiUrlBase;
                const headersMerchant = {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'x-amz-target': 'WfmCamBackendService.GetItemAvailability',
                    'amz-sdk-request': 'attempt=1; max=1',
                    'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Microsoft_Edge_131.0.0.0',
                    'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${storeCode}/item/${randomPLU}`,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                };
                const payloadMerchant = {
                    storeId: storeCode,
                    wfmScanCode: randomPLU
                };

                return fetch(merchantApiUrl, {
                    method: 'POST',
                    headers: headersMerchant,
                    body: JSON.stringify(payloadMerchant),
                    credentials: 'include' // Include cookies in the request
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('[GetMerchantIDFromStoreCode.js] Merchant ID data received:', data);
                console.log('[GetMerchantIDFromStoreCode.js] Merchant ID:', data.itemAvailability.merchantId, data.itemAvailability.wfmoaMerchantId);
                document.getElementById('merchantIdOutput').innerText = `Catering eMerchant ID: ${data.itemAvailability.merchantId} \nWFMOA eMerchant ID: ${data.itemAvailability.wfmoaMerchantId}`;
            })
            .catch(error => {
                console.error('[GetMerchantIDFromStoreCode.js] Error fetching Merchant ID:', error);
                document.getElementById('merchantIdOutput').innerText = 'Error fetching Merchant ID';
            });
        });

    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const getMerchantIdButton = document.getElementById('getMerchantIdButton');
                if (getMerchantIdButton) {
                    getMerchantIdButton.addEventListener('click', getMerchantIDFromStoreCode);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
} catch (e) {
  console.error('[CAM_Tools] Module GetMerchantIDFromStoreCode.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: GetAllStoreInfo.js
 * ================================================================ */
try {
(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            getAllStoreInfo
        };
    } catch (e) {
        // Handle the error if needed
    }

    function getAllStoreInfo() {
      // Password protection (same as AddItemButton.js)
      var pw = prompt('Enter password to access Get All Store Info:');
      if (pw !== 'Leeloo') {
        alert('Incorrect password. Access denied.');
        return;
      }
        console.log('[GetAllStoreInfo.js] Get All Store Info button clicked');
        try {
            // Determine the environment (prod or gamma)
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            // Define the API endpoint and headers for getting stores
            const headersStores = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
            };

            // Call the API to get the list of stores
            fetch(apiUrlBase, {
                method: 'POST',
                headers: headersStores,
                body: JSON.stringify({}),
                credentials: 'include' // Include cookies in the request
            })
            .then(response => response.json())
            .then(storeData => {
                console.log('[GetAllStoreInfo.js] Store data received:', storeData);

                if (!storeData || !storeData.storesInformation) {
                    throw new Error('Invalid store data received');
                }

                // Extract store IDs from the nested structure
                const storeIds = [];
                for (const region in storeData.storesInformation) {
                    const states = storeData.storesInformation[region];
                    for (const state in states) {
                        const stores = states[state];
                        stores.forEach(store => {
                            console.log('[GetAllStoreInfo.js] Store:', store);
                            const regionParts = region.split('-');
                            const regionCode = regionParts[regionParts.length - 1]; // Extract short region code
                            storeIds.push({ storeTLC: store.storeTLC, region: regionCode });
                        });
                    }
                }

                // Function to fetch merchant IDs for a single store
                const fetchMerchantIdsForStore = (store) => {
                    const headersItems = {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                    };

                    const payloadItems = {
                        "filterContext": {
                        "storeIds": [store.storeTLC]
                        },
                        "paginationContext": {
                            "pageNumber": 0,
                            "pageSize": 10000
                        }
                    };

                    return fetch(apiUrlBase, {
                        method: 'POST',
                        headers: headersItems,
                        body: JSON.stringify(payloadItems),
                        credentials: 'include' // Include cookies in the request
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(`[GetAllStoreInfo.js] Data for store ${store.storeTLC}:`, data);
                        const items = data.itemsAvailability;
                        if (!items || items.length === 0) {
                            throw new Error('No items found for this store code.');
                        }
                        // Predefined PLUs to try
                        const pluList = ['122415', '120998', '124017', '124165', '124017'];

                        // Function to attempt fetching merchant ID with a PLU
                        const tryFetchMerchantId = (pluIndex = 0) => {
                            if (pluIndex >= pluList.length) {
                                throw new Error(`Error in merchant ID gathering at ${store.storeTLC} Store`);
                            }

                            const plu = pluList[pluIndex];
                            console.log('[GetAllStoreInfo.js] Trying PLU:', plu);

                            const merchantApiUrl = apiUrlBase;
                            const headersMerchant = {
                                'accept': '*/*',
                                'accept-language': 'en-US,en;q=0.9',
                                'content-type': 'application/x-amz-json-1.0',
                                'x-amz-target': 'WfmCamBackendService.GetItemAvailability',
                                'amz-sdk-request': 'attempt=1; max=1',
                                'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"',
                                'sec-fetch-dest': 'empty',
                                'sec-fetch-mode': 'cors',
                                'sec-fetch-site': 'same-origin',
                                'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Microsoft_Edge_131.0.0.0',
                                'Referer': `https://\${environment}.cam.wfm.amazon.dev/store/\${store.storeTLC}/item/\${plu}`,
                                'Referrer-Policy': 'strict-origin-when-cross-origin'
                            };
                            const payloadMerchant = {
                                storeId: store.storeTLC,
                                wfmScanCode: plu
                            };

                            return fetch(merchantApiUrl, {
                                method: 'POST',
                                headers: headersMerchant,
                                body: JSON.stringify(payloadMerchant),
                                credentials: 'include' // Include cookies in the request
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (!data.itemAvailability || !data.itemAvailability.merchantId) {
                                    console.log('[GetAllStoreInfo.js] PLU failed, trying next:', plu);
                                    return tryFetchMerchantId(pluIndex + 1);
                                }
                                console.log('[GetAllStoreInfo.js] Merchant ID data received:', data);
                                return { 
                                    storeId: store.storeTLC,
                                    region: store.region,
                                    merchantId: data.itemAvailability.merchantId,
                                    wfmoaMerchantId: data.itemAvailability.wfmoaMerchantId
                                };
                            });
                        };

                        return tryFetchMerchantId();
                    })
                    .catch(error => {
                        console.error(`[GetAllStoreInfo.js] Error fetching data for store ${store.storeTLC}:`, error);
                        return { 
                            storeId: store.storeTLC,
                            region: store.region,
                            merchantId: 'error',
                            wfmoaMerchantId: 'error'
                        };
                    });
                };

                // Fetch merchant IDs for all stores and compile results
                let completedStores = 0;
                const totalStores = storeIds.length;

                Promise.all(storeIds.map((storeId, index) => {
                    return new Promise(resolve => setTimeout(resolve, index * 100)) // Wait .1 seconds between requests
                    .then(() => fetchMerchantIdsForStore(storeId))
                    .then(result => {
                        completedStores++;
                        const progressPercent = Math.round((completedStores / totalStores) * 100);
                        console.log(`[GetAllStoreInfo.js] Progress: ${progressPercent}%`);
                        return result;
                    });
                }))
                .then(results => {
                    console.log('[GetAllStoreInfo.js] All store info:', results);

                    // RFC 4180 compliant field escaping: wrap each field in double
                    // quotes and double any embedded double quotes so commas/quotes in
                    // field values do not break the CSV structure.
                    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

                    // Generate CSV content
                    const csvContent = ["Store ID,Region,Merchant ID,WFMOA Merchant ID"]
                        .concat(results.map(result =>
                            [result.storeId, result.region, result.merchantId, result.wfmoaMerchantId].map(escapeCsv).join(",")
                        ))
                        .join("\r\n");

                    // Use a Blob instead of a data: URI: a data URI run through
                    // encodeURI() leaves '#' unencoded, and the browser treats '#' as
                    // the URI fragment delimiter, silently truncating the file at the
                    // first '#'. The BOM ensures Excel reads UTF-8.
                    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const objectUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", objectUrl);
                    link.setAttribute("download", "store_info.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(objectUrl);

                    console.log('[GetAllStoreInfo.js] Downloading Now!');
                });
            })
            .catch(error => console.error('[GetAllStoreInfo.js] Get Store data Crashed:', error));
        } catch (error) {
            console.error('[GetAllStoreInfo.js] Get Store data Crashed:', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
                const getAllStoreInfoButton = document.getElementById('getAllStoreInfoButton');
                if (getAllStoreInfoButton) {
                    getAllStoreInfoButton.addEventListener('click', getAllStoreInfo);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module GetAllStoreInfo.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: MeatInventoryToUploadConverter.js
 * ================================================================ */
try {
(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addMeatInventoryToUploadConverterFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addMeatInventoryToUploadConverterFunctionality() {  // Added function declaration
        console.log('[MeatConverter] Button clicked');
        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'meatInventoryUploadOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = '#fff';
            closeButton.style.backgroundColor = '#000';
            closeButton.style.padding = '5px';
            closeButton.style.borderRadius = '0';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#1a1a1a';
            formContainer.style.color = '#f1f1f1';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create form elements
            formContainer.innerHTML = `
                <h3>Meat Inventory to Upload Converter</h3>
                <input type="file" id="meatInventoryFileInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                
                <label>Andon Cord</label>
                <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>

                <label>Start Date</label>
                <input type="date" id="startDate" style="width: 100%; margin-bottom: 10px;">
                
                <label>End Date</label>
                <input type="date" id="endDate" style="width: 100%; margin-bottom: 10px;">
                
                <button id="convertButton" style="width: 100%;">Convert & Download</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to the "Convert & Download" button
            document.getElementById('convertButton').addEventListener('click', function() {
                const fileInput = document.getElementById('meatInventoryFileInput');
                if (fileInput.files.length === 0) {
                    alert('Please select a file to upload.');
                    return;
                }
                
                const file = fileInput.files[0];
                console.log('File selected:', file.name);
                
                // Toggle debug mode to automatically download the CSV output
                const debugMode = true;
                
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) {
                    // Handle XLSX file using XLSX.js (assumes XLSX is available)
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        let unpivotedData = [];
                        workbook.SheetNames.forEach(sheetName => {
                            console.log('Processing sheet:', sheetName);
                            const sheet = workbook.Sheets[sheetName];
                            // Remove style properties
                            Object.keys(sheet).forEach(cell => {
                                if (cell[0] !== '!') {
                                    delete sheet[cell].s;
                                }
                            });
                            const csvContent = XLSX.utils.sheet_to_csv(sheet, { raw: true });
                            console.log('CSV Content:', csvContent);
                            processCSV(csvContent, function(groupData) {
                                unpivotedData = unpivotedData.concat(groupData);
                            });
                        });
                        // Filter out rows with empty PLU/UPC or non-numeric inventory
                        unpivotedData = unpivotedData.filter(row => row['Item PLU/UPC'] !== '' && !isNaN(row['Current Inventory']));
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    // Handle CSV file directly
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const csvData = event.target.result;
                        let unpivotedData = [];
                        processCSV(csvData, function(groupData) {
                            unpivotedData = unpivotedData.concat(groupData);
                        });
                        unpivotedData = unpivotedData.filter(row => row['Item PLU/UPC'] !== '' && !isNaN(row['Current Inventory']));
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsText(file);
                }
            }); // end of convertButton click

            // =========================
            // UTILITY FUNCTIONS
            // =========================
            // Helper function to format date from YYYY-MM-DD to MM/DD/YYYY.
            function formatDate(dateString) {
                if (!dateString) {
                    return '';
                }
                const parts = dateString.split('-');
                if (parts.length !== 3) {
                    return dateString;
                }
                return parts[1] + '/' + parts[2] + '/' + parts[0];
            }

            // Process CSV data into groups and then unpivot each row.
            // This version works on raw rows (arrays) so we can handle multiple header rows.
            function processCSV(data, callback) {
                // Split CSV into lines and then into cells
                const lines = data.split('\n').filter(line => line.trim() !== '');
                const rows = lines.map(line => line.split(',').map(cell => cell.trim()));

                // Filter out title rows (those that have only one nonempty cell)
                const filteredRows = rows.filter(row => row.filter(cell => cell !== '').length > 1);

                // Group rows: whenever a row has a header signature in columns 2–5, start a new group.
                let groups = [];
                let currentGroup = null;
                filteredRows.forEach(row => {
                    if (
                        row.length >= 5 &&
                        row[1].toLowerCase() === 'item#' &&
                        row[2].toLowerCase() === 'plu/upc' &&
                        row[3].toLowerCase() === 'vin' &&
                        row[4].toLowerCase() === 'head/case'
                    ) {
                        if (currentGroup) {
                            groups.push(currentGroup);
                        }
                        // Use trimmed & lowercased header keys for consistency
                        currentGroup = { header: row.map(x => x.trim().toLowerCase()), data: [] };
                    } else {
                        if (currentGroup) {
                            currentGroup.data.push(row);
                        }
                    }
                });
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                console.log('Detected groups:', groups);

                // Retrieve tracking dates from the form
                const trackingStartDate = document.getElementById('startDate').value || '';
                const trackingEndDate = document.getElementById('endDate').value || '';

                // For each group, convert data rows into objects using that group's header,
                // then "unpivot" each row (i.e. create one output row for each store code column).
                let allUnpivoted = [];
                groups.forEach(group => {
                    const keys = group.header; // already trimmed and lowercased
                    group.data.forEach(row => {
                        // Create an object mapping each header to its cell value.
                        let obj = {};
                        for (let i = 0; i < keys.length; i++) {
                            obj[keys[i]] = row[i] || '';
                        }
                        // Use the first column as the Item Name, ignoring any values from 'item#' or 'vin'
                        let itemName = obj[keys[0]];

                        // In many cases, the PLU/UPC column in a header row might be the literal text "plu/upc".
                        // If so, set it to empty.
                        let plu = (obj['plu/upc'] && obj['plu/upc'].toLowerCase() === 'plu/upc') ? '' : obj['plu/upc'];

                        // Unpivot: assume that store code columns are those starting at index 5.
                        // (Adjust the starting index if needed for your data.)
                        Object.keys(obj)
                            .slice(5)
                            .filter(storeCode => {
                                // Ensure the key is trimmed
                                const s = storeCode.trim().toLowerCase();
                                return ![
                                    'grand total', '2024 order', 'to allocate', 'avg case weight',
                                    'cases/pallet', 'pallet total', 'weight total', '2024 order ndc',
                                    'dc inventory', 'new allo total', 'reduce', 'pr store', '',
                                    'poet for the hawaii stores'
                                ].includes(s);
                            })
                            .forEach(storeCode => {
                                // Remove any commas from the cell value and convert to number.
                                let cellVal = obj[storeCode].replace(/,/g, '');
                                let numericVal = cellVal !== '' ? Math.round(parseFloat(cellVal) * 100) / 100 : 0;
                                allUnpivoted.push({
                                    'Item Name': itemName,
                                    'Item PLU/UPC': plu,
                                    'Availability': 'Limited',
                                    'Current Inventory': numericVal,
                                    'Sales Floor Capacity': '',
                                    'Store - 3 Letter Code': storeCode.toUpperCase(),
                                    'Andon Cord': document.getElementById('andonCordSelect').value || '',
                                    'Tracking Start Date': formatDate(trackingStartDate),
                                    'Tracking End Date': formatDate(trackingEndDate)
                                });
                            });
                    });
                });
                console.log('Unpivoted data:', allUnpivoted);
                callback(allUnpivoted);
            }

            // Download CSV helper function
            function downloadCSV(data, filename) {
                // CSV headers (keys must match the output objects exactly)
                const headers = [
                    'Store - 3 Letter Code',
                    'Item Name',
                    'Item PLU/UPC',
                    'Availability',
                    'Current Inventory',
                    'Sales Floor Capacity',
                    'Andon Cord',
                    'Tracking Start Date',
                    'Tracking End Date'
                ];

                // RFC 4180 compliant field escaping: wrap each field in double quotes
                // and double any embedded double quotes so commas/quotes in item names
                // do not break the CSV structure.
                const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

                // Build CSV rows
                const csvRows = [
                    headers.join(','),
                    ...data.map(row => {
                        return headers
                            .map(h => {
                                if (h === 'Current Inventory') {
                                    return row[h] !== undefined && row[h] !== null && row[h] !== '' ? row[h] : 0;
                                }
                                return escapeCsv(row[h]);
                            })
                            .join(',');
                    })
                ];

                // Create CSV string. Use a Blob instead of a data: URI: a data URI run
                // through encodeURI() leaves '#' unencoded, and the browser treats '#'
                // as the URI fragment delimiter, silently truncating the file at the
                // first '#' in any item name. The BOM ensures Excel reads UTF-8.
                const csvContent = csvRows.join('\r\n');
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const objectUrl = URL.createObjectURL(blob);

                // Create a hidden link and trigger download
                const link = document.createElement('a');
                link.setAttribute('href', objectUrl);
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            console.error('[MeatInventory] Meat Inventory Failed', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const meatInventoryToUploadConverterButton = document.getElementById('meatInventoryToUploadConverterButton');
                if (meatInventoryToUploadConverterButton) {
                    meatInventoryToUploadConverterButton.addEventListener('click', addMeatInventoryToUploadConverterFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module MeatInventoryToUploadConverter.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: inventoryPFDS.js
 * ================================================================ */
try {
(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addPFDSInventoryConverterFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addPFDSInventoryConverterFunctionality() {
        console.log('[PFDSInventory] Button clicked');
        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'pfdsInventoryUploadOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = '#fff';
            closeButton.style.backgroundColor = '#000';
            closeButton.style.padding = '5px';
            closeButton.style.borderRadius = '0';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#1a1a1a';
            formContainer.style.color = '#f1f1f1';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create form elements - simplified compared to meat converter (no date trackers)
            formContainer.innerHTML = `
                <h3>PFDS Inventory Converter</h3>
                <input type="file" id="pfdsInventoryFileInput" accept=".xlsx" style="width: 100%; margin-bottom: 10px;">
                
                <label>Andon Cord</label>
                <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                
                <button id="convertButton" style="width: 100%;">Convert & Download</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to the "Convert & Download" button
            document.getElementById('convertButton').addEventListener('click', function() {
                const fileInput = document.getElementById('pfdsInventoryFileInput');
                if (fileInput.files.length === 0) {
                    alert('Please select an XLSX file to upload.');
                    return;
                }
                
                const file = fileInput.files[0];
                console.log('File selected:', file.name);
                
                // Toggle debug mode to automatically download the CSV output
                const debugMode = true;
                
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) {
                    // Handle XLSX file using XLSX.js
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        let unpivotedData = [];
                        
                        workbook.SheetNames.forEach(sheetName => {
                            // Only process sheets with 2-letter region codes (FL, MA, etc.)
                            // Ignore hidden sheets or sheets with longer names
                            if (sheetName.length <= 2 && /^[A-Z]{2}$/i.test(sheetName.trim())) {
                                console.log('Processing region sheet:', sheetName);
                                const sheet = workbook.Sheets[sheetName];
                                // Remove style properties
                                Object.keys(sheet).forEach(cell => {
                                    if (cell[0] !== '!') {
                                        delete sheet[cell].s;
                                    }
                                });
                                const csvContent = XLSX.utils.sheet_to_csv(sheet, { raw: true });
                                console.log('CSV Content for sheet', sheetName, ':', csvContent);
                                processPFDSCSV(csvContent, sheetName, function(groupData) {
                                    unpivotedData = unpivotedData.concat(groupData);
                                });
                            } else {
                                console.log('Skipping non-region sheet:', sheetName);
                            }
                        });
                        
                        // Filter out rows with empty PLU/UPC or non-numeric inventory
                        unpivotedData = unpivotedData.filter(row => 
                            row['Item PLU/UPC'] !== '' && 
                            row['Item PLU/UPC'] !== null && 
                            !isNaN(row['Current Inventory'])
                        );
                        
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'PFDS_Inventory_Upload.csv');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert('Please select an XLSX file.');
                }
            }); // end of convertButton click

            // =========================
            // UTILITY FUNCTIONS
            // =========================

            // Proper CSV line parser that handles quoted fields with commas
            function parseCSVLine(line) {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    
                    if (char === '"') {
                        if (inQuotes && nextChar === '"') {
                            // Escaped quote (two quotes in a row)
                            current += '"';
                            i++; // Skip the next quote
                        } else {
                            // Toggle quote state
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        // Field separator (only when not inside quotes)
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                // Add the last field
                result.push(current.trim());
                
                return result;
            }

            // Process PFDS CSV data according to the specific requirements
            function processPFDSCSV(data, sheetName, callback) {
                // Split CSV into lines and then into cells using proper CSV parsing
                const lines = data.split('\n').filter(line => line.trim() !== '');
                const rows = lines.map(line => parseCSVLine(line));

                // Find the header row that starts with "Purchasing UPC" in column A
                let headerRowIndex = -1;
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i][0] && rows[i][0].toLowerCase().includes('purchasing upc')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    console.warn(`Sheet "${sheetName}": Could not find "Purchasing UPC" header row`);
                    callback([]);
                    return;
                }

                console.log(`Sheet "${sheetName}": Found header row at index:`, headerRowIndex);
                const headerRow = rows[headerRowIndex].map(h => h.toLowerCase().trim());
                console.log(`Sheet "${sheetName}": Header row:`, headerRow);

                // Find key column indices
                const camUpcIndex = headerRow.findIndex(h => h.includes('cam upc'));
                const descriptionIndex = headerRow.findIndex(h => h.includes('description'));
                const trackedInCamIndex = headerRow.findIndex(h => h.includes('tracked in cam'));
                const casePackIndex = headerRow.findIndex(h => h.includes('cam order convert')); //adjusted to fix math.

                console.log(`Sheet "${sheetName}": Column indices:`, {
                    camUpcIndex,
                    descriptionIndex,
                    trackedInCamIndex,
                    casePackIndex
                });

                if (camUpcIndex === -1 || descriptionIndex === -1 || trackedInCamIndex === -1 || casePackIndex === -1) {
                    const missingColumns = [];
                    if (camUpcIndex === -1) missingColumns.push('CAM UPC');
                    if (descriptionIndex === -1) missingColumns.push('Description');
                    if (trackedInCamIndex === -1) missingColumns.push('Tracked in Cam');
                    if (casePackIndex === -1) missingColumns.push('Case Pack');
                    
                    const errorMsg = `Sheet "${sheetName}": Missing required columns: ${missingColumns.join(', ')}`;
                    console.error(errorMsg);
                    console.error(`Sheet "${sheetName}": Available headers:`, headerRow);
                    alert(`Error processing sheet "${sheetName}":\nMissing required columns: ${missingColumns.join(', ')}\n\nAvailable headers: ${headerRow.join(', ')}`);
                    callback([]);
                    return;
                }

                // Find store code columns - they start after "Select Sub-Team" column
                const selectSubTeamIndex = headerRow.findIndex(h => h.includes('select sub-team'));
                const storeCodeStartIndex = selectSubTeamIndex !== -1 ? selectSubTeamIndex + 1 : Math.max(camUpcIndex, descriptionIndex, trackedInCamIndex, casePackIndex) + 1;
                const storeCodes = [];
                for (let i = storeCodeStartIndex; i < headerRow.length; i++) {
                    const header = headerRow[i].trim();
                    // Store codes are typically 3-letter codes, but be more flexible with detection
                    if (header && header.length >= 2 && header.length <= 4 && /^[A-Z]{2,4}$/i.test(header)) {
                        storeCodes.push({ index: i, code: header.toUpperCase() });
                    }
                }

                console.log(`Sheet "${sheetName}": Found store codes:`, storeCodes);

                let allUnpivoted = [];

                // Process data rows (skip header and any rows above it)
                for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
                    const row = rows[rowIndex];
                    
                    // Skip blank rows
                    if (row.every(cell => !cell || cell.trim() === '')) {
                        continue;
                    }

                    const trackedInCam = row[trackedInCamIndex] ? row[trackedInCamIndex].toUpperCase().trim() : '';
                    
                    // Only process rows where "Tracked in Cam" = "Y"
                    if (trackedInCam !== 'Y') {
                        continue;
                    }

                    const camUpc = row[camUpcIndex] || '';
                    const description = row[descriptionIndex] || '';
                    const casePackStr = row[casePackIndex] || '1';
                    const casePack = parseFloat(casePackStr.replace(/,/g, '')) || 1;

                    // Skip if no CAM UPC
                    if (!camUpc || camUpc.trim() === '') {
                        continue;
                    }

                    // Create output rows for each store
                    storeCodes.forEach(({ index, code }) => {
                        const storeValueStr = row[index] || '0';
                        const storeValue = parseFloat(storeValueStr.replace(/,/g, '')) || 0;
                        const currentInventory = Math.round((casePack * storeValue) * 100) / 100;

                        allUnpivoted.push({
                            'Store - 3 Letter Code': code,
                            'Item Name': description,
                            'Item PLU/UPC': camUpc,
                            'Availability': 'Limited',
                            'Current Inventory': currentInventory,
                            'Sales Floor Capacity': '',
                            'Andon Cord': document.getElementById('andonCordSelect').value || 'Enabled',
                            'Tracking Start Date': '',
                            'Tracking End Date': ''
                        });
                    });
                }

                console.log(`Sheet "${sheetName}": Unpivoted PFDS data:`, allUnpivoted);
                callback(allUnpivoted);
            }

            // Download CSV helper function
            function downloadCSV(data, filename) {
                // CSV headers (must match the output objects exactly)
                const headers = [
                    'Store - 3 Letter Code',
                    'Item Name',
                    'Item PLU/UPC',
                    'Availability',
                    'Current Inventory',
                    'Sales Floor Capacity',
                    'Andon Cord',
                    'Tracking Start Date',
                    'Tracking End Date'
                ];

                // Build CSV rows
                const csvRows = [
                    headers.join(','),
                    ...data.map(row => {
                        return headers
                            .map(h => {
                                if (h === 'Current Inventory') {
                                    return row[h] !== undefined && row[h] !== null && row[h] !== '' ? row[h] : 0;
                                }
                                return `"${(row[h] || '').toString().replace(/"/g, '""')}"`;
                            })
                            .join(',');
                    })
                ];

                // Create CSV string. Use a Blob instead of a data: URI: a data URI
                // run through encodeURI() leaves '#' unencoded, and the browser treats
                // '#' as the URI fragment delimiter, silently truncating the file at
                // the first '#' in any item name. The BOM ensures Excel reads UTF-8.
                const csvContent = csvRows.join('\r\n');
                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                const objectUrl = URL.createObjectURL(blob);

                // Create a hidden link and trigger download
                const link = document.createElement('a');
                link.setAttribute('href', objectUrl);
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            console.error('[PFDS Inventory] PFDS Inventory Converter Failed', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const pfdsInventoryButton = document.getElementById('prepFoodsInventoryButton');
                if (pfdsInventoryButton) {
                    pfdsInventoryButton.addEventListener('click', addPFDSInventoryConverterFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module inventoryPFDS.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: MassUploaderButton.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addMassUploaderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    /**
     * Enhanced Mass Uploader with integrated file chunking functionality.
     * Users can either upload individual files/folders OR chunk a large CSV file and upload the chunks.
     * Includes an information button with detailed instructions.
     */
    function addMassUploaderFunctionality() {
        console.log('[MassUploader] Button clicked');

        // Prevent duplicate overlays -- if already open, just bring it to focus
        const existingOverlay = document.getElementById('massUploaderOverlay');
        if (existingOverlay) {
            console.log('[MassUploader] Overlay already open, skipping duplicate');
            existingOverlay.focus();
            return;
        }

        // ------------------------------------------------------------------
        //  TIMING CONSTANTS
        // ------------------------------------------------------------------
        // MU_DEBUG removed -- now uses TmLog.debug() gated by Settings.debugMode
        const log = window.TmLog || { debug: function(){}, info: console.log, warn: console.warn, error: console.error };
        const POLLING_MAX_TIME_MS   = 45000; // Max time to poll for alerts per file
        const POLLING_FREQUENCY_MS  = 100;   // How often to check for alerts
        const ALERT_CLEANUP_DELAY   = 100;   // Small delay before clearing old alerts
        const ALERT_STALE_MS        = 10000; // Alerts older than this are considered stale
        const ALERT_SETTLE_MS       = 3000;  // Wait for alert to settle before classifying
        const MIN_UPLOAD_DELAY_MS   = 5000;  // Minimum gap between consecutive uploads
        const BASE_WAIT_SUCCESS_MS  = 30000; // Default wait after successful upload
        const BASE_WAIT_ERROR_MS    = 10000; // Shorter wait after failed upload

        // ------------------------------------------------------------------
        //  NON-BLOCKING CONFIRM MODAL (replaces window.confirm)
        // ------------------------------------------------------------------
        function showConfirmModal(title, message, confirmText = 'Continue', cancelText = 'Cancel') {
            return new Promise(resolve => {
                const overlay = document.createElement('div');
                Object.assign(overlay.style, {
                    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.6)', zIndex: '9996',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                });
                const card = document.createElement('div');
                Object.assign(card.style, {
                    background: '#1a1a1a', border: '1px solid #303030', borderRadius: '8px',
                    width: '380px', maxWidth: '90vw', padding: '0', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    fontFamily: "'Roboto','Segoe UI',sans-serif", color: '#f1f1f1', overflow: 'hidden'
                });
                card.innerHTML = `
                    <div style="padding:14px 18px;background:#242424;border-bottom:1px solid #303030;font-size:16px;font-weight:600;">${title}</div>
                    <div style="padding:16px 18px;font-size:14px;line-height:1.6;color:#aaaaaa;white-space:pre-wrap;">${message}</div>
                    <div style="display:flex;gap:8px;padding:12px 18px;border-top:1px solid #303030;justify-content:flex-end;">
                        <button id="mu-confirm-cancel" style="padding:8px 16px;border:1px solid #3f3f3f;border-radius:4px;background:transparent;color:#aaaaaa;cursor:pointer;font-size:13px;font-family:inherit;">${cancelText}</button>
                        <button id="mu-confirm-ok" style="padding:8px 16px;border:none;border-radius:4px;background:var(--tm-accent-primary,#3ea6ff);color:#0f0f0f;cursor:pointer;font-size:13px;font-weight:500;font-family:inherit;">${confirmText}</button>
                    </div>
                `;
                overlay.appendChild(card);
                document.body.appendChild(overlay);
                card.querySelector('#mu-confirm-ok').focus();
                card.querySelector('#mu-confirm-ok').onclick = () => { document.body.removeChild(overlay); resolve(true); };
                card.querySelector('#mu-confirm-cancel').onclick = () => { document.body.removeChild(overlay); resolve(false); };
                overlay.addEventListener('click', (e) => { if (e.target === overlay) { document.body.removeChild(overlay); resolve(false); } });
            });
        }

        // Inject helper script for file assignment (bypass userscript sandbox restrictions)
        if (!window.__MU_injected) {
            window.__MU_injected = true;
            const s = document.createElement('script');
            s.textContent = `
                window.addEventListener('message', e => {
                    if (e.data?.type === 'MU_SET_FILE') {
                        const file = e.data.file;
                        const input = [...document.querySelectorAll('input[type=file]')]
                            .find(el => !el.id || !['massFileInput', 'csvFileInput'].includes(el.id));
                        if (input) {
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            input.files = dt.files;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                });
            `;
            document.documentElement.appendChild(s);
            s.remove();
        }

        // Make fileStates accessible to all handlers
        let fileStates = {};

        // === Inject modal styles if not already present ===
        if (!document.getElementById('tm-mu-styles')) {
           const style = document.createElement('style');
           style.id = 'tm-mu-styles';
            style.textContent = `
                #massUploaderOverlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.6); z-index: 9995;
                    display: flex; justify-content: center; align-items: center;
                }
                .tm-mu-card {
                    background: #1a1a1a;
                    border: 1px solid #303030;
                    border-radius: 12px;
                    width: 420px;
                    max-width: 98vw;
                    max-height: 90vh;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    font-family: 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #f1f1f1;
                    position: relative;
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .tm-mu-header {
                    background: #242424;
                    color: #f1f1f1;
                    padding: 12px 16px;
                    font-size: 16px;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                    border-bottom: 1px solid #303030;
                }
                .tm-mu-close {
                    font-size: 22px;
                    cursor: pointer;
                    color: #aaaaaa;
                    background: transparent;
                    border: none;
                    padding: 0 4px;
                    border-radius: 4px;
                    transition: color 150ms ease;
                }
                .tm-mu-close:hover {
                    color: #f1f1f1;
                }
                .tm-mu-body {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    overflow-y: auto;
                    flex: 1;
                }
                .tm-mu-instructions {
                    font-size: 14px;
                    color: #aaaaaa;
                    margin-bottom: 6px;
                }
                .tm-mu-label {
                    display: block;
                    margin-bottom: 10px;
                    cursor: pointer;
                    background-color: #242424;
                    border: 1px solid #3f3f3f;
                    padding: 8px;
                    text-align: center;
                    border-radius: 4px;
                    font-weight: 500;
                    color: var(--tm-accent-primary, #3ea6ff);
                    transition: background 150ms ease;
                }
                .tm-mu-label:hover, .tm-mu-label:focus {
                    background: #2d2d2d;
                }
                .tm-mu-section {
                    border: 1px solid #303030;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    background: #242424;
                }
                .tm-mu-section-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: var(--tm-accent-primary, #3ea6ff);
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .tm-mu-radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .tm-mu-radio-option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    padding: 4px;
                }
                .tm-mu-chunking-options {
                    display: none;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #303030;
                }
                .tm-mu-chunking-options.active {
                    display: block;
                }
                .tm-mu-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 10px;
                }
                .tm-mu-input-group label {
                    font-weight: 500;
                    font-size: 14px;
                    color: #aaaaaa;
                }
                .tm-mu-input-group input, .tm-mu-input-group select {
                    padding: 8px 10px;
                    border: 1px solid #3f3f3f;
                    border-radius: 4px;
                    font-size: 14px;
                    background: #0f0f0f;
                    color: #f1f1f1;
                    font-family: inherit;
                }
                #selectedFolderLabel, #selectedFileLabel {
                    text-align: center;
                    margin-bottom: 10px;
                    color: #717171;
                    font-size: 14px;
                }
                #massUploadButton {
                    width: 100%;
                    background: var(--tm-accent-primary, #3ea6ff);
                    color: #0f0f0f;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 0;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 150ms ease;
                    margin-bottom: 4px;
                }
                #massUploadButton:disabled {
                    background: #3f3f3f;
                    color: #717171;
                    cursor: not-allowed;
                }
                #statusContainer {
                    margin-top: 10px;
                    max-height: 220px;
                    overflow-y: auto;
                    border: 1px solid #303030;
                    padding: 0;
                    background: #242424;
                    border-radius: 4px;
                    font-size: 14px;
                    display: block;
                    visibility: visible;
                }
                .tm-mu-statusHeader {
                    display: flex;
                    align-items: center;
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--tm-accent-primary, #3ea6ff);
                    background: #2d2d2d;
                    border-bottom: 1px solid #303030;
                    padding: 6px 10px 6px 10px;
                    gap: 8px;
                }
                .tm-mu-statusRow {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 7px 10px 7px 10px;
                    border-bottom: 1px solid #303030;
                    min-height: 32px;
                    background: #1a1a1a;
                    transition: background 150ms ease;
                }
                .tm-mu-statusRow:last-child {
                    border-bottom: none;
                }
                .tm-mu-statusText {
                    flex: 1 1 auto;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    min-height: 18px;
                }
                .status-waiting { color: #717171; }
                .status-injecting { color: #f9a825; }
                .status-success { color: #2e7d32; }
                .status-warning { color: #f9a825; font-weight: 500; }
                .status-error { color: #d32f2f; }
                .status-chunking { color: var(--tm-accent-primary, #3ea6ff); }
                
                /* Info box styles */
                .tm-mu-infoBox {
                    display: none;
                    position: absolute;
                    top: 54px;
                    left: 24px;
                    background: #242424;
                    color: #f1f1f1;
                    border-left: 4px solid var(--tm-accent-primary, #3ea6ff);
                    border: 1px solid #303030;
                    padding: 16px 22px 16px 18px;
                    border-radius: 8px;
                    font-size: 14px;
                    line-height: 1.7;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    z-index: 9999;
                    min-width: 320px;
                    max-width: 380px;
                    max-height: 60vh;
                    overflow-y: auto;
                    transition: opacity 0.2s;
                }
                
                /* Fix for status container visibility */
                .tm-mu-body {
                    flex: 1 1 auto;
                    overflow-y: auto;
                }
                #statusContainer {
                    flex: 1 1 auto;
                    min-height: 120px;
                    max-height: 50vh;
                }
                
                /* Summary styling */
                .tm-mu-summary {
                    margin-top: 15px;
                    padding: 12px;
                    border: 1px solid #303030;
                    border-radius: 4px;
                    background: #242424;
                }
                .tm-mu-summary h4 {
                    margin: 0 0 8px 0;
                    color: var(--tm-accent-primary, #3ea6ff);
                    font-size: 14px;
                }
                .tm-mu-summary p {
                    margin: 4px 0;
                    font-size: 14px;
                }
                .tm-mu-summary details {
                    margin-top: 8px;
                }
                .tm-mu-summary summary {
                    cursor: pointer;
                    font-weight: bold;
                    color: #c62828;
                    font-size: 14px;
                }
                .tm-mu-summary ul {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                .tm-mu-summary li {
                    margin: 4px 0;
                    font-size: 13px;
                }
            `;
            document.head.appendChild(style);
        }

        // === Overlay ===
        const overlay = document.createElement('div');
        overlay.id = 'massUploaderOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.tabIndex = -1;

        // === Card container ===
        const card = document.createElement('div');
        card.className = 'tm-mu-card';

        // === Header ===
        const header = document.createElement('div');
        header.className = 'tm-mu-header';
        header.innerHTML = `
            <span style="display:flex;align-items:center;gap:8px;">
                Mass Upload & Chunker
                <span id="massUploaderInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#3f3f3f;color:#aaaaaa;font-weight:bold;font-size:15px;cursor:pointer;outline:none;transition:background 0.2s;">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
                        <circle cx="10" cy="10" r="10" fill="#3f3f3f"/>
                        <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Arial" fill="#f1f1f1" font-weight="bold">i</text>
                    </svg>
                </span>
            </span>
        `;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'tm-mu-close';
        closeButton.setAttribute('aria-label', 'Close Mass Upload dialog');
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
            if (window._massUploaderTrigger) window._massUploaderTrigger.focus();
        };
        header.appendChild(closeButton);
        card.appendChild(header);

        // === Info Box ===
        const infoBox = document.createElement('div');
        infoBox.id = 'massUploaderInfoBox';
        infoBox.className = 'tm-mu-infoBox';
        infoBox.setAttribute('role', 'dialog');
        infoBox.setAttribute('aria-modal', 'false');
        infoBox.tabIndex = -1;
        infoBox.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <svg width="22" height="22" fill="#004E36" viewBox="0 0 20 20" style="flex-shrink:0;margin-top:2px;">
                    <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                    <text x="10" y="15" text-anchor="middle" font-size="13" font-family="Arial" fill="#004E36" font-weight="bold">i</text>
                </svg>
                <div style="flex:1;">
                    <div style="font-weight:600;margin-bottom:2px;">Mass Upload & File Chunker</div>
                    Upload multiple files or chunk large CSV files for batch processing.<br>
                    <div style="margin:7px 0 0 0;font-weight:600;">Upload Options:</div>
                    <ul style="margin:7px 0 0 18px;padding:0 0 0 0;">
                        <li><b>Upload Files/Folder</b>: Select multiple files or an entire folder to upload sequentially.</li>
                        <li><b>Chunk & Upload CSV</b>: Split a large CSV file into smaller chunks and upload them automatically.</li>
                    </ul>
                    <div style="margin:7px 0 0 0;font-weight:600;">Chunking Process:</div>
                    <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                        <li>Select "Chunk & Upload CSV" option</li>
                        <li>Choose your large CSV file</li>
                        <li>Set rows per chunk (default: 1000)</li>
                        <li>Enable/disable upload validation</li>
                        <li>Click "Process & Upload" - the system will automatically chunk the file and upload each piece</li>
                    </ol>
                    <div style="margin:7px 0 0 0;font-weight:600;">Features:</div>
                    <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                        <li>Automatic CSV validation and header checking</li>
                        <li>Progress tracking for each file/chunk</li>
                        <li>Manual status marking (grey/red/yellow/green)</li>
                        <li>30-second spacing between uploads to prevent overload</li>
                        <li>Toast message capture for upload status</li>
                    </ul>
                    <div style="margin:7px 0 0 0;font-weight:600;">Requirements:</div>
                    <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                        <li>JSZip library must be loaded for chunking functionality</li>
                        <li>CSV files should follow the expected format for validation</li>
                    </ul>
                </div>
                <button id="closeMassUploaderInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#004E36;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:background 0.2s;">&times;</button>
            </div>
        `;
        card.appendChild(infoBox);

        // === Body ===
        const body = document.createElement('div');
        body.className = 'tm-mu-body';

        // Instructions
        const instructions = document.createElement('div');
        instructions.className = 'tm-mu-instructions';
        instructions.innerHTML = `Choose your upload method: upload multiple files/folders OR chunk a large CSV file and upload the pieces automatically.`;
        body.appendChild(instructions);

        // Upload method selection
        const methodSection = document.createElement('div');
        methodSection.className = 'tm-mu-section';
        methodSection.innerHTML = `
            <div class="tm-mu-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Upload Method
            </div>
            <div class="tm-mu-radio-group">
                <label class="tm-mu-radio-option">
                    <input type="radio" name="uploadMethod" value="files" checked>
                    <span>Upload Files/Folder</span>
                </label>
                <label class="tm-mu-radio-option">
                    <input type="radio" name="uploadMethod" value="chunk">
                    <span>Chunk & Upload CSV</span>
                </label>
            </div>
        `;
        body.appendChild(methodSection);

        // Files upload section
        const filesSection = document.createElement('div');
        filesSection.id = 'filesUploadSection';
        filesSection.className = 'tm-mu-section';
        filesSection.innerHTML = `
            <div class="tm-mu-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3z"/>
                </svg>
                Select Files/Folder
            </div>
            <label class="tm-mu-label" for="massFileInput" tabindex="0">Choose Folder</label>
            <p id="selectedFolderLabel">No folder selected</p>
            <input type="file" id="massFileInput" style="display: none;" multiple webkitdirectory>
        `;
        body.appendChild(filesSection);

        // CSV chunking section
        const chunkingSection = document.createElement('div');
        chunkingSection.id = 'csvChunkingSection';
        chunkingSection.className = 'tm-mu-section';
        chunkingSection.style.display = 'none';
        chunkingSection.innerHTML = `
            <div class="tm-mu-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                    <path d="M8.646 6.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 9 8.646 7.354a.5.5 0 0 1 0-.708zM5.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L3.707 9l1.647-1.646a.5.5 0 0 0 0-.708z"/>
                </svg>
                CSV File & Chunking Options
            </div>
            <label class="tm-mu-label" for="csvFileInput" tabindex="0">Choose CSV File</label>
            <p id="selectedFileLabel">No file selected</p>
            <input type="file" id="csvFileInput" style="display: none;" accept=".csv">
            
            <div class="tm-mu-input-group">
                <label for="rowsPerChunk">Rows Per Chunk</label>
                <input type="number" id="rowsPerChunk" value="1000" min="2" max="10000">
            </div>
            
            <label class="tm-mu-radio-option">
                <input type="checkbox" id="uploadValidation" checked>
                <span>Enable Upload Validation</span>
            </label>
        `;
        body.appendChild(chunkingSection);

        // Upload button
        const uploadButton = document.createElement('button');
        uploadButton.id = 'massUploadButton';
        uploadButton.innerText = 'Upload';
        uploadButton.disabled = true;
        body.appendChild(uploadButton);

        // Status container
        console.log('[MassUploader] Creating status container');
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        body.appendChild(statusContainer);
        console.log('[MassUploader] Status container created and appended:', statusContainer);

        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // === Info icon functionality ===
        setTimeout(() => {
            const infoIcon = document.getElementById('massUploaderInfoIcon');
            const infoBox = document.getElementById('massUploaderInfoBox');
            if (infoIcon && infoBox) {
                function showInfoBox() {
                    infoBox.style.display = 'block';
                    setTimeout(() => {
                        const rect = infoBox.getBoundingClientRect();
                        const pad = 8;
                        const vpW = window.innerWidth, vpH = window.innerHeight;
                        if (rect.right > vpW - pad) {
                            infoBox.style.left = Math.max(24, vpW - rect.width - pad) + 'px';
                        }
                        if (rect.left < pad) {
                            infoBox.style.left = pad + 'px';
                        }
                        if (rect.bottom > vpH - pad) {
                            const newTop = Math.max(8, vpH - rect.height - pad);
                            infoBox.style.top = newTop + 'px';
                        }
                        if (rect.top < pad) {
                            infoBox.style.top = pad + 'px';
                        }
                    }, 0);
                    infoBox.focus();
                }
                function hideInfoBox() {
                    infoBox.style.display = 'none';
                    infoIcon.focus();
                }
                infoIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showInfoBox();
                });
                infoIcon.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showInfoBox();
                    }
                });
                const closeBtn = document.getElementById('closeMassUploaderInfoBoxBtn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        hideInfoBox();
                    });
                }
                infoBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        hideInfoBox();
                    }
                });
                document.addEventListener('mousedown', function handler(e) {
                    if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                        hideInfoBox();
                    }
                });
            }
        }, 0);

        // === Upload method radio button logic ===
        const methodRadios = document.querySelectorAll('input[name="uploadMethod"]');
        const filesSection_el = document.getElementById('filesUploadSection');
        const chunkingSection_el = document.getElementById('csvChunkingSection');
        
        methodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'files') {
                    filesSection_el.style.display = 'block';
                    chunkingSection_el.style.display = 'none';
                    uploadButton.innerText = 'Upload';
                    // Reset file selections
                    document.getElementById('selectedFolderLabel').textContent = 'No folder selected';
                    document.getElementById('massFileInput').value = '';
                    uploadButton.disabled = true;
                } else if (this.value === 'chunk') {
                    filesSection_el.style.display = 'none';
                    chunkingSection_el.style.display = 'block';
                    uploadButton.innerText = 'Process & Upload';
                    // Reset file selections
                    document.getElementById('selectedFileLabel').textContent = 'No file selected';
                    document.getElementById('csvFileInput').value = '';
                    uploadButton.disabled = true;
                }
            });
        });

        // === Accessibility: focus management ===
        setTimeout(() => {
            const folderLabel = document.querySelector('label[for="massFileInput"]');
            if (folderLabel) folderLabel.focus();
        }, 0);

        // Function to update status row display and styling
        function updateStatusRow(file, state, errorMsg = '') {
            const fileKey = file.webkitRelativePath || file.name;
            const fileId = `status-${btoa(fileKey).replace(/[=+/]/g, '')}`;
            const fileStatusDiv = document.getElementById(fileId);
            if (!fileStatusDiv) {
                console.warn('[MassUploader] Status row not found for file:', fileKey);
                return;
            }

            if (!fileStates[fileKey]) {
                fileStates[fileKey] = { state: 'waiting', error: null, checkboxState: 0 };
            }
            fileStates[fileKey].state = state;
            fileStates[fileKey].error = errorMsg || null;

            switch (state) {
                case 'waiting':
                    fileStatusDiv.className = 'tm-mu-statusText status-waiting';
                    fileStatusDiv.innerText = `${file.name} - Waiting`;
                    break;
                case 'injecting':
                    fileStatusDiv.className = 'tm-mu-statusText status-injecting';
                    fileStatusDiv.innerText = `${file.name} - Injecting...`;
                    break;
                case 'success':
                    fileStatusDiv.className = 'tm-mu-statusText status-success';
                    fileStatusDiv.innerText = `${file.name} - Injected${errorMsg ? '. Status: ' + errorMsg : '.'}`;
                    break;
                case 'warning':
                    fileStatusDiv.className = 'tm-mu-statusText status-warning';
                    fileStatusDiv.innerText = `${file.name} - Partial Success: ${errorMsg}`;
                    break;
                case 'error':
                    fileStatusDiv.className = 'tm-mu-statusText status-error';
                    fileStatusDiv.innerText = `${file.name} - Error: ${errorMsg}`;
                    break;
                default:
                    fileStatusDiv.className = 'tm-mu-statusText';
                    fileStatusDiv.innerText = `${file.name} - ${state.charAt(0).toUpperCase() + state.slice(1)}`;
            }

            // Update tri-button color based on current checkbox state
            const cbState = fileStates[fileKey]?.checkboxState ?? 0;
            const row = fileStatusDiv.parentElement;
            if (row) {
                const btn = row.querySelector('button');
                const circ = btn && btn.querySelector('span');
                if (circ) {
                    switch (cbState) {
                        case 0: circ.style.background = '#ccc'; circ.style.borderColor = '#888'; break;
                        case 1: circ.style.background = '#c62828'; circ.style.borderColor = '#c62828'; break;
                        case 2: circ.style.background = '#fbc02d'; circ.style.borderColor = '#fbc02d'; break;
                        case 3: circ.style.background = '#388e3c'; circ.style.borderColor = '#388e3c'; break;
                    }
                }
            }
        }

        // Function to create individual file tracking row
        function createFileTrackingRow(file) {
            console.log('[MassUploader] createFileTrackingRow called for file:', file.name);
            const fileKey = file.webkitRelativePath || file.name;
            const fileId = `status-${btoa(fileKey).replace(/[=+/]/g, '')}`;
            console.log('[MassUploader] fileKey:', fileKey, 'fileId:', fileId);
            
            // Container for each file status
            const fileStatusRow = document.createElement('div');
            fileStatusRow.className = 'tm-mu-statusRow';
            console.log('[MassUploader] Created fileStatusRow:', fileStatusRow);

            // Tri-state/quad-state indicator (custom button)
            const triBtn = document.createElement('button');
            triBtn.type = 'button';
            triBtn.title = 'Toggle status: grey → red → yellow → green → grey';
            triBtn.style.margin = '0 8px 0 0';
            triBtn.style.width = '22px';
            triBtn.style.height = '22px';
            triBtn.style.border = 'none';
            triBtn.style.background = 'none';
            triBtn.style.padding = '0';
            triBtn.style.cursor = 'pointer';
            triBtn.style.display = 'flex';
            triBtn.style.alignItems = 'center';
            triBtn.style.justifyContent = 'center';

            // Custom state: 0=grey, 1=red, 2=yellow, 3=green
            let cbState = 0;
            fileStates[fileKey] = { state: 'waiting', error: null, checkboxState: 0 };

            // Visual indicator (circle)
            const circle = document.createElement('span');
            circle.style.display = 'inline-block';
            circle.style.width = '16px';
            circle.style.height = '16px';
            circle.style.borderRadius = '50%';
            circle.style.border = '2px solid #888';
            circle.style.background = '#ccc';
            circle.style.transition = 'background 0.2s, border 0.2s';

            triBtn.appendChild(circle);

            // Status text
            const fileStatus = document.createElement('div');
            fileStatus.id = fileId;
            fileStatus.className = 'tm-mu-statusText status-waiting';
            fileStatus.innerText = `${file.name} - Waiting`;

            // TriBtn click cycles through states
            triBtn.addEventListener('click', function(e) {
                cbState = (cbState + 1) % 4;
                fileStates[fileKey].checkboxState = cbState;
                updateStatusRow(file, fileStates[fileKey].state, fileStates[fileKey].error);
            });

            fileStatusRow.appendChild(triBtn);
            fileStatusRow.appendChild(fileStatus);
            console.log('[MassUploader] About to append fileStatusRow to statusContainer');
            console.log('[MassUploader] statusContainer before append:', statusContainer);
            console.log('[MassUploader] fileStatusRow to append:', fileStatusRow);
            statusContainer.appendChild(fileStatusRow);
            console.log('[MassUploader] fileStatusRow appended successfully');
            
            // Auto-scroll to keep the newest row in view
            fileStatusRow.scrollIntoView({block: 'nearest'});
            console.log('[MassUploader] statusContainer after append:', statusContainer.innerHTML);

            // Helper to update triBtn color
            function updateTriBtnColor(cbState) {
                switch (cbState) {
                    case 0: // grey
                        circle.style.background = '#ccc';
                        circle.style.borderColor = '#888';
                        break;
                    case 1: // red
                        circle.style.background = '#c62828';
                        circle.style.borderColor = '#c62828';
                        break;
                    case 2: // yellow
                        circle.style.background = '#fbc02d';
                        circle.style.borderColor = '#fbc02d';
                        break;
                    case 3: // green
                        circle.style.background = '#388e3c';
                        circle.style.borderColor = '#388e3c';
                        break;
                }
            }

            // Set initial tri-button color and status
            updateTriBtnColor(cbState);
            updateStatusRow(file, 'waiting');
        }

        // Function to display files and create status tracking immediately when files are selected
        function displayFilesWithStatus(files) {
            console.log('[MassUploader] displayFilesWithStatus called with files:', files);
            console.log('[MassUploader] statusContainer:', statusContainer);
            console.log('[MassUploader] statusContainer exists:', !!statusContainer);
            console.log('[MassUploader] statusContainer in DOM:', !!document.getElementById('statusContainer'));
            
            if (!statusContainer) {
                console.error('[MassUploader] statusContainer not found!');
                return;
            }
            
            // Clear previous status
            statusContainer.innerHTML = '';
            console.log('[MassUploader] statusContainer cleared');

            // Display file names and initial status
            // Add a header row for clarity
            statusContainer.innerHTML = `
                <div class="tm-mu-statusHeader">
                    <span style="width:22px;flex-shrink:0;">Mark</span>
                    <span style="flex:1 1 auto;">File</span>
                </div>
            `;
            console.log('[MassUploader] Header added to statusContainer');
            console.log('[MassUploader] statusContainer innerHTML after header:', statusContainer.innerHTML);
            
            Array.from(files).forEach((file, index) => {
                console.log(`[MassUploader] Processing file ${index + 1}:`, file.name);
                createFileTrackingRow(file);
            });
            
            console.log('[MassUploader] displayFilesWithStatus completed');
            console.log('[MassUploader] Final statusContainer innerHTML:', statusContainer.innerHTML);
        }

        // === Files upload logic ===
        const fileInput = document.getElementById('massFileInput');
        const folderLabel = document.querySelector('label[for="massFileInput"]');
        
        fileInput.addEventListener('change', function() {
            console.log('[MassUploader] File input change event fired, files count:', this.files.length);
            if (this.files.length > 0) {
                const folderName = this.files[0].webkitRelativePath
                    ? this.files[0].webkitRelativePath.split('/')[0]
                    : (this.files[0].name || 'Selected');
                document.getElementById('selectedFolderLabel').textContent = "Selected folder: " + folderName;
                uploadButton.disabled = false;
                
                console.log('[MassUploader] About to call displayFilesWithStatus');
                console.log('[MassUploader] statusContainer exists:', !!statusContainer);
                console.log('[MassUploader] statusContainer in DOM:', !!document.getElementById('statusContainer'));
                
                // Display files with status tracking immediately
                displayFilesWithStatus(this.files);
            } else {
                console.log('[MassUploader] No files selected');
                document.getElementById('selectedFolderLabel').textContent = "No folder selected";
                uploadButton.disabled = true;
                // Clear status container
                statusContainer.innerHTML = '';
            }
        });

        folderLabel.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // === CSV file upload logic ===
        const csvFileInput = document.getElementById('csvFileInput');
        const csvLabel = document.querySelector('label[for="csvFileInput"]');
        
        csvFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                document.getElementById('selectedFileLabel').textContent = "Selected file: " + this.files[0].name;
                uploadButton.disabled = false;
            } else {
                document.getElementById('selectedFileLabel').textContent = "No file selected";
                uploadButton.disabled = true;
            }
        });

        csvLabel.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                csvFileInput.click();
            }
        });

        // === File chunking function (from FileChunker.js) ===
        function chunkCSVFile(file, rowsPerFile, doValidation) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const csvData = event.target.result;
                        const expectedHeader = "Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date";
                        
                        // Custom CSV parser
                        function customParseCSV(data) {
                            const lines = data.split('\n');
                            const parsedData = [];
                            const expectedColumns = 9;
                        
                            lines.forEach(line => {
                                let fields = line.split(',');
                                for (let i = 0; i < fields.length - 1; i++) {
                                    if (fields[i].endsWith(',') && fields[i + 1].startsWith(' ')) {
                                        fields[i] = fields[i] + fields[i + 1];
                                        fields.splice(i + 1, 1);
                                    }
                                }
                                while (fields.length < expectedColumns) {
                                    fields.push('');
                                }
                                parsedData.push(fields);
                            });
                        
                            return parsedData;
                        }
                        
                        const parsedData = customParseCSV(csvData);
                        if (parsedData.length === 0) {
                            reject(new Error('CSV file is empty.'));
                            return;
                        }
                        
                        const header = parsedData[0].join(',');
                        if (doValidation && header.trim() !== expectedHeader.trim()) {
                            reject(new Error("CSV header does not match expected format.\nExpected: " + expectedHeader));
                            return;
                        }
                        
                        // Filter out blank rows
                        const dataRows = [];
                        for (let i = 1; i < parsedData.length; i++) {
                            const isBlank = parsedData[i].every(field => field.trim() === "");
                            const joined = parsedData[i].join(',').replace(/[\s,]/g, "");
                            if (!isBlank && joined.length > 0) {
                                dataRows.push(parsedData[i].join(','));
                            }
                        }

                        const totalChunks = Math.ceil(dataRows.length / rowsPerFile);
                        const chunks = [];
                        
                        for (let i = 0; i < totalChunks; i++) {
                            const chunkData = dataRows.slice(i * rowsPerFile, (i + 1) * rowsPerFile);
                            const chunkCsv = [header].concat(chunkData).join('\n');
                            const chunkBlob = new Blob([chunkCsv], { type: 'text/csv' });
                            const chunkFile = new File([chunkBlob], `chunk_${i + 1}.csv`, { type: 'text/csv' });
                            chunks.push(chunkFile);
                        }
                        
                        resolve(chunks);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsText(file);
            });
        }

        /**
         * Centralized polling manager to prevent race conditions
         * Ensures only one polling instance is active at a time
         */
        class PollingManager {
            constructor() {
                this.activePolling = null;
                this.processedAlerts = new Map(); // fileId -> Set of alert IDs
                this.pollingInterval = null;
                this.maxPollingTime = POLLING_MAX_TIME_MS;
                this.pollingFrequency = POLLING_FREQUENCY_MS;
                this.alertCleanupDelay = ALERT_CLEANUP_DELAY;
                this.errorFileData = []; // Store error file data
            }
            
            /**
             * Start polling for a specific file
             * @param {File} file - The file being processed
             * @param {number} fileIndex - Index of the file in the upload queue
             * @returns {Promise} Promise that resolves with polling result
             */
            async startPolling(file, fileIndex) {
                console.log(`[PollingManager] Starting polling for file: ${file.name} (index: ${fileIndex})`);
                
                // Ensure no active polling
                if (this.activePolling) {
                    log.debug('[PollingManager] Waiting for existing polling to complete...');
                    await this.waitForCompletion();
                }
                
                // Clean up previous alerts to prevent cross-contamination
                this.cleanupPreviousAlerts();
                
                // Start new polling session
                const fileId = `file_${fileIndex}_${Date.now()}`;
                return new Promise((resolve, reject) => {
                    this.activePolling = {
                        file,
                        fileIndex,
                        fileId,
                        resolve,
                        reject,
                        startTime: Date.now(),
                        alertsDetected: [],
                        completed: false,
                        finalOutcome: null
                    };
                    
                    log.debug(`[PollingManager] Created polling session: ${fileId}`);
                    this.startPollingLoop();
                });
            }
            
            /**
             * Start the main polling loop
             */
            startPollingLoop() {
                let elapsed = 0;
                
                this.pollingInterval = setInterval(() => {
                    if (!this.activePolling || this.activePolling.completed) {
                        this.stopPolling();
                        return;
                    }
                    
                    this.checkForAlerts();
                    
                    elapsed += this.pollingFrequency;
                    if (elapsed >= this.maxPollingTime) {
                        console.log(`[PollingManager] Polling timeout for ${this.activePolling.file.name}`);
                        this.completePolling('timeout');
                    }
                }, this.pollingFrequency);
            }
            
            /**
             * Check for new alerts and process them
             */
            checkForAlerts() {
                const alertElements = document.querySelectorAll('div[mdn-alert-message]');
                
                alertElements.forEach(alertElement => {
                    if (this.shouldProcessAlert(alertElement)) {
                        this.processAlert(alertElement);
                    }
                });
            }
            
            /**
             * Determine if an alert should be processed by current polling session
             * @param {Element} alertElement - The alert DOM element
             * @returns {boolean} Whether to process this alert
             */
            shouldProcessAlert(alertElement) {
                const fileId = this.activePolling.fileId;
                const fileName = this.activePolling.file.name;
                const alertText = alertElement.innerText.trim();
                const alertTextLower = alertText.toLowerCase();
                
                // Skip if already processed by this file
                if (alertElement.dataset.muProcessedBy === fileId) {
                    return false;
                }
                
                // Skip if processed by any file (prevent cross-contamination)
                if (alertElement.dataset.muProcessed === 'true') {
                    return false;
                }
                
                // Check if alert appeared before this polling session started (stale alert)
                const alertTimestamp = alertElement.dataset.muAlertTimestamp;
                if (alertTimestamp && parseInt(alertTimestamp) < this.activePolling.startTime) {
                    log.debug(`[PollingManager] Skipping stale alert from before polling started. Alert time: ${alertTimestamp}, Session start: ${this.activePolling.startTime}`);
                    return false;
                }
                
                // Enhanced filename matching for better alert attribution
                // Success messages usually contain the filename, use this for better matching
                if (alertTextLower.includes('successfully upload') || alertTextLower.includes('successfully uploaded')) {
                    if (fileName) {
                        const baseFileName = fileName.replace('.csv', '').toLowerCase();
                        
                        // Check if the alert contains the current file's name
                        const alertContainsCurrentFile = alertTextLower.includes(baseFileName);
                        
                        if (!alertContainsCurrentFile) {
                            // Check if it contains any other chunk filename pattern
                            const chunkPattern = /chunk_\d+/i;
                            const alertChunkMatch = alertText.match(chunkPattern);
                            const currentChunkMatch = fileName.match(chunkPattern);
                            
                            if (alertChunkMatch && currentChunkMatch) {
                                const alertChunkNum = alertChunkMatch[0].toLowerCase();
                                const currentChunkNum = currentChunkMatch[0].toLowerCase();
                                
                                if (alertChunkNum !== currentChunkNum) {
                                    log.debug(`[PollingManager] Skipping alert - chunk mismatch. Expected: ${currentChunkNum}, Alert contains: ${alertChunkNum}`);
                                    log.debug(`[PollingManager] Full alert text: ${alertText}`);
                                    return false; // This alert is for a different chunk
                                }
                            } else {
                                log.debug(`[PollingManager] Skipping alert - filename mismatch. Expected: ${baseFileName}, Alert: ${alertText.substring(0, 100)}`);
                                return false; // This alert is likely for a different file
                            }
                        }
                    }
                }
                
                // Mark alert with timestamp when first encountered
                if (!alertElement.dataset.muAlertTimestamp) {
                    alertElement.dataset.muAlertTimestamp = Date.now().toString();
                }
                
                return true;
            }
            
            /**
             * Process a single alert element
             * @param {Element} alertElement - The alert DOM element to process
             */
            async processAlert(alertElement) {
                const fileId = this.activePolling.fileId;
                const file = this.activePolling.file;
                
                // Mark as processed by this file to prevent reprocessing
                alertElement.dataset.muProcessedBy = fileId;
                alertElement.dataset.muProcessed = 'true';
                alertElement.dataset.muFileIndex = this.activePolling.fileIndex;
                
                const alertText = alertElement.innerText.trim();
                log.debug(`[PollingManager] Processing alert for ${file.name}: ${alertText.substring(0, 100)}...`);
                
                try {
                    const classification = await classifyAlert(alertElement, alertText, file.name, this);
                    this.activePolling.alertsDetected.push(classification);
                    
                    // Update UI based on classification
                    this.updateFileStatus(classification);
                    
                    // Check if this alert indicates completion
                    if (this.shouldCompletePolling(classification)) {
                        log.debug(`[PollingManager] Completing polling with outcome: ${classification.type}`);
                        this.completePolling(classification.type);
                    }
                } catch (error) {
                    console.error(`[PollingManager] Error processing alert for ${file.name}:`, error);
                }
            }
            
            /**
             * Update file status in UI based on alert classification
             * @param {Object} classification - Alert classification result
             */
            updateFileStatus(classification) {
                const file = this.activePolling.file;
                
                switch (classification.type) {
                    case 'success_file':
                        updateStatusRow(file, 'success', classification.message);
                        this.activePolling.finalOutcome = 'success';
                        break;
                    case 'partial_failure':
                        updateStatusRow(file, 'warning', classification.message);
                        this.activePolling.finalOutcome = 'partial_failure';
                        break;
                    case 'validation_error':
                    case 'server_error':
                        updateStatusRow(file, 'error', classification.message);
                        this.activePolling.finalOutcome = 'error';
                        break;
                    case 'partial_success':
                        // Partial success usually comes with partial failure, don't override outcome
                        if (!this.activePolling.finalOutcome) {
                            log.debug('[PollingManager] Partial success detected, waiting for more alerts...');
                        }
                        break;
                    default:
                        if (classification.severity === 'success') {
                            updateStatusRow(file, 'success', classification.message);
                            this.activePolling.finalOutcome = 'success';
                        }
                }
            }
            
            /**
             * Determine if polling should complete based on alert classification
             * @param {Object} classification - Alert classification result
             * @returns {boolean} Whether to complete polling
             */
            shouldCompletePolling(classification) {
                // Complete on definitive outcomes
                if (['success_file', 'validation_error', 'server_error'].includes(classification.type)) {
                    return true;
                }
                
                // Handle partial failure + partial success combination
                const hasPartialFailure = this.activePolling.alertsDetected.some(alert => alert.type === 'partial_failure');
                const hasPartialSuccess = this.activePolling.alertsDetected.some(alert => alert.type === 'partial_success');
                
                if (hasPartialFailure && hasPartialSuccess) {
                    return true;
                }
                
                // Wait for potential partial_success after partial_failure
                if (hasPartialFailure && !hasPartialSuccess) {
                    const elapsed = Date.now() - this.activePolling.startTime;
                    return elapsed >= ALERT_SETTLE_MS;
                }
                
                return false;
            }
            
            /**
             * Complete the current polling session
             * @param {string} outcome - Final outcome of the polling
             */
            completePolling(outcome) {
                if (!this.activePolling || this.activePolling.completed) {
                    return;
                }
                
                console.log(`[PollingManager] Completing polling for ${this.activePolling.file.name} with outcome: ${outcome}`);
                
                this.activePolling.completed = true;
                this.stopPolling();
                
                const result = {
                    outcome: outcome || this.activePolling.finalOutcome || 'success',
                    alerts: this.activePolling.alertsDetected,
                    file: this.activePolling.file,
                    fileIndex: this.activePolling.fileIndex,
                    fileId: this.activePolling.fileId,
                    completionTime: Date.now() // Track when this file completed
                };
                
                // Small delay to ensure all DOM updates complete
                setTimeout(() => {
                    this.activePolling.resolve(result);
                    this.activePolling = null;
                }, this.alertCleanupDelay);
            }
            
            /**
             * Stop the polling interval
             */
            stopPolling() {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = null;
                }
            }
            
            /**
             * Clean up alerts from previous polling sessions
             */
            cleanupPreviousAlerts() {
                log.debug('[PollingManager] Cleaning up previous alerts');
                
                // Remove old processed markers to prevent buildup
                const oldAlerts = document.querySelectorAll('div[mdn-alert-message]');
                let cleanedCount = 0;
                let removedCount = 0;
                
                oldAlerts.forEach(alert => {
                    // Only clean up alerts that are not from the current session
                    if (this.activePolling && alert.dataset.muProcessedBy === this.activePolling.fileId) {
                        return; // Skip current session alerts
                    }
                    
                    // Check if alert is stale (older than 10 seconds)
                    const alertTimestamp = alert.dataset.muAlertTimestamp;
                    const currentTime = Date.now();
                    const isStale = alertTimestamp && (currentTime - parseInt(alertTimestamp)) > ALERT_STALE_MS;
                    
                    if (isStale || alert.dataset.muProcessed === 'true') {
                        // For stale alerts, remove them completely to prevent confusion
                        if (isStale) {
                            log.debug(`[PollingManager] Removing stale alert: ${alert.innerText.substring(0, 50)}...`);
                            alert.remove();
                            removedCount++;
                        } else {
                            // Just clean markers for processed alerts
                            delete alert.dataset.muProcessed;
                            delete alert.dataset.muProcessedBy;
                            delete alert.dataset.muFileIndex;
                            delete alert.dataset.muAlertTimestamp;
                            cleanedCount++;
                        }
                    }
                });
                
                log.debug(`[PollingManager] Cleaned up ${cleanedCount} old alert markers, removed ${removedCount} stale alerts`);
            }
            
            /**
             * Wait for current polling to complete
             * @returns {Promise} Promise that resolves when polling is complete
             */
            async waitForCompletion() {
                if (!this.activePolling) {
                    return;
                }
                
                return new Promise((resolve) => {
                    const checkCompletion = () => {
                        if (!this.activePolling || this.activePolling.completed) {
                            resolve();
                        } else {
                            setTimeout(checkCompletion, 50);
                        }
                    };
                    checkCompletion();
                });
            }
            
            /**
             * Check if polling is currently active
             * @returns {boolean} Whether polling is active
             */
            isPollingActive() {
                return this.activePolling !== null && !this.activePolling.completed;
            }
        }

        // Function to download and save error file data
        async function downloadErrorFile(downloadLink, fileName, pollingManager) {
            try {
                console.log(`[MassUploader] Downloading error file for ${fileName}:`, downloadLink);
                const response = await fetch(downloadLink);
                if (response.ok) {
                    const csvText = await response.text();
                    const errorData = {
                        fileName: fileName,
                        downloadedAt: new Date().toISOString(),
                        csvData: csvText,
                        recordCount: csvText.split('\n').length - 1 // Subtract header
                    };
                    // Store in polling manager's error file data
                    if (pollingManager) {
                        pollingManager.errorFileData.push(errorData);
                    }
                    console.log(`[MassUploader] Error file data saved for ${fileName}, ${errorData.recordCount} failed records`);
                    return errorData;
                } else {
                    console.error(`[MassUploader] Failed to download error file for ${fileName}:`, response.status);
                    return null;
                }
            } catch (error) {
                console.error(`[MassUploader] Error downloading file for ${fileName}:`, error);
                return null;
            }
        }

        // Function to classify alerts based on content and visual cues
        async function classifyAlert(alertElement, alertText, fileName, pollingManager) {
            const alertStyle = window.getComputedStyle(alertElement);
            const backgroundColor = alertStyle.backgroundColor;
            const color = alertStyle.color;
            
            // Check for download links and capture them
            const downloadLinkElement = alertElement.querySelector('a[href*="download"], a[href*="error"], button[onclick*="download"], [class*="download"]');
            const hasDownloadLink = downloadLinkElement !== null || alertText.toLowerCase().includes('download error file');
            
            // Normalize text for pattern matching
            const normalizedText = alertText.toLowerCase().trim();
            
            log.debug('[MassUploader] Classifying alert:', {
                text: alertText,
                backgroundColor,
                color,
                hasDownloadLink,
                normalizedText
            });
            
            log.debug('[MassUploader] Alert text analysis:', {
                includesRecordsFailed: normalizedText.includes('records failed to upload'),
                includesFailed: normalizedText.includes('failed'),
                includesUpload: normalizedText.includes('upload'),
                includesRecordsSuccess: normalizedText.includes('records successfully uploaded'),
                includesCSV: normalizedText.includes('.csv'),
                includesSuccessfullyUploaded: normalizedText.includes('successfully uploaded')
            });
            
            // Success patterns - CSV file successfully uploaded
            if (normalizedText.includes('successfully uploaded') && normalizedText.includes('.csv')) {
                const result = {
                    type: 'success_file',
                    severity: 'success',
                    message: alertText,
                    shouldProceed: true
                };
                log.debug('[MassUploader] Classification: success_file', result);
                return result;
            }
            
            // Partial failure - records failed to upload (with or without download link)
            if (normalizedText.includes('records failed to upload') ||
                (normalizedText.includes('failed') && normalizedText.includes('upload'))) {
                
                // If there's a download link, immediately download the error file
                let errorFileDownloaded = null;
                if (downloadLinkElement && downloadLinkElement.href) {
                    try {
                        errorFileDownloaded = await downloadErrorFile(downloadLinkElement.href, fileName, pollingManager);
                    } catch (error) {
                        console.error('[MassUploader] Failed to download error file:', error);
                    }
                }
                
                const result = {
                    type: 'partial_failure',
                    severity: 'warning',
                    message: alertText,
                    shouldProceed: true, // Can proceed but mark as partial failure
                    hasErrorFile: hasDownloadLink,
                    errorFileData: errorFileDownloaded
                };
                log.debug('[MassUploader] Classification: partial_failure', result);
                return result;
            }
            
            // Partial success (usually paired with failure)
            if (normalizedText.includes('records successfully uploaded') && !normalizedText.includes('.csv')) {
                const result = {
                    type: 'partial_success',
                    severity: 'info',
                    message: alertText,
                    shouldProceed: true
                };
                log.debug('[MassUploader] Classification: partial_success', result);
                return result;
            }
            
            // Validation errors
            if (normalizedText.includes('validation error') || normalizedText.includes('headers must be')) {
                const result = {
                    type: 'validation_error',
                    severity: 'error',
                    message: alertText,
                    shouldProceed: false // Stop processing
                };
                log.debug('[MassUploader] Classification: validation_error', result);
                return result;
            }
            
            // Server errors
            if (normalizedText.includes('server error') || normalizedText.includes('try again later')) {
                const result = {
                    type: 'server_error',
                    severity: 'error',
                    message: alertText,
                    shouldProceed: false // Stop processing
                };
                log.debug('[MassUploader] Classification: server_error', result);
                return result;
            }
            
            // Generic success (fallback)
            if (normalizedText.includes('success')) {
                const result = {
                    type: 'generic_success',
                    severity: 'success',
                    message: alertText,
                    shouldProceed: true
                };
                log.debug('[MassUploader] Classification: generic_success', result);
                return result;
            }
            
            // Unknown alert type
            const result = {
                type: 'unknown',
                severity: 'info',
                message: alertText,
                shouldProceed: true // Default to proceed unless explicitly an error
            };
            
            console.log('[MassUploader] Classification result:', result);
            return result;
        }


        // === Upload logic ===
        uploadButton.addEventListener('click', async () => {
            const selectedMethod = document.querySelector('input[name="uploadMethod"]:checked').value;
            let filesToUpload = [];

            if (selectedMethod === 'files') {
                // Regular file/folder upload
                const files = fileInput.files;
                if (!files || files.length === 0) {
                    alert('Please select files to upload.');
                    return;
                }
                filesToUpload = Array.from(files);
            } else if (selectedMethod === 'chunk') {
                // CSV chunking and upload
                const csvFile = csvFileInput.files[0];
                if (!csvFile) {
                    if (window.TmTheme && window.TmTheme.showToast) {
                        window.TmTheme.showToast('Please select a CSV file to chunk and upload.', 'warning', 4000);
                    } else {
                        alert('Please select a CSV file to chunk and upload.');
                    }
                    return;
                }

                const rowsPerFile = parseInt(document.getElementById('rowsPerChunk').value, 10);
                if (isNaN(rowsPerFile) || rowsPerFile < 2) {
                    alert('Please enter a valid number of rows per file (minimum 2 - header + at least 1 data row).');
                    return;
                }

                const doValidation = document.getElementById('uploadValidation').checked;


                uploadButton.disabled = true;
                statusContainer.innerHTML = '';

                // Add status header for chunking
                statusContainer.innerHTML = `
                    <div class="tm-mu-statusHeader">
                        <span style="width:22px;flex-shrink:0;">Mark</span>
                        <span style="flex:1 1 auto;">Processing</span>
                    </div>
                `;

                // Add chunking status row
                const chunkingStatusRow = document.createElement('div');
                chunkingStatusRow.className = 'tm-mu-statusRow';
                chunkingStatusRow.innerHTML = `
                    <span style="width:22px;flex-shrink:0;"></span>
                    <div class="tm-mu-statusText status-chunking">Chunking CSV file...</div>
                `;
                statusContainer.appendChild(chunkingStatusRow);

                try {
                    // Chunk the CSV file
                    const chunks = await chunkCSVFile(csvFile, rowsPerFile, doValidation);
                    
                    // Update status
                    chunkingStatusRow.querySelector('.tm-mu-statusText').innerHTML = `Created ${chunks.length} chunks from ${csvFile.name}`;
                    chunkingStatusRow.querySelector('.tm-mu-statusText').className = 'tm-mu-statusText status-success';
                    
                    // Add file tracking header for chunk files
                    const fileTrackingHeader = document.createElement('div');
                    fileTrackingHeader.className = 'tm-mu-statusHeader';
                    fileTrackingHeader.innerHTML = `
                        <span style="width:22px;flex-shrink:0;">Mark</span>
                        <span style="flex:1 1 auto;">Chunk Files</span>
                    `;
                    statusContainer.appendChild(fileTrackingHeader);
                    
                    // Create individual file tracking rows for chunks
                    chunks.forEach(file => {
                        createFileTrackingRow(file);
                    });
                    
                    // Set filesToUpload to chunks for the upload process
                    filesToUpload = chunks;
                    
                } catch (error) {
                    console.error('Error chunking CSV:', error);
                    chunkingStatusRow.querySelector('.tm-mu-statusText').innerHTML = `Error: ${error.message}`;
                    chunkingStatusRow.querySelector('.tm-mu-statusText').className = 'tm-mu-statusText status-error';
                    uploadButton.disabled = false;
                    return;
                }
            }

            // Ensure status rows exist before proceeding with upload
            if (filesToUpload.length > 0) {
                // Check if status rows already exist, if not create them
                const firstFileKey = filesToUpload[0].webkitRelativePath || filesToUpload[0].name;
                const firstFileId = `status-${btoa(firstFileKey).replace(/[=+/]/g, '')}`;
                if (!document.getElementById(firstFileId)) {
                    // Status rows don't exist, create them now
                    displayFilesWithStatus(filesToUpload);
                }
            }

            // Identify the site's existing file input (the one the page actually uses)
            // Exclude our own internal file inputs
            const siteFileInput = [...document.querySelectorAll('input[type="file"]')]
                .find(el => !['massFileInput', 'csvFileInput'].includes(el.id));
            if (!siteFileInput) {
                filesToUpload.forEach(file => {
                    updateStatusRow(file, 'error', 'Could not find the site\'s file input.');
                });
                uploadButton.disabled = false;
                return;
            }

            // Create skip wait button
            const skipWaitButton = document.createElement('button');
            skipWaitButton.id = 'skipWaitButton';
            skipWaitButton.innerText = 'Skip Wait (Next File)';
            skipWaitButton.style.cssText = `
                background: #ff9800;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                margin-top: 10px;
                display: none;
            `;
            skipWaitButton.addEventListener('mouseover', () => {
                skipWaitButton.style.background = '#f57c00';
            });
            skipWaitButton.addEventListener('mouseout', () => {
                skipWaitButton.style.background = '#ff9800';
            });
            
            // Insert skip button after upload button
            uploadButton.parentNode.insertBefore(skipWaitButton, uploadButton.nextSibling);

            // Track timeouts and current upload state
            let uploadTimeouts = [];
            let countdownIntervals = [];
            let currentUploadIndex = 0;
            let isUploading = false;
            let failedFiles = []; // Track files that failed to upload
            let processedAlerts = new Set(); // Avoid processing duplicate alerts
            let lastFileCompletionTime = 0; // Track when last file completed for minimum delay enforcement
            
            // Initialize polling manager for centralized alert handling
            const pollingManager = new PollingManager();
            
            /**
             * Process the next file in the upload queue
             * Uses managed polling to prevent race conditions
             */
            async function processNextFile() {
                console.log(`[MassUploader] processNextFile() called - Index: ${currentUploadIndex}/${filesToUpload.length}`);
                
                if (currentUploadIndex >= filesToUpload.length) {
                    // All files processed - show summary
                    console.log('[MassUploader] All files processed, showing summary');
                    showUploadSummary();
                    uploadButton.disabled = false;
                    skipWaitButton.style.display = 'none';
                    isUploading = false;
                    return;
                }

                const file = filesToUpload[currentUploadIndex];
                console.log(`[MassUploader] Processing file ${currentUploadIndex + 1}/${filesToUpload.length}: ${file.name}`);
                
                // Update status to "Injecting"
                updateStatusRow(file, 'injecting');

                // Send file to page context via postMessage (bypasses userscript sandbox restrictions)
                window.postMessage({ type: 'MU_SET_FILE', file }, '*');

                try {
                    // Use managed polling instead of direct pollForAlerts call
                    const result = await pollingManager.startPolling(file, currentUploadIndex);
                    console.log(`[MassUploader] File ${file.name} completed with result:`, result);
                    
                    // Handle the completion result
                    await handleFileCompletion(file, result);
                    
                } catch (error) {
                    console.error(`[MassUploader] Error processing file ${file.name}:`, error);
                    updateStatusRow(file, 'error', error.message);
                    
                    // Handle error completion
                    await handleFileCompletion(file, {
                        outcome: 'error',
                        alerts: [{ message: error.message, type: 'error' }],
                        file: file,
                        fileIndex: currentUploadIndex
                    });
                }
            }

            /**
             * Handle completion of a file upload
             * @param {File} file - The completed file
             * @param {Object} result - Result from polling manager
             */
            async function handleFileCompletion(file, result) {
                const { outcome, alerts, completionTime } = result;
                
                // Track completion time for minimum delay enforcement
                lastFileCompletionTime = completionTime || Date.now();
                
                console.log(`[MassUploader] Handling completion for ${file.name} with outcome: ${outcome}`);
                
                // Handle different outcomes
                if (outcome === 'error') {
                    // For critical errors, ask user if they want to continue (non-blocking)
                    const alertMessage = alerts[alerts.length - 1]?.message || 'Unknown error';
                    const shouldContinue = await showConfirmModal(
                        'Upload Error',
                        `Critical error with "${file.name}":\n${alertMessage}`,
                        'Continue', 'Stop'
                    );
                    
                    if (!shouldContinue) {
                        console.log('[MassUploader] User chose to stop processing after error');
                        showUploadSummary();
                        uploadButton.disabled = false;
                        skipWaitButton.style.display = 'none';
                        isUploading = false;
                        return;
                    }
                }
                
                // Update failed files tracking
                if (outcome === 'partial_failure' || outcome === 'error') {
                    const alertMessage = alerts[alerts.length - 1]?.message || 'Unknown error';
                    if (!failedFiles.some(f => f.file === file && f.reason === alertMessage)) {
                        failedFiles.push({
                            file: file,
                            reason: alertMessage,
                            type: outcome
                        });
                    }
                }
                
                // Increment index only after processing is complete
                currentUploadIndex++;
                
                // Schedule next file (if not the last one)
                if (currentUploadIndex < filesToUpload.length) {
                    // Enforce minimum 5-second delay between uploads to prevent race conditions
                    const minimumDelay = MIN_UPLOAD_DELAY_MS;
                    const timeSinceCompletion = Date.now() - (completionTime || Date.now());
                    const additionalDelayNeeded = Math.max(0, minimumDelay - timeSinceCompletion);
                    
                    // Determine wait time based on outcome
                    let baseWaitTime = BASE_WAIT_SUCCESS_MS;
                    if (outcome === 'error' || outcome === 'partial_failure') {
                        baseWaitTime = BASE_WAIT_ERROR_MS;
                    }
                    
                    // Ensure minimum delay is always enforced
                    const waitTime = Math.max(baseWaitTime, minimumDelay + additionalDelayNeeded);
                    
                    console.log(`[MassUploader] Enforcing ${waitTime}ms delay (minimum ${minimumDelay}ms) before next file`);
                    
                    // Hide skip button initially - will show after minimum delay
                    skipWaitButton.style.display = 'none';
                    
                    // Show skip button after minimum delay has passed
                    const showSkipTimeout = setTimeout(() => {
                        skipWaitButton.style.display = 'block';
                        
                        // Start countdown timer from remaining time
                        let timeRemaining = Math.floor((waitTime - minimumDelay) / 1000);
                        const nextFileName = filesToUpload[currentUploadIndex].name;
                        
                        // Update button text
                        skipWaitButton.innerText = `Skip Wait (${timeRemaining}s) - Next: ${nextFileName}`;
                        
                        // Countdown interval for remaining time
                        const countdownInterval = setInterval(() => {
                            timeRemaining--;
                            if (timeRemaining > 0) {
                                skipWaitButton.innerText = `Skip Wait (${timeRemaining}s) - Next: ${nextFileName}`;
                            } else {
                                clearInterval(countdownInterval);
                            }
                        }, 1000);
                        
                        countdownIntervals.push(countdownInterval);
                    }, minimumDelay + additionalDelayNeeded);
                    
                    uploadTimeouts.push(showSkipTimeout);
                    
                    const nextTimeout = setTimeout(() => {
                        skipWaitButton.style.display = 'none';
                        processNextFile();
                    }, waitTime);
                    
                    uploadTimeouts.push(nextTimeout);
                } else {
                    // Last file, show summary and re-enable upload
                    setTimeout(() => {
                        showUploadSummary();
                        uploadButton.disabled = false;
                        skipWaitButton.style.display = 'none';
                        isUploading = false;
                    }, 1000);
                }
            }

            // Function to compile master error file
            function compileMasterErrorFile() {
                const errorFileData = pollingManager.errorFileData;
                if (errorFileData.length === 0) {
                    return null;
                }
                
                console.log('[MassUploader] Compiling master error file from', errorFileData.length, 'error files');
                
                // Combine all error CSV data
                let masterCSV = '';
                let totalFailedRecords = 0;
                
                errorFileData.forEach((errorFile, index) => {
                    const lines = errorFile.csvData.split('\n');
                    if (index === 0) {
                        // Include header from first file
                        masterCSV += lines.join('\n');
                    } else {
                        // Skip header for subsequent files, just add data rows
                        const dataRows = lines.slice(1);
                        if (dataRows.length > 0) {
                            masterCSV += '\n' + dataRows.join('\n');
                        }
                    }
                    totalFailedRecords += errorFile.recordCount;
                });
                
                return {
                    csvData: masterCSV,
                    totalRecords: totalFailedRecords,
                    sourceFiles: errorFileData.map(ef => ef.fileName),
                    compiledAt: new Date().toISOString()
                };
            }
            
            // Function to download master error file
            function downloadMasterErrorFile(masterErrorData) {
                const blob = new Blob([masterErrorData.csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `master_failed_records_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('[MassUploader] Master error file downloaded:', link.download);
            }

            // Function to show upload summary
            function showUploadSummary() {
                const totalFiles = filesToUpload.length;
                const failedCount = failedFiles.length;
                const successCount = Math.max(0, totalFiles - failedCount);
                const masterErrorData = compileMasterErrorFile();
                
                console.log('[MassUploader] Upload Summary:', {
                    total: totalFiles,
                    successful: successCount,
                    failed: failedCount,
                    failedFiles: failedFiles,
                    errorFileData: pollingManager.errorFileData,
                    masterErrorData: masterErrorData
                });
                
                // Create summary in status container
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'tm-mu-summary';
                summaryDiv.style.cssText = `
                    margin-top: 15px;
                    padding: 12px;
                    border: 2px solid #004E36;
                    border-radius: 6px;
                    background: #f8f9fa;
                `;
                
                let summaryHTML = `
                    <h4 style="margin: 0 0 8px 0; color: #004E36;">Upload Summary</h4>
                    <p style="margin: 4px 0;"><strong>Total Files:</strong> ${totalFiles}</p>
                    <p style="margin: 4px 0; color: #388e3c;"><strong>Successful:</strong> ${successCount}</p>
                `;
                
                if (failedCount > 0) {
                    summaryHTML += `<p style="margin: 4px 0; color: #c62828;"><strong>Failed:</strong> ${failedCount}</p>`;
                    summaryHTML += `<details style="margin-top: 8px;">
                        <summary style="cursor: pointer; font-weight: bold; color: #c62828;">Failed Files Details</summary>
                        <ul style="margin: 8px 0; padding-left: 20px;">`;
                    
                    failedFiles.forEach(failed => {
                        summaryHTML += `<li style="margin: 4px 0;">
                            <strong>${failed.file.name}</strong><br>
                            <small style="color: #666;">${failed.reason}</small>
                        </li>`;
                    });
                    
                    summaryHTML += `</ul></details>`;
                }
                
                // Add master error file section if we have error data
                if (masterErrorData) {
                    summaryHTML += `
                        <div style="margin-top: 12px; padding: 8px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                            <h5 style="margin: 0 0 6px 0; color: #856404;">📄 Failed Records Compilation</h5>
                            <p style="margin: 2px 0; font-size: 13px;"><strong>Total Failed Records:</strong> ${masterErrorData.totalRecords}</p>
                            <p style="margin: 2px 0; font-size: 13px;"><strong>Source Files:</strong> ${masterErrorData.sourceFiles.length}</p>
                            <button id="downloadMasterErrorFile" style="
                                margin-top: 6px;
                                background: #ff9800;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                font-weight: bold;
                            ">📥 Download Master Error File</button>
                        </div>
                    `;
                }
                
                summaryDiv.innerHTML = summaryHTML;
                
                const statusContainer = document.getElementById('statusContainer');
                if (statusContainer) {
                    statusContainer.appendChild(summaryDiv);
                    summaryDiv.scrollIntoView({block: 'nearest'});
                    
                    // Add event listener for master error file download
                    if (masterErrorData) {
                        const downloadButton = document.getElementById('downloadMasterErrorFile');
                        if (downloadButton) {
                            downloadButton.addEventListener('click', () => {
                                downloadMasterErrorFile(masterErrorData);
                            });
                        }
                    }
                }
            }

            // Enhanced skip wait button functionality with race condition prevention and minimum delay enforcement
            skipWaitButton.addEventListener('click', async () => {
                console.log('[MassUploader] Skip button clicked');
                
                // Clear any pending timeouts and countdown intervals
                uploadTimeouts.forEach(timeout => clearTimeout(timeout));
                countdownIntervals.forEach(interval => clearInterval(interval));
                uploadTimeouts = [];
                countdownIntervals = [];
                
                // Ensure any active polling completes before proceeding
                if (pollingManager.isPollingActive()) {
                    console.log('[MassUploader] Waiting for active polling to complete before skip...');
                    skipWaitButton.innerText = 'Waiting for completion...';
                    skipWaitButton.disabled = true;
                    
                    await pollingManager.waitForCompletion();
                    
                    skipWaitButton.disabled = false;
                }
                
                // Enforce minimum 5-second delay even when skipping
                const minimumDelay = MIN_UPLOAD_DELAY_MS;
                const timeSinceCompletion = Date.now() - lastFileCompletionTime;
                const remainingDelay = Math.max(0, minimumDelay - timeSinceCompletion);
                
                if (remainingDelay > 0) {
                    console.log(`[MassUploader] Enforcing ${remainingDelay}ms minimum delay before skip`);
                    skipWaitButton.innerText = `Enforcing minimum delay (${Math.ceil(remainingDelay/1000)}s)...`;
                    skipWaitButton.disabled = true;
                    
                    setTimeout(() => {
                        skipWaitButton.disabled = false;
                        skipWaitButton.style.display = 'none';
                        processNextFile();
                    }, remainingDelay);
                } else {
                    skipWaitButton.style.display = 'none';
                    
                    // Small delay to ensure cleanup completes
                    setTimeout(() => {
                        processNextFile();
                    }, 100);
                }
            });

            // Start the upload process
            isUploading = true;
            processNextFile();
        });

        // Trap focus inside modal
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
                const focusableArr = Array.from(focusable).filter(el => el.offsetParent !== null && !el.disabled);
                if (!focusableArr.length) return;
                const first = focusableArr[0], last = focusableArr[focusableArr.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
            if (e.key === 'Escape') {
                closeButton.click();
            }
        });
    }

    function wireUpMassUploaderButton() {
        const massUploaderButton = document.getElementById('massUploaderButton');
        if (massUploaderButton) {
            massUploaderButton.addEventListener('click', addMassUploaderFunctionality);
            return true;
        }
        return false;
    }

    // Try hooking up immediately
    if (!wireUpMassUploaderButton()) {
        // If the button isn't in the DOM yet, watch for changes
        const observer = new MutationObserver(() => {
            if (wireUpMassUploaderButton()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module MassUploaderButton.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: FileChunker.js
 * ================================================================ */
try {
(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addFileChunkerFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addFileChunkerFunctionality() {
        console.log('[FileChunker] Button clicked');

        // Prevent duplicate overlays
        const existingOverlay = document.getElementById('fileChunkerOverlay');
        if (existingOverlay) {
            console.log('[FileChunker] Overlay already open, skipping duplicate');
            existingOverlay.focus();
            return;
        }

        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'fileChunkerOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.className = 'close-button';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = '#fff';
            closeButton.style.backgroundColor = '#000';
            closeButton.style.padding = '5px';
            closeButton.style.borderRadius = '0';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            // Create a container for form elements and messages
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#1a1a1a';
            formContainer.style.color = '#f1f1f1';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '320px';
            formContainer.style.textAlign = 'center';

            // Message element for progress and success
            var messageEl = document.createElement('div');
            messageEl.style.marginBottom = '10px';
            messageEl.style.fontSize = '14px';
            messageEl.style.color = '#333';

            // Create form elements inner HTML including the upload validation checkbox
            formContainer.innerHTML = `
                <h3>File Chunker</h3>
                <input type="file" id="fileChunkerInput" accept=".csv" style="width: 100%; margin-bottom: 10px;">
                <label for="rowsPerChunk">Rows Per File</label>
                <input type="number" id="rowsPerChunk" value="1000" min="1" style="width: 100%; margin-bottom: 10px;">
                <label for="uploadValidation" style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="uploadValidation" checked> Upload Validation
                </label>
                <button id="chunkFileButton" style="width: 100%; margin-bottom: 10px;">Chunk File & Download Zip</button>
                <!-- Future section for additional CSV data validation can be added below. -->
            `;

            // Append message element and close button
            formContainer.insertBefore(messageEl, formContainer.firstChild);
            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Function to update message element
            function updateMessage(text) {
                messageEl.textContent = text;
            }

            // Event listener for "Chunk File & Download Zip" button
            document.getElementById('chunkFileButton').addEventListener('click', function() {
                var fileInput = document.getElementById('fileChunkerInput');
                if (fileInput.files.length === 0) {
                    alert('Please select a CSV file to upload.');
                    return;
                }
                var file = fileInput.files[0];
                var rowsPerFile = parseInt(document.getElementById('rowsPerChunk').value, 10);
                if (isNaN(rowsPerFile) || rowsPerFile < 1) {
                    alert('Please enter a valid number of rows per file.');
                    return;
                }
                console.log('File selected:', file.name, 'Rows per file:', rowsPerFile);

                // Disable button and show processing indicator
                var chunkButton = document.getElementById('chunkFileButton');
                chunkButton.disabled = true;
                updateMessage('Processing...');

                // Check if JSZip is available
                if (typeof JSZip === 'undefined') {
                    alert('JSZip library is required for zipping the files. Please include it on your page.');
                    chunkButton.disabled = false;
                    updateMessage('');
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var csvData = event.target.result;
                        var header, dataRows;
                        var expectedHeader = "Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date";
                        // Determine if header validation is enabled
                        var doValidation = document.getElementById('uploadValidation').checked;
                        
                        // Use PapaParse for robust CSV parsing
                        function customParseCSV(data) {
                            const lines = data.split('\n');
                            const parsedData = [];
                            const expectedColumns = 9; // Adjust based on your CSV structure
                        
                            lines.forEach(line => {
                                let fields = line.split(',');
                                for (let i = 0; i < fields.length - 1; i++) {
                                    if (fields[i].endsWith(',') && fields[i + 1].startsWith(' ')) {
                                        fields[i] = fields[i] + fields[i + 1];
                                        fields.splice(i + 1, 1);
                                    }
                                }
                                while (fields.length < expectedColumns) {
                                    fields.push(''); // Fill with blanks if necessary
                                }
                                parsedData.push(fields);
                            });
                        
                            return parsedData;
                        }
                        
                        var parsedData = customParseCSV(csvData);
                        if (parsedData.length === 0) {
                            alert('CSV file is empty.');
                            chunkButton.disabled = false;
                            updateMessage('');
                            return;
                        }
                        header = parsedData[0].join(',');
                        if (doValidation && header.trim() !== expectedHeader.trim()) {
                            alert("CSV header does not match expected format.\nExpected: " + expectedHeader);
                            chunkButton.disabled = false;
                            updateMessage('');
                            return;
                        }
                        // Filter out blank rows (all fields empty or whitespace, or row is just commas)
                        dataRows = [];
                        for (var i = 1; i < parsedData.length; i++) {
                            // Check if all fields are empty/whitespace
                            var isBlank = parsedData[i].every(field => field.trim() === "");
                            // Or if the joined row is just commas (e.g., ",,,,,,,")
                            var joined = parsedData[i].join(',').replace(/[\s,]/g, "");
                            if (!isBlank && joined.length > 0) {
                                dataRows.push(parsedData[i].join(','));
                            }
                        }

                        var totalChunks = Math.ceil(dataRows.length / rowsPerFile);
                        console.log('Total chunks to create:', totalChunks);

                        var zip = new JSZip();
                        for (var i = 0; i < totalChunks; i++) {
                            try {
                                var chunkData = dataRows.slice(i * rowsPerFile, (i + 1) * rowsPerFile);
                                var chunkCsv = [header].concat(chunkData).join('\n');
                                zip.file('chunk_' + (i + 1) + '.csv', chunkCsv);
                            } catch (chunkError) {
                                console.error('Error processing chunk ' + (i + 1) + ':', chunkError);
                            }
                        }

                        // Generate zip file and trigger download
                        zip.generateAsync({ type: 'blob' }).then(function(content) {
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(content);
                            link.download = 'chunked_files.zip';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            updateMessage('Success: Files chunked and zip downloaded.');
                            chunkButton.disabled = false;
                        }).catch(function(error) {
                            console.error('Error generating zip file:', error);
                            alert('An error occurred while generating the zip file.');
                            chunkButton.disabled = false;
                            updateMessage('');
                        });
                    } catch (err) {
                        console.error('Error processing CSV:', err);
                        alert('An error occurred: ' + err.message);
                        chunkButton.disabled = false;
                        updateMessage('');
                    }
                };
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('[FileChunker] File Chunker Failed', error);
        }
    }

    try {
        module.exports = {
            addFileChunkerFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Use MutationObserver to detect when the filechunker button is added to the DOM
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                var fileChunkerButton = document.getElementById('filechunker');
                if (fileChunkerButton) {
                    fileChunkerButton.addEventListener('click', addFileChunkerFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module FileChunker.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: componentUploadBuilder.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addComponentUploadBuilderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addComponentUploadBuilderFunctionality() {
        console.log('[ComponentBuilder] Button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'componentUploadBuilderOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
        var closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '400px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Component Builder & Propagator</h3>
            <label for="itemListInput">Item List (.xlsx, .csv) <a href="#" id="downloadItemListTemplate">Download Template</a></label>
            <input type="file" id="itemListInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
            <label for="storeMapInput">Store Map (.xlsx, .csv) <a href="#" id="downloadStoreMapTemplate">Download Template</a></label>
            <input type="file" id="storeMapInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
            <button id="processFilesButton" style="width: 100%; margin-bottom: 10px;">Process Files</button>
            <div id="statusMessage" style="text-align: center; font-size: 14px; color: #004E36;"></div>
        `;

        document.addEventListener('DOMContentLoaded', function() {
            const downloadItemListTemplate = document.getElementById('downloadItemListTemplate');
            if (downloadItemListTemplate) {
                downloadItemListTemplate.addEventListener('click', function(event) {
                    event.preventDefault();
                    const headers = ['sku', 'itemName', 'region'];
                    // Use a Blob instead of a data: URI so reserved characters such as
                    // '#' are never interpreted as a URI fragment delimiter.
                    const csvContent = headers.join(",") + "\r\n";
                    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const objectUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", objectUrl);
                    link.setAttribute("download", "ItemListTemplate.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(objectUrl);
                });
            } else {
                console.warn('downloadItemListTemplate not found in the DOM.');
            }
        
            const downloadStoreMapTemplate = document.getElementById('downloadStoreMapTemplate');
            if (downloadStoreMapTemplate) {
                downloadStoreMapTemplate.addEventListener('click', function(event) {
                    event.preventDefault();
                    const headers = ['Store ID', 'Region', 'Merchant ID', 'WFMOA Merchant ID'];
                    // Use a Blob instead of a data: URI so reserved characters such as
                    // '#' are never interpreted as a URI fragment delimiter.
                    const csvContent = headers.join(",") + "\r\n";
                    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const objectUrl = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", objectUrl);
                    link.setAttribute("download", "StoreMapTemplate.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(objectUrl);
                });
            } else {
                console.warn('downloadStoreMapTemplate not found in the DOM.');
            }
        });

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        document.getElementById('processFilesButton').addEventListener('click', function() {
            const itemListFile = document.getElementById('itemListInput').files[0];
            const storeMapFile = document.getElementById('storeMapInput').files[0];
            const statusMessage = document.getElementById('statusMessage');

            if (!itemListFile || !storeMapFile) {
                statusMessage.innerText = 'Please select both files.';
                return;
            }

            statusMessage.innerText = 'Processing...';

            // Read and process the item list file
            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const itemListSheet = workbook.Sheets[workbook.SheetNames[0]];
                const itemList = XLSX.utils.sheet_to_json(itemListSheet);

                // Read and process the store map file
                const storeReader = new FileReader();
                storeReader.onload = function(event) {
                    const csvData = event.target.result;
                    const storeMap = Papa.parse(csvData, { header: true }).data;

                    // Propagate items across relevant Store IDs
                    const result = [];
                    itemList.forEach(item => {
                        const regions = item.region.split(',').map(r => r.trim());
                        storeMap.forEach(store => {
                            if (regions.includes(store.Region)) {
                                result.push({
                                    sku: item.sku,
                                    itemName: item.itemName,
                                    storeId: store['Store ID'],
                                    merchantId: store['Merchant ID'],
                                    wfmoaMerchantId: store['WFMOA Merchant ID']
                                });
                            }
                        });
                    });

                    // Create and download the result as an xlsx file
                    const resultSheet = XLSX.utils.json_to_sheet(result);
                    const resultWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');
                    XLSX.writeFile(resultWorkbook, 'Component_Propagation_Results.xlsx');

                    statusMessage.innerText = 'Processing complete. File downloaded.';
                };
                storeReader.readAsText(storeMapFile);
            };
            reader.readAsArrayBuffer(itemListFile);
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const componentUploadBuilderButton = document.getElementById('componentUploadBuilderButton');
                if (componentUploadBuilderButton) {
                    componentUploadBuilderButton.addEventListener('click', addComponentUploadBuilderFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module componentUploadBuilder.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: ExistingItemEditor.js
 * ================================================================ */
try {
(function () {
  'use strict';

  /* -------------------------------------------------- *
   *  ERROR HELPERS & GLOBALS
   * -------------------------------------------------- */
  // Scoped helpers (no longer on window)
  function showInlineError(context, message) {
    let errorDiv = context.querySelector('#tm-ei-error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'tm-ei-error-message';
      errorDiv.style.cssText = 'margin-top:10px;padding:10px;background:rgba(211,47,47,0.1);border:1px solid #d32f2f;border-radius:4px;color:#ff6659;font-size:14px;';
      context.appendChild(errorDiv);
    }
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
  }

  function clearInlineError(context) {
    const errorDiv = context.querySelector('#tm-ei-error-message');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  function confirmWarning(message) {
    return confirm('Warning:\n\n' + message + '\n\nDo you want to continue anyway?');
  }

  /* -------------------------------------------------- *
   *  CONSTANTS & HELPERS
   * -------------------------------------------------- */
  const STYLE_ID               = 'tm-ei-style';
  const TABLE_CONTAINER        = 'tm-ei-table';
  const DOWNLOAD_BTN_ID        = 'tm-ei-downloadCsv';
  const EDIT_BTN_ID            = 'tm-ei-openEditor';
  const OVERLAY_ID             = 'tm-ei-overlay';

  const OPEN_ICON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
      <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1a.5.5 0 0 1-.708
               0l-1-1a.5.5 0 0 1 0-.708l1-1a.5.5 0 0 1 .708 0l1 1zm-1.75
               2.456-1-1L4 11.146V12h.854l8.898-8.898z"/>
      <path fill-rule="evenodd"
            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0
               1.5-1.5v-7a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-11a.5.5
               0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0
               0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
    </svg> Edit Existing Item`;

  const HEADERS = [
    'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC',
    'Availability', 'Current Inventory', 'Sales Floor Capacity',
    'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
  ];
  
  // Cosmetic columns (not included in export)
  const COSMETIC_HEADERS = ['Reserved Quantity', 'Online Availability'];
  const TOTAL_DISPLAY_COLUMNS = HEADERS.length + COSMETIC_HEADERS.length;

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const createEl = (tag, attrs = {}, html = '') => {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    if (html) el.innerHTML = html;
    return el;
  };
  const removeEl = id => { const el = $('#' + id); if (el) el.remove(); };
  const debounce = (fn, ms = 150) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  /* -------------------------------------------------- *
   *  ENHANCED DATA MODEL
   * -------------------------------------------------- */
  class TableDataModel {
    constructor(initialData = []) {
      this.data = [HEADERS, ...initialData];
      this.originalData = this.getData();
    }
    
    getData() {
      return this.data.map(row => [...row]);
    }
    
    setData(newData) {
      this.data = newData.map(row => [...row]);
    }
    
    getCell(row, col) {
      return this.data[row] && this.data[row][col] ? this.data[row][col] : '';
    }
    
    setCell(row, col, value) {
      if (!this.data[row]) this.data[row] = [];
      this.data[row][col] = String(value);
    }
    
    // Get reserved quantity cosmetic column value
    getReservedQuantity(row) {
      const reserved = this.reservedQuantities ? (this.reservedQuantities[row - 1] || 0) : 0;
      return String(reserved);
    }
    
    // Get online availability cosmetic column value
    getOnlineAvailability(row) {
      const andon = this.getCell(row, 6); // Andon Cord column
      const availability = this.getCell(row, 3); // Availability column
      const inventory = parseInt(this.getCell(row, 4)) || 0; // Current Inventory column
      const reserved = this.reservedQuantities ? (this.reservedQuantities[row - 1] || 0) : 0;
      
      // If Andon Cord is ON (Enabled) → show "0"
      if (andon === 'Enabled') {
        return '0';
      }
      
      // If Andon Cord is OFF (Disabled) and Unlimited → show "Unlimited"
      if (availability === 'Unlimited') {
        return 'Unlimited';
      }
      
      // If Andon Cord is OFF (Disabled) and Limited → show (current inventory - reserved quantity)
      const onlineAvailable = Math.max(0, inventory - reserved);
      return String(onlineAvailable);
    }
    
    deleteRows(rowIndices) {
      // Sort in descending order to avoid index shifting issues
      rowIndices.sort((a, b) => b - a);
      rowIndices.forEach(index => {
        if (index > 0) { // Don't delete header
          this.data.splice(index, 1);
        }
      });
    }
    
    toCSV(includeCosmeticColumns = false) {
      return this.data.map((row, rowIndex) => {
        let csvRow = row.map((cell, colIndex) => {
          // Skip header row (index 0) - apply normal formatting
          if (rowIndex === 0) {
            return `"${String(cell || '').replace(/"/g, '""')}"`;
          }
          
          // Apply blank field logic for specific columns
          if (colIndex === 5) { // Sales Floor Capacity
            if (cell === '0') {
              return '""'; // Output as blank field
            }
          } else if (colIndex === 7 || colIndex === 8) { // Tracking Start Date or Tracking End Date
            if (!cell || cell === '' || cell === null || cell === undefined) {
              return '""'; // Output as blank field
            }
          }
          
          // Default CSV formatting for all other cases
          return `"${String(cell || '').replace(/"/g, '""')}"`;
        });
        
        // Add cosmetic columns if requested
        if (includeCosmeticColumns && rowIndex > 0) {
          // Add Reserved Quantity
          const reservedQty = this.getReservedQuantity(rowIndex);
          csvRow.push(`"${String(reservedQty || '').replace(/"/g, '""')}"`);
          
          // Add Online Availability
          const onlineAvail = this.getOnlineAvailability(rowIndex);
          csvRow.push(`"${String(onlineAvail || '').replace(/"/g, '""')}"`);
        } else if (includeCosmeticColumns && rowIndex === 0) {
          // Add cosmetic headers
          COSMETIC_HEADERS.forEach(header => {
            csvRow.push(`"${String(header || '').replace(/"/g, '""')}"`);
          });
        }
        
        return csvRow.join(',');
      }).join('\n');
    }
  }

  /* -------------------------------------------------- *
   *  UNDO/REDO SYSTEM
   * -------------------------------------------------- */
  class UndoRedoManager {
    constructor(dataModel) {
      this.dataModel = dataModel;
      this.history = [];
      this.currentIndex = -1;
      this.maxHistory = 50;
      this.saveInitialState();
    }
    
    saveInitialState() {
      this.saveState('Initial state');
    }
    
    saveState(description) {
      // Remove any future history if we're not at the end
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Add new state
      this.history.push({
        data: JSON.parse(JSON.stringify(this.dataModel.getData())),
        description,
        timestamp: Date.now()
      });
      
      // Trim history if too long
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      } else {
        this.currentIndex++;
      }
      
      this.updateUndoRedoButtons();
    }
    
    undo() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        const state = this.history[this.currentIndex];
        this.dataModel.setData(state.data);
        this.updateUndoRedoButtons();
        return state.description;
      }
      return null;
    }
    
    redo() {
      if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++;
        const state = this.history[this.currentIndex];
        this.dataModel.setData(state.data);
        this.updateUndoRedoButtons();
        return state.description;
      }
      return null;
    }
    
    canUndo() {
      return this.currentIndex > 0;
    }
    
    canRedo() {
      return this.currentIndex < this.history.length - 1;
    }
    
    updateUndoRedoButtons() {
      const undoBtn = $('#ei-undo-btn');
      const redoBtn = $('#ei-redo-btn');
      
      if (undoBtn) {
        undoBtn.disabled = !this.canUndo();
        undoBtn.title = this.canUndo() ? `Undo: ${this.history[this.currentIndex - 1]?.description}` : 'Nothing to undo';
      }
      
      if (redoBtn) {
        redoBtn.disabled = !this.canRedo();
        redoBtn.title = this.canRedo() ? `Redo: ${this.history[this.currentIndex + 1]?.description}` : 'Nothing to redo';
      }
    }
  }

  /* -------------------------------------------------- *
   *  AUTO-SAVE SYSTEM
   * -------------------------------------------------- */
  class AutoSaveManager {
    constructor(dataModel, interval = 30000) {
      this.dataModel = dataModel;
      this.interval = interval;
      this.saveKey = 'ei-autosave-' + this.generateSessionId();
      this.saveInterval = null;
      this.lastSaveTime = null;
      
      this.startAutoSave();
      //this.checkForRecovery(); //disabling for now.  CX is a little buggy there have been complaints.  AND no one is using this feature.
    }
    
    generateSessionId() {
      return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    startAutoSave() {
      this.saveInterval = setInterval(() => {
        this.autoSave();
      }, this.interval);
    }
    
    autoSave() {
      try {
        const saveData = {
          data: this.dataModel.getData(),
          timestamp: Date.now(),
          sessionId: this.saveKey
        };
        
        localStorage.setItem(this.saveKey, JSON.stringify(saveData));
        this.lastSaveTime = Date.now();
        
        // Update auto-save indicator
        this.updateAutoSaveIndicator('saved');
        
        // Clean up old auto-saves (keep only last 5)
        this.cleanupOldSaves();
        
      } catch (e) {
        console.warn('Auto-save failed:', e);
        this.updateAutoSaveIndicator('error');
      }
    }
    
    updateAutoSaveIndicator(status) {
      const indicator = $('#ei-autosave-indicator');
      if (indicator) {
        const now = new Date().toLocaleTimeString();
        switch (status) {
          case 'saved':
            indicator.textContent = `✓ Auto-saved at ${now}`;
            indicator.style.color = '#2ecc71';
            break;
          case 'error':
            indicator.textContent = `⚠ Auto-save failed at ${now}`;
            indicator.style.color = '#e74c3c';
            break;
          case 'saving':
            indicator.textContent = '💾 Saving...';
            indicator.style.color = '#3498db';
            break;
        }
      }
    }
    
    checkForRecovery() {
      const allSaves = this.getAllAutoSaves();
      if (allSaves.length > 0) {
        const latest = allSaves[0];
        const age = Date.now() - latest.timestamp;
        
        if (age < 3600000) { // Less than 1 hour old
          const timeStr = new Date(latest.timestamp).toLocaleString();
          if (confirm(`Found auto-saved data from ${timeStr}. Restore it?`)) {
            this.dataModel.setData(latest.data);
            return true;
          }
        }
      }
      return false;
    }
    
    getAllAutoSaves() {
      const saves = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ei-autosave-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            saves.push({ key, ...data });
          } catch (e) {
            // Invalid save, ignore
          }
        }
      }
      return saves.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    clearAutoSave() {
      if (this.saveInterval) {
        clearInterval(this.saveInterval);
      }
      localStorage.removeItem(this.saveKey);
      this.updateAutoSaveIndicator('cleared');
    }
    
    clearAllAutoSaves() {
      const saves = this.getAllAutoSaves();
      saves.forEach(save => localStorage.removeItem(save.key));
      this.updateAutoSaveIndicator('cleared');
    }
    
    cleanupOldSaves() {
      const saves = this.getAllAutoSaves();
      if (saves.length > 5) {
        saves.slice(5).forEach(save => localStorage.removeItem(save.key));
      }
    }
    
    manualSave() {
      this.updateAutoSaveIndicator('saving');
      this.autoSave();
    }
    
    destroy() {
      if (this.saveInterval) {
        clearInterval(this.saveInterval);
      }
    }
  }

  /* -------------------------------------------------- *
   *  ENHANCED VALIDATION
   * -------------------------------------------------- */
  class ValidationManager {
    constructor() {
      this.rules = {
        store: {
          required: true,
          pattern: /^[A-Z]{3}$/,
          message: 'Store code must be 3 uppercase letters'
        },
        plu: {
          required: true,
          pattern: /^[0-9A-Za-z\-]{3,}$/,
          message: 'PLU must be at least 3 characters (alphanumeric and hyphens)'
        },
        inventory: {
          min: 0,
          max: 10000,
          message: 'Inventory must be between 0 and 10000'
        }
      };
    }
    
    validateCell(row, col, value, dataModel) {
      const errors = [];
      const columnMap = { 0: 'store', 2: 'plu', 4: 'inventory' };
      const rule = this.rules[columnMap[col]];
      
      if (rule) {
        if (rule.required && !value.trim()) {
          errors.push(`${columnMap[col]} is required`);
        }
        if (rule.pattern && value.trim() && !rule.pattern.test(value)) {
          errors.push(rule.message);
        }
        if (rule.min !== undefined && parseInt(value) < rule.min) {
          errors.push(rule.message);
        }
        if (rule.max !== undefined && parseInt(value) > rule.max) {
          errors.push(rule.message);
        }
      }
      
      return errors;
    }
    
    validateData(dataModel) {
      const errors = [];
      const data = dataModel.getData();
      const seenPairs = new Set();
      
      for (let r = 1; r < data.length; r++) {
        const store = dataModel.getCell(r, 0);
        const plu = dataModel.getCell(r, 2);
        const availability = dataModel.getCell(r, 3);
        const inventory = dataModel.getCell(r, 4);
        const andon = dataModel.getCell(r, 6);
        
        if (!store && !plu) continue; // Skip completely empty rows
        
        // Check for duplicate store/PLU pairs
        if (store && plu) {
          const pairKey = `${store.toUpperCase()}::${plu.toUpperCase()}`;
          if (seenPairs.has(pairKey)) {
            errors.push({ row: r, col: 0, msg: `Duplicate Store/PLU: ${store}/${plu}` });
          } else {
            seenPairs.add(pairKey);
          }
        }
        
        // Individual field validation
        const storeErrors = this.validateCell(r, 0, store, dataModel);
        const pluErrors = this.validateCell(r, 2, plu, dataModel);
        const invErrors = this.validateCell(r, 4, inventory, dataModel);
        
        storeErrors.forEach(msg => errors.push({ row: r, col: 0, msg }));
        pluErrors.forEach(msg => errors.push({ row: r, col: 2, msg }));
        invErrors.forEach(msg => errors.push({ row: r, col: 4, msg }));
        
        // Business logic validation
        if (availability !== 'Limited' && availability !== 'Unlimited') {
          errors.push({ row: r, col: 3, msg: 'Availability must be Limited or Unlimited' });
        }
        
        if (andon !== 'Enabled' && andon !== 'Disabled') {
          errors.push({ row: r, col: 6, msg: 'Andon must be Enabled or Disabled' });
        }
        
        if (availability === 'Unlimited' && inventory !== '0') {
          errors.push({ row: r, col: 4, msg: 'Unlimited items must have 0 inventory' });
        }
      }
      
      return errors;
    }
  }

  /* -------------------------------------------------- *
   *  STYLES
   * -------------------------------------------------- */
  const injectStyles = () => {
    if (!$('#' + STYLE_ID)) {
      const style = createEl('style', { id: STYLE_ID });
      style.textContent = `
        /* MAIN CONTAINER PADDING */
        #ei-interface {
          padding: 0 25px;
          max-width: calc(100vw - 50px);
          box-sizing: border-box;
          margin: 0 auto;
          position: relative;
          width: 100%;
        }
        
        .tm-ei-btn{
          position:fixed;bottom:calc(50px + env(safe-area-inset-bottom));
          left:25px;z-index:1000;min-width:180px;
          padding:9px 14px;border:1px solid #303030;border-radius:4px;
          font:600 14px/1 'Roboto','Segoe UI',sans-serif;color:#f1f1f1;
          background:#1a1a1a;cursor:pointer;
          display:flex;align-items:center;gap:6px;
          transition:background 150ms ease;
        }
        .tm-ei-btn:hover{background:#242424;}
        
        .tm-ei-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.6);
          display:flex;justify-content:center;align-items:center;z-index:9995;
          padding: 25px;
          box-sizing: border-box;
        }
        
        .tm-ei-card{
          background:#1a1a1a;border:1px solid #303030;border-radius:12px;
          width:min(calc(96vw - 50px),1350px);max-height:calc(90vh - 50px);
          display:flex;flex-direction:column;color:#f1f1f1;
          box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;
          margin: 0 auto;
        }
        
        .tm-ei-header{
          background:#242424;color:#f1f1f1;padding:12px 24px;
          font:600 16px/1 'Roboto','Segoe UI',sans-serif;
          border-bottom:1px solid #303030;
          display:flex;justify-content:space-between;align-items:center;
          flex-shrink: 0;
        }
        .tm-ei-header button{all:unset;cursor:pointer;font-size:26px;}
        
        .tm-ei-body{
          padding:20px 24px;overflow:auto;
          flex: 1;
          min-width: 0; /* Prevent flex overflow */
        }
        
        label{font-weight:500;margin-top:6px;display:block;}
        input,select{
          width:100%;padding:7px 9px;margin-top:2px;
          font-size:14px;border:1px solid #3f3f3f;border-radius:4px;
          background:#0f0f0f;color:#f1f1f1;
          box-sizing: border-box;
        }
        textarea {
          width:100%;padding:7px 9px;margin-top:2px;
          font-size:14px;border:1px solid #3f3f3f;border-radius:4px;
          background:#0f0f0f;color:#f1f1f1;
          box-sizing: border-box;
          resize: vertical;
        }
        
        .tm-ei-action{
          margin-top:12px;padding:10px 0;width:100%;
          border:none;border-radius:5px;font-size:16px;cursor:pointer;
          box-sizing: border-box;
        }
        .green{background:var(--tm-accent-primary, #3ea6ff);color:#0f0f0f;}
        .red{background:#d32f2f;color:#fff;}
        .blue{background:#3ea6ff;color:#0f0f0f;}
        .orange{background:#f9a825;color:#0f0f0f;}
        
        /* ENHANCED TABLE STYLES */
        .tm-ei-table-container{
          width:100%;margin-top:16px;border:1px solid #303030;border-radius:8px;
          overflow:auto;max-height:600px;background:#0f0f0f;position:relative;
          box-sizing: border-box;
        }
        .tm-ei-table{
          width:100%;border-collapse:collapse;font-size:14px;min-width:1300px;
        }
        
        /* COSMETIC COLUMN STYLES */
        .tm-ei-cosmetic-column{
          background:#242424 !important;
          color:#717171;
          font-style:italic;
          text-align:center;
          pointer-events:none;
          user-select:none;
        }
        .tm-ei-table th.tm-ei-cosmetic-column{
          color:#f1f1f1 !important;
        }
        .tm-ei-cosmetic-column input{
          background:#242424 !important;
          border:none !important;
          text-align:center;
          cursor:default;
          color:#717171;
          font-style:italic;
        }
        .tm-ei-table th{
          background:#242424;color:#f1f1f1;padding:12px 8px;text-align:left;
          position:sticky;top:0;z-index:10;border-right:1px solid #303030;
          font-weight:600;font-size:13px;white-space:nowrap;
        }
        .tm-ei-table td{
          padding:4px;border-right:1px solid #303030;border-bottom:1px solid #303030;
          min-width:120px;position:relative;
        }
        .tm-ei-table tr:hover{background:#242424;}
        .tm-ei-table tr.tm-ei-error{background:rgba(211,47,47,0.1);}
        .tm-ei-table td.tm-ei-error{background:rgba(211,47,47,0.1);border:2px solid #d32f2f;}
        .tm-ei-table tr.tm-ei-selected{background:rgba(62,166,255,0.1);}
        
        /* SELECTION COLUMN */
        .tm-ei-table th:first-child, .tm-ei-table td:first-child{
          width:40px;min-width:40px;text-align:center;
          background:#1a1a1a;position:sticky;left:0;z-index:5;
        }
        .tm-ei-table th:first-child{z-index:15;background:#2d2d2d;}
        
        /* EDITABLE CELL STYLES */
        .tm-ei-cell-input, .tm-ei-cell-select{
          width:100%;border:none;background:transparent;padding:6px 4px;
          font-family:inherit;font-size:inherit;outline:none;
          transition:all 0.2s;
          box-sizing: border-box;
        }
        .tm-ei-cell-input:focus, .tm-ei-cell-select:focus{
          background:#0f0f0f;border:2px solid var(--tm-accent-primary, #3ea6ff);border-radius:3px;
          box-shadow:0 0 0 2px rgba(62,166,255,0.15);
        }
        .tm-ei-cell-input:invalid{
          border-color:#e74c3c;background:#fee;
        }
        
        /* TOOLBAR STYLES */
        .tm-ei-toolbar{
          display:flex;align-items:center;gap:8px;margin-bottom:16px;
          padding:12px;background:#242424;border:1px solid #303030;border-radius:4px;flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .tm-ei-toolbar-group{
          display:flex;align-items:center;gap:6px;
          border-right:1px solid #ddd;padding-right:12px;margin-right:4px;
          flex-shrink: 0;
        }
        .tm-ei-toolbar-group:last-child{border-right:none;margin-right:0;}
        .tm-ei-toolbar button{
          padding:6px 12px;border:1px solid #3f3f3f;background:#1a1a1a;color:#f1f1f1;
          border-radius:4px;cursor:pointer;font-size:13px;
          transition:all 0.2s;
          white-space: nowrap;
        }
        .tm-ei-toolbar button:hover:not(:disabled){background:#f0f0f0;}
        .tm-ei-toolbar button:disabled{opacity:0.5;cursor:not-allowed;}
        .tm-ei-toolbar input, .tm-ei-toolbar select{
          padding:6px 8px;border:1px solid #ddd;border-radius:4px;
          font-size:13px;min-width:120px;
          box-sizing: border-box;
        }
        
        /* FILTER BAR */
        .tm-ei-filter-bar{
          display:flex;align-items:center;gap:8px;margin-bottom:12px;
          padding:10px;background:#1a1a1a;border:1px solid #303030;border-radius:4px;
          flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .tm-ei-filter-bar input, .tm-ei-filter-bar select{
          padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px;
          box-sizing: border-box;
        }
        .tm-ei-filter-bar button{
          padding:6px 12px;border:1px solid #3f3f3f;background:#242424;color:#f1f1f1;
          border-radius:4px;cursor:pointer;font-size:13px;
          white-space: nowrap;
        }
        
        /* BULK OPERATIONS */
        .tm-ei-bulk-ops{
          display:flex;align-items:center;gap:8px;margin-top:12px;
          padding:10px;background:#e8f5e8;border:1px solid #c8e6c9;
          border-radius:6px;flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .tm-ei-bulk-ops button{
          padding:6px 12px;border:none;border-radius:4px;
          cursor:pointer;font-size:13px;color:#fff;
          white-space: nowrap;
        }
        .tm-ei-bulk-ops .bulk-limited{background:#2ecc71;}
        .tm-ei-bulk-ops .bulk-unlimited{background:#95a5a6;}
        .tm-ei-bulk-ops .bulk-delete{background:#e74c3c;}
        .tm-ei-bulk-ops .bulk-andon-enabled{background:#27ae60;}
        .tm-ei-bulk-ops .bulk-andon-disabled{background:#e67e22;}
        .tm-ei-bulk-ops .bulk-inventory{background:#3498db;}
        .tm-ei-bulk-ops .bulk-capacity{background:#9b59b6;}
        .tm-ei-bulk-ops .bulk-tracking-start{background:#16a085;}
        .tm-ei-bulk-ops .bulk-tracking-end{background:#c0392b;}
        .tm-ei-bulk-ops input{
          box-sizing: border-box;
        }
        
        /* AUTO-SAVE INDICATOR */
        .tm-ei-autosave-indicator{
          font-size:12px;color:#666;font-style:italic;
          display:flex;align-items:center;gap:4px;
        }
        
        /* MULTI-INPUT STYLES */
        .tm-ei-multi-input{
          display:flex;flex-direction:column;gap:4px;
        }
        .tm-ei-input-tag{
          display:inline-block;background:#e3f2fd;color:#1976d2;
          padding:2px 6px;border-radius:3px;font-size:12px;margin:2px;
        }
        .tm-ei-input-tag .remove{
          margin-left:4px;cursor:pointer;color:#d32f2f;font-weight:bold;
        }
        
        #ei-increment-wrap, #ei-error-message{
          margin-top:12px;
        }
        #ei-error-message{
          padding:10px;background:#fee;border:1px solid #fcc;
          border-radius:5px;color:#c33;font-size:14px;
          box-sizing: border-box;
          word-wrap: break-word;
        }
        
        /* PROGRESS BAR STYLES */
        #ei-progress {
          box-sizing: border-box;
        }
        .progress-bar {
          box-sizing: border-box;
        }
        .progress-fill {
          box-sizing: border-box;
        }
        
        /* INCREMENT TYPE SELECTOR STYLES */
        #ei-increment-type {
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        #ei-increment-type:focus {
          border-color: #004E36;
          box-shadow: 0 0 0 2px rgba(0,78,54,0.1);
          outline: none;
        }
        #ei-increment-type:hover {
          border-color: #056a48;
        }
        
        /* CLOSE BUTTON */
        .tm-ei-close-btn {
          position: fixed;
          top: 25px;
          right: 25px;
          z-index: 1002;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: background 0.2s;
        }
        .tm-ei-close-btn:hover {
          background: #c0392b;
        }
        
        @media(max-width:768px){
          #ei-interface {
            padding: 0 10px;
            max-width: calc(100vw - 20px);
          }
          
          .tm-ei-btn{
            left:10px;right:10px;width:calc(100% - 20px);
            min-width: auto;
          }
          
          .tm-ei-overlay {
            padding: 10px;
          }
          
          .tm-ei-card {
            width: calc(100vw - 20px);
            max-height: calc(90vh - 20px);
          }
          
          .tm-ei-close-btn {
            top: 10px;
            right: 10px;
          }
          
          .tm-ei-toolbar, .tm-ei-filter-bar, .tm-ei-bulk-ops{
            flex-direction:column;align-items:stretch;
          }
          .tm-ei-toolbar-group{
            border-right:none;border-bottom:1px solid #ddd;
            padding-bottom:8px;margin-bottom:8px;
            justify-content: center;
          }
          .tm-ei-table{font-size:12px;min-width:800px;}
          .tm-ei-table th, .tm-ei-table td{padding:4px 2px;min-width:80px;}

          .tm-ei-toolbar button, .tm-ei-filter-bar button, .tm-ei-bulk-ops button {
            flex: 1;
            min-width: 0;
          }
        }`;
      document.head.appendChild(style);
    }
  };

  /* -------------------------------------------------- *
   *  EDIT BUTTON
   * -------------------------------------------------- */
  const addEditBtn = () => {
    if ($('#' + EDIT_BTN_ID)) return;
    injectStyles();

    const btn = createEl('button', {
      id: EDIT_BTN_ID,
      className: 'tm-ei-btn',
      innerHTML: OPEN_ICON_SVG
    });
    // Hidden from view -- the iconbar button in Settings.js triggers this via .click()
    btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.onclick = openOverlay;
  };

  /* -------------------------------------------------- *
   *  ENHANCED OVERLAY WITH MULTI-INPUT
   * -------------------------------------------------- */
  const openOverlay = () => {
    //var pw = prompt('Enter password to access Existing Item Editor:');
    //if (pw !== 'Baker') {
    //  alert('Incorrect password. Access denied.');
    //  return;
    //}  //Removed password prompt, it is no longer needed
    if ($('#' + OVERLAY_ID)) return;

    const overlay = createEl('div', { id: OVERLAY_ID, className: 'tm-ei-overlay' });
    const card = createEl('div', { className: 'tm-ei-card' });
    overlay.appendChild(card);

    const header = createEl('div', { className: 'tm-ei-header' }, 'Edit Existing Item');
    const closeX = createEl('button', {}, '&times;');
    closeX.onclick = () => overlay.remove();
    header.appendChild(closeX);
    card.appendChild(header);

    const body = createEl('div', { className: 'tm-ei-body' });
    card.appendChild(body);

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <label>PLU Code(s)</label>
          <textarea id="ei-plu" placeholder="Enter PLU codes (one per line or comma-separated)"
                   style="height:80px;resize:vertical;"></textarea>
          <small style="color:#666;">Supports multiple PLUs: separate by comma or new line</small>
          <label style="font-weight:500;display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px;background:#e8f5e8;border:1px solid #c8e6c9;border-radius:6px;cursor:pointer;transition:background 0.2s;">
            <input type="checkbox" id="ei-all-plus" style="margin:0;transform:scale(1.2);">
            <span style="color:#2e7d32;">✓ All PLUs</span>
          </label>
        </div>
        <div>
          <label>Store / Region Code(s)</label>
          <textarea id="ei-store" placeholder="Enter Store or Region codes (one per line or comma-separated)"
                   style="height:80px;resize:vertical;"></textarea>
          <small style="color:#666;">Supports multiple stores/regions</small>
          <label style="font-weight:500;display:flex;align-items:center;gap:8px;margin-top:8px;">
            <input type="checkbox" id="ei-all-stores" style="margin-right:8px;"> All Stores/Regions
          </label>
        </div>
      </div>
      
      <label style="margin-top:12px;">Search By:</label>
      <select id="ei-by" style="margin-bottom:8px;">
        <option value="Store">Store</option>
        <option value="Region">Region</option>
      </select>

      <label style="margin-top:8px;">Team Filter (optional):</label>
      <select id="ei-team-filter" style="margin-bottom:8px;">
        <option value="">All Teams</option>
        <option value="Coffee">Coffee</option>
        <option value="Prepared Foods">Prepared Foods</option>
        <option value="Bakery">Bakery</option>
        <option value="Seafood">Seafood</option>
        <option value="Specialty">Specialty</option>
        <option value="Grocery">Grocery</option>
        <option value="Sushi">Sushi</option>
      </select>

      <button id="ei-fetch" class="tm-ei-action green">Edit Items</button>
      <div id="ei-progress" style="display:none;margin-top:8px;text-align:center;font-size:15px;color:#004E36;">
        <div class="progress-text">Waiting…</div>
        <div class="progress-bar" style="width:100%;height:4px;background:#303030;border-radius:2px;margin-top:4px;">
          <div class="progress-fill" style="width:0%;height:100%;background:var(--tm-accent-primary, #3ea6ff);border-radius:2px;transition:width 0.3s;"></div>
        </div>
      </div>`;
    
    $('#ei-fetch', body).onclick = () => fetchItems(body);

    // Handle checkbox interactions with enhanced styling
    $('#ei-all-plus', body).onchange = function() {
      const pluTextarea = $('#ei-plu', body);
      const label = this.closest('label');
      pluTextarea.disabled = this.checked;
      if (this.checked) {
        pluTextarea.style.opacity = '0.5';
        pluTextarea.style.background = '#f5f5f5';
        pluTextarea.placeholder = '✓ All PLUs selected - input disabled';
        pluTextarea.value = '';
        label.style.background = '#c8e6c9';
        label.style.borderColor = '#4caf50';
      } else {
        pluTextarea.style.opacity = '1';
        pluTextarea.style.background = '#0f0f0f';
        pluTextarea.style.color = '#f1f1f1';
        pluTextarea.placeholder = 'Enter PLU codes (one per line or comma-separated)';
        label.style.background = '#e8f5e8';
        label.style.borderColor = '#c8e6c9';
      }
    };

    $('#ei-all-stores', body).onchange = function() {
      const storeTextarea = $('#ei-store', body);
      const bySelect = $('#ei-by', body);
      const label = this.closest('label');
      storeTextarea.disabled = this.checked;
      bySelect.disabled = this.checked;
      if (this.checked) {
        storeTextarea.style.opacity = '0.5';
        storeTextarea.style.background = '#f5f5f5';
        bySelect.style.opacity = '0.5';
        bySelect.style.background = '#f5f5f5';
        storeTextarea.placeholder = '🌐 All stores/regions selected - input disabled';
        storeTextarea.value = '';
        label.style.background = '#bbdefb';
        label.style.borderColor = '#2196f3';
      } else {
        storeTextarea.style.opacity = '1';
        storeTextarea.style.background = '#0f0f0f';
        storeTextarea.style.color = '#f1f1f1';
        bySelect.style.opacity = '1';
        bySelect.style.background = '#0f0f0f';
        bySelect.style.color = '#f1f1f1';
        storeTextarea.placeholder = 'Enter Store or Region codes (one per line or comma-separated)';
        label.style.background = '#e3f2fd';
        label.style.borderColor = '#bbdefb';
      }
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
    $('#ei-plu').focus();
  };

  /* -------------------------------------------------- *
   *  ENHANCED DATA FETCHING WITH MULTI-SUPPORT
   * -------------------------------------------------- */
  const fetchItems = async (context) => {
    const progress = $('#ei-progress', context);
    const progressText = progress.querySelector('.progress-text');
    const progressFill = progress.querySelector('.progress-fill');
    
    progress.style.display = 'block';
    progressText.textContent = 'Processing…';
    progressFill.style.width = '0%';

    // Parse multiple inputs
    const pluInput = $('#ei-plu').value.trim();
    const storeInput = $('#ei-store').value.trim();
    const by = $('#ei-by').value;
    const allPlusChecked = $('#ei-all-plus').checked;
    const allStoresChecked = $('#ei-all-stores').checked;
    const teamFilter = $('#ei-team-filter').value;
    
    // Validate inputs based on checkbox states
    if (!allPlusChecked && !pluInput.trim()) {
      progressText.textContent = 'PLU field is required unless "All PLUs" is selected.';
      return;
    }
    
    if (!allStoresChecked && !storeInput.trim()) {
      progressText.textContent = 'Store/Region field is required unless "All Stores/Regions" is selected.';
      return;
    }
    
    // Parse PLUs (support both comma and newline separation)
    let pluList = [];
    if (!allPlusChecked) {
      pluList = [...new Set(
        pluInput.split(/[,\n]/)
          .map(p => p.trim())
          .filter(p => p && /^[0-9A-Za-z\-]+$/.test(p))
      )];
      
      if (!pluList.length) {
        progressText.textContent = 'No valid PLU codes found.';
        return;
      }
    }
    
    // Parse Stores/Regions
    let inputList = [];
    if (!allStoresChecked) {
      inputList = [...new Set(
        storeInput.split(/[,\n]/)
          .map(s => s.trim().toUpperCase())
          .filter(Boolean)
      )];
      
      if (!inputList.length) {
        progressText.textContent = 'No valid store/region codes found.';
        return;
      }
    }
    
    if (allPlusChecked && allStoresChecked) {
      progressText.textContent = 'Loading all PLUs from all stores...';
    } else if (allPlusChecked) {
      progressText.textContent = `Loading all PLUs from ${inputList.length} ${by.toLowerCase()}(s)`;
    } else if (allStoresChecked) {
      progressText.textContent = `Loading ${pluList.length} PLUs from all stores`;
    } else {
      progressText.textContent = `Found ${pluList.length} PLUs and ${inputList.length} ${by.toLowerCase()}(s)`;
    }
    progressFill.style.width = '10%';

    const env = location.hostname.includes('gamma') ? 'gamma' : 'prod';
    const url = `https://${env}.cam.wfm.amazon.dev/api/`;

    try {
      let allStoreIds = [];
      
      if (allStoresChecked) {
        // Get all stores from all regions (same logic as DownloadButton.js)
        progressText.textContent = 'Loading all stores...';
        progressFill.style.width = '20%';
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-amz-json-1.0',
            'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
          },
          body: JSON.stringify({}),
          credentials: 'include'
        });
        
        const storeData = await response.json();
        if (!storeData || !storeData.storesInformation) {
          throw new Error('Invalid store data received');
        }
        
        // Build storeIds array from all regions (matching DownloadButton.js logic)
        for (const region in storeData.storesInformation) {
          const states = storeData.storesInformation[region];
          for (const state in states) {
            const stores = states[state];
            stores.forEach(store => {
              allStoreIds.push(store.storeTLC);
            });
          }
        }
      } else if (by === 'Store') {
        allStoreIds = inputList;
        progressFill.style.width = '20%';
      } else {
        // Handle multiple regions
        progressText.textContent = 'Loading stores for regions…';
        for (let i = 0; i < inputList.length; i++) {
          const regionCode = inputList[i];
          progressText.textContent = `Loading stores for region ${regionCode} (${i + 1}/${inputList.length})`;
          progressFill.style.width = `${20 + (i / inputList.length) * 30}%`;
          
          const regionStores = await getRegionStores(url, regionCode);
          allStoreIds.push(...regionStores);
        }
        allStoreIds = [...new Set(allStoreIds)]; // Remove duplicates
      }
      
      if (!allStoreIds.length) {
        progressText.textContent = 'No stores found for the specified regions.';
        return;
      }
      
      progressText.textContent = `Fetching items from ${allStoreIds.length} stores…`;
      progressFill.style.width = '50%';
      
      // Fetch items from all stores
      const allItems = [];
      const batchSize = 5; // Process stores in batches to avoid overwhelming the API
      
      for (let i = 0; i < allStoreIds.length; i += batchSize) {
        const batch = allStoreIds.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(allStoreIds.length / batchSize);
        
        progressText.textContent = `Fetching batch ${batchNum}/${totalBatches} (stores ${i + 1}-${Math.min(i + batchSize, allStoreIds.length)})`;
        progressFill.style.width = `${50 + (i / allStoreIds.length) * 40}%`;
        
        // Process batch concurrently
        const batchPromises = batch.map(storeId => fetchStoreItems(url, storeId, pluList));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allItems.push(...result.value);
          } else {
            console.error(`Failed to fetch items for store ${batch[idx]}:`, result.reason);
          }
        });
      }
      
      progressFill.style.width = '90%';
      
      // Remove duplicates and filter
      const uniqueItems = removeDuplicateItems(allItems);
      let filteredItems = uniqueItems;
      
      // Filter by PLU if specific PLUs were provided (not "All PLUs")
      if (!allPlusChecked && pluList.length > 0) {
        filteredItems = filteredItems.filter(item =>
          pluList.some(plu => item.wfmScanCode === plu)
        );
      }
      
      // Filter by team if team filter is selected
      if (teamFilter) {
        filteredItems = filteredItems.filter(item =>
          item.team && item.team.toLowerCase() === teamFilter.toLowerCase()
        );
      }
      
      progressFill.style.width = '100%';
      
      if (!filteredItems.length) {
        progressText.textContent = 'No matching items found.';
        return;
      }
      
      progressText.textContent = `Found ${filteredItems.length} items. Loading editor…`;
      
      // Close overlay and render table
      setTimeout(() => {
        $('#' + OVERLAY_ID).remove();
        renderTable(document.body, filteredItems);
      }, 500);
      
    } catch (error) {
      progressText.textContent = 'Error loading data. Check console for details.';
      console.error('Fetch error:', error);
    }
  };

  // Helper function to fetch items from a single store
  const fetchStoreItems = async (url, storeId, pluList) => {
    const payload = {
      filterContext: { storeIds: [storeId] },
      paginationContext: { pageNumber: 0, pageSize: 10000 }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.0',
        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const items = data.itemsAvailability || [];
    
    // Tag items with store info
    return items.map(item => ({
      ...item,
      _eiStoreKey: item.storeTLC || storeId
    }));
  };

  // Helper function to remove duplicate items
  const removeDuplicateItems = (items) => {
    const seen = new Map();
    const result = [];
    
    items.forEach(item => {
      const key = `${item._eiStoreKey}::${item.wfmScanCode}`;
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, item);
        result.push(item);
      } else {
        // Keep the one with higher inventory
        const currentInv = parseInt(item.currentInventoryQuantity) || 0;
        const existingInv = parseInt(existing.currentInventoryQuantity) || 0;
        
        if (currentInv > existingInv) {
          const index = result.indexOf(existing);
          result[index] = item;
          seen.set(key, item);
        }
      }
    });
    
    return result;
  };

  // Helper function to get stores for a region
  const getRegionStores = async (url, regionCode) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.0',
        'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
      },
      body: JSON.stringify({}),
      credentials: 'include'
    });
    
    const data = await response.json();
    const stores = [];
    
    for (const region in data.storesInformation) {
      if (region.split('-').pop() === regionCode) {
        for (const state in data.storesInformation[region]) {
          data.storesInformation[region][state].forEach(s => stores.push(s.storeTLC));
        }
      }
    }
    
    return stores;
  };

  /* -------------------------------------------------- *
   *  CLOSE BUTTON FUNCTION
   * -------------------------------------------------- */
  const addCloseButton = (container) => {
    const closeButton = createEl('button', {
      className: 'tm-ei-close-btn',
      innerHTML: '&times;',
      title: 'Close Editor'
    });
    
    closeButton.onclick = () => {
      if (confirm('Close the editor? Any unsaved changes will be lost.')) {
        container.remove();
        closeButton.remove();
        // Clean up managers
        if (container._eiAutoSaveManager) {
          container._eiAutoSaveManager.destroy();
        }
      }
    };
    
    document.body.appendChild(closeButton);
    
    // Remove close button when container is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === container) {
            closeButton.remove();
            observer.disconnect();
          }
        });
      });
    });
    observer.observe(document.body, { childList: true });
  };

  /* -------------------------------------------------- *
   *  ENHANCED TABLE RENDERING WITH ALL FEATURES
   * -------------------------------------------------- */
  const renderTable = (ctx, items) => {
    // Clear existing elements more thoroughly
    removeEl(TABLE_CONTAINER);
    removeEl(DOWNLOAD_BTN_ID);
    removeEl('ei-interface'); // Clear any existing interface
    
    // Remove any stray elements that might have escaped
    const strayElements = document.querySelectorAll('[id^="ei-"]:not(#ei-openEditor):not(#ei-style)');
    strayElements.forEach(el => el.remove());
    
    // Convert items to rows and store reserved quantity for cosmetic column calculation
    const dataRows = items.map(item => [
      item._eiStoreKey || item.storeTLC || '',
      item.itemName || '',
      item.wfmScanCode || '',
      item.inventoryStatus || '',
      (item.inventoryStatus === 'Unlimited' ? '0' : String(Math.max(0, Math.min(10000, +item.currentInventoryQuantity || 0)))),
      '',
      item.andon ? 'Enabled' : 'Disabled',
      '',
      ''
    ]);
    
    // Store reserved quantities for cosmetic column calculation
    const reservedQuantities = items.map(item => item.reservedQuantity || 0);

    const dataModel = new TableDataModel(dataRows);
    // Store reserved quantities in the data model for cosmetic column calculation
    dataModel.reservedQuantities = reservedQuantities;
    
    const undoManager = new UndoRedoManager(dataModel);
    const autoSaveManager = new AutoSaveManager(dataModel);
    const validationManager = new ValidationManager();
    
    // Create a container for the entire interface with proper containment
    const interfaceContainer = createEl('div', {
      id: 'ei-interface'
    });
    document.body.appendChild(interfaceContainer); // Append to body instead of ctx
    
    // Store references
    interfaceContainer._eiDataModel = dataModel;
    interfaceContainer._eiUndoManager = undoManager;
    interfaceContainer._eiAutoSaveManager = autoSaveManager;
    interfaceContainer._eiValidationManager = validationManager;

    // Add toolbar
    addToolbar(interfaceContainer, dataModel, undoManager, autoSaveManager);
    
    // Add filter bar
    addFilterBar(interfaceContainer);
    
    // Add table
    addTable(interfaceContainer, dataModel, undoManager, autoSaveManager, validationManager);
    
    // Add bulk operations
    addBulkOperations(interfaceContainer, dataModel, undoManager, autoSaveManager);
    
    // Add controls and download
    addControls(interfaceContainer, dataModel, undoManager, autoSaveManager, validationManager);
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts(dataModel, undoManager, autoSaveManager);
    
    // Add close button to interface
    addCloseButton(interfaceContainer);
  };

  const addToolbar = (container, dataModel, undoManager, autoSaveManager) => {
    const toolbar = createEl('div', { className: 'tm-ei-toolbar' });

    toolbar.innerHTML = `
      <div class="tm-ei-toolbar-group">
        <button id="ei-undo-btn" title="Undo">↶ Undo</button>
        <button id="ei-redo-btn" title="Redo">↷ Redo</button>
      </div>
      <div class="tm-ei-toolbar-group">
        <button id="ei-save-btn" title="Manual Save">💾 Save</button>
        <button id="ei-clear-autosave-btn" title="Clear Auto-save">🗑 Clear Auto-save</button>
        <span class="tm-ei-autosave-indicator" id="ei-autosave-indicator">Auto-save active</span>
      </div>
      <div class="tm-ei-toolbar-group">
        <button id="ei-validate-btn" title="Validate Data">✓ Validate</button>
        <button id="ei-clear-errors-btn" title="Clear Error Highlighting">Clear Errors</button>
      </div>
      <div class="tm-ei-toolbar-group">
        <span style="font-size:12px;color:#666;">Total Rows: <span id="ei-row-count">0</span></span>
      </div>
    `;
    
    container.appendChild(toolbar);
    
    // Connect toolbar events
    $('#ei-undo-btn').onclick = () => {
      const result = undoManager.undo();
      if (result) {
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:blue;">↶ Undid: ${result}</div>`);
      }
    };
    
    $('#ei-redo-btn').onclick = () => {
      const result = undoManager.redo();
      if (result) {
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:blue;">↷ Redid: ${result}</div>`);
      }
    };
    
    $('#ei-save-btn').onclick = () => {
      autoSaveManager.manualSave();
      showInlineError(container, '<div style="color:green;">💾 Manually saved</div>');
    };
    
    $('#ei-clear-autosave-btn').onclick = () => {
      if (confirm('Clear all auto-saved data? This cannot be undone.')) {
        autoSaveManager.clearAllAutoSaves();
        showInlineError(container, '<div style="color:orange;">🗑 Auto-save data cleared</div>');
      }
    };
    
    $('#ei-clear-errors-btn').onclick = () => {
      clearValidationErrors();
      clearInlineError(container);
    };
    
    // Update row count
    const updateRowCount = () => {
      $('#ei-row-count').textContent = dataModel.getData().length - 1; // Exclude header
    };
    updateRowCount();
    
    // Update toolbar periodically
    setInterval(() => {
      undoManager.updateUndoRedoButtons();
      updateRowCount();
    }, 1000);
  };

  const addFilterBar = (container) => {
    const filterBar = createEl('div', { className: 'tm-ei-filter-bar' });
    
    filterBar.innerHTML = `
      <input type="text" id="ei-search" placeholder="Search store, item name, PLU..." style="flex:1;min-width:200px;">
      <select id="ei-filter-availability">
        <option value="">All Availability</option>
        <option value="Limited">Limited Only</option>
        <option value="Unlimited">Unlimited Only</option>
      </select>
      <select id="ei-filter-andon">
        <option value="">All Andon</option>
        <option value="Enabled">Enabled Only</option>
        <option value="Disabled">Disabled Only</option>
      </select>
      <input type="number" id="ei-filter-inventory-min" placeholder="Min Inv" style="width:80px;">
      <input type="number" id="ei-filter-inventory-max" placeholder="Max Inv" style="width:80px;">
      <select id="ei-filter-online-availability">
        <option value="">All Online Availability</option>
        <option value="Unlimited">Unlimited Only</option>
        <option value="Limited">Limited (with inventory)</option>
        <option value="Range">Range (Limited items)</option>
      </select>
      <input type="number" id="ei-filter-online-min" placeholder="Min" style="width:70px;display:none;">
      <input type="number" id="ei-filter-online-max" placeholder="Max" style="width:70px;display:none;">
      <button id="ei-clear-filters">Clear Filters</button>
      <span id="ei-filter-results" style="font-size:12px;color:#666;"></span>
    `;
    
    container.appendChild(filterBar);
    
    // Connect filter events
    const applyFilters = debounce(() => {
      const searchTerm = $('#ei-search').value.toLowerCase();
      const availFilter = $('#ei-filter-availability').value;
      const andonFilter = $('#ei-filter-andon').value;
      const minInv = parseInt($('#ei-filter-inventory-min').value) || 0;
      const maxInv = parseInt($('#ei-filter-inventory-max').value) || 10000;
      const onlineAvailFilter = $('#ei-filter-online-availability').value;
      
      const table = $('#ei-data-table');
      const rows = table.querySelectorAll('tbody tr');
      let visibleCount = 0;
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('input, select');
        if (cells.length < 7) return;
        
        const store = cells[1].value.toLowerCase(); // Skip checkbox column
        const item = cells[2].value.toLowerCase();
        const plu = cells[3].value.toLowerCase();
        const availability = cells[4].value;
        const inventory = parseInt(cells[5].value) || 0;
        const andon = cells[7].value;
        
        // Get online availability value from cosmetic column (second cosmetic column)
        const cosmeticCells = row.querySelectorAll('.tm-ei-cosmetic-column input');
        const onlineAvail = cosmeticCells.length >= 2 ? cosmeticCells[1].value : '';
        
        const matchesSearch = !searchTerm ||
          store.includes(searchTerm) ||
          item.includes(searchTerm) ||
          plu.includes(searchTerm);
        
        const matchesAvail = !availFilter || availability === availFilter;
        const matchesAndon = !andonFilter || andon === andonFilter;
        const matchesInventory = inventory >= minInv && inventory <= maxInv;
        
        // Online availability filter logic
        let matchesOnlineAvail = true;
        if (onlineAvailFilter === 'Unlimited') {
          matchesOnlineAvail = onlineAvail === 'Unlimited';
        } else if (onlineAvailFilter === 'Limited') {
          matchesOnlineAvail = onlineAvail !== 'Unlimited' && onlineAvail !== '';
        } else if (onlineAvailFilter === 'Range') {
          // Range filter for Limited items with inventory
          if (onlineAvail === 'Unlimited' || onlineAvail === '') {
            matchesOnlineAvail = false;
          } else {
            const onlineInv = parseInt(onlineAvail, 10);
            const minOnlineInput = $('#ei-filter-online-min').value;
            const maxOnlineInput = $('#ei-filter-online-max').value;
            
            // If no min/max specified, default to showing all
            const minOnline = minOnlineInput !== '' ? parseInt(minOnlineInput, 10) : 0;
            const maxOnline = maxOnlineInput !== '' ? parseInt(maxOnlineInput, 10) : 10000;
            
            // Check if the parsed value is valid
            if (!isNaN(onlineInv)) {
              matchesOnlineAvail = onlineInv >= minOnline && onlineInv <= maxOnline;
            } else {
              matchesOnlineAvail = false;
            }
          }
        }
        
        const isVisible = matchesSearch && matchesAvail && matchesAndon && matchesInventory && matchesOnlineAvail;
        row.style.display = isVisible ? '' : 'none';
        
        if (isVisible) visibleCount++;
      });
      
      $('#ei-filter-results').textContent = `Showing ${visibleCount} of ${rows.length} rows`;
    }, 300);
    
    // Add null checks for event handlers
    const searchEl = $('#ei-search');
    const availEl = $('#ei-filter-availability');
    const andonEl = $('#ei-filter-andon');
    const teamEl = $('#ei-filter-team');
    const minInvEl = $('#ei-filter-inventory-min');
    const maxInvEl = $('#ei-filter-inventory-max');
    const onlineAvailEl = $('#ei-filter-online-availability');
    const clearFiltersEl = $('#ei-clear-filters');
    
    if (searchEl) searchEl.oninput = applyFilters;
    if (availEl) availEl.onchange = applyFilters;
    if (andonEl) andonEl.onchange = applyFilters;
    if (teamEl) teamEl.onchange = applyFilters;
    if (minInvEl) minInvEl.oninput = applyFilters;
    if (maxInvEl) maxInvEl.oninput = applyFilters;
    if (onlineAvailEl) {
      onlineAvailEl.onchange = () => {
        const minInput = $('#ei-filter-online-min');
        const maxInput = $('#ei-filter-online-max');
        
        // Show/hide range inputs based on selection
        if (onlineAvailEl.value === 'Range') {
          minInput.style.display = 'inline-block';
          maxInput.style.display = 'inline-block';
        } else {
          minInput.style.display = 'none';
          maxInput.style.display = 'none';
        }
        
        applyFilters();
      };
    }
    
    const onlineMinEl = $('#ei-filter-online-min');
    const onlineMaxEl = $('#ei-filter-online-max');
    if (onlineMinEl) onlineMinEl.oninput = applyFilters;
    if (onlineMaxEl) onlineMaxEl.oninput = applyFilters;
    
    if (clearFiltersEl) {
      clearFiltersEl.onclick = () => {
        if (searchEl) searchEl.value = '';
        if (availEl) availEl.value = '';
        if (andonEl) andonEl.value = '';
        if (teamEl) teamEl.value = '';
        if (minInvEl) minInvEl.value = '';
        if (maxInvEl) maxInvEl.value = '';
        if (onlineAvailEl) {
          onlineAvailEl.value = '';
          const minInput = $('#ei-filter-online-min');
          const maxInput = $('#ei-filter-online-max');
          if (minInput) {
            minInput.value = '';
            minInput.style.display = 'none';
          }
          if (maxInput) {
            maxInput.value = '';
            maxInput.style.display = 'none';
          }
        }
        applyFilters();
      };
    }
    
    // Initial filter application
    setTimeout(applyFilters, 100);
  };

  const addTable = (container, dataModel, undoManager, autoSaveManager, validationManager, teamData = []) => {
    const tableContainer = createEl('div', { id: TABLE_CONTAINER, className: 'tm-ei-table-container' });
    const table = createEl('table', { id: 'ei-data-table', className: 'tm-ei-table' });
    
    // Create header with selection column
    const thead = createEl('thead');
    const headerRow = createEl('tr');
    
    // Selection header
    const selectHeader = createEl('th');
    selectHeader.innerHTML = '<input type="checkbox" id="ei-select-all" title="Select All">';
    headerRow.appendChild(selectHeader);
    
    // Data headers
    HEADERS.forEach(header => {
      const th = createEl('th', {}, header);
      headerRow.appendChild(th);
    });
    
    // Cosmetic column header
    COSMETIC_HEADERS.forEach(header => {
      const th = createEl('th', { className: 'tm-ei-cosmetic-column' }, header);
      th.title = 'Read-only column for filtering (not included in export)';
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = createEl('tbody');
    
    const renderTableRows = () => {
      tbody.innerHTML = '';
      
      dataModel.getData().slice(1).forEach((row, rowIndex) => {
        const actualRowIndex = rowIndex + 1;
        const tr = createEl('tr');
        tr.dataset.row = actualRowIndex;
        tr.dataset.team = teamData[rowIndex] || '';
        
        // Selection checkbox
        const selectTd = createEl('td');
        selectTd.innerHTML = `<input type="checkbox" class="tm-ei-row-select" data-row="${actualRowIndex}">`;
        tr.appendChild(selectTd);
        
        // Data cells
        row.forEach((cell, colIndex) => {
          const td = createEl('td');
          td.dataset.row = actualRowIndex;
          td.dataset.col = colIndex;
          
          let input;
          if (colIndex === 3) { // Availability
            input = createEl('select', { className: 'tm-ei-cell-select' });
            input.innerHTML = '<option value="Limited">Limited</option><option value="Unlimited">Unlimited</option>';
            input.value = cell || 'Limited';
          } else if (colIndex === 6) { // Andon Cord
            input = createEl('select', { className: 'tm-ei-cell-select' });
            input.innerHTML = '<option value="Enabled">Enabled</option><option value="Disabled">Disabled</option>';
            input.value = cell || 'Disabled';
          } else if (colIndex === 4 || colIndex === 5) { // Inventory or Sales Floor Capacity
            input = createEl('input', {
              className: 'tm-ei-cell-input',
              type: 'number',
              min: '0',
              max: '10000',
              value: cell || '0'
            });
          } else if (colIndex === 7 || colIndex === 8) { // Tracking Start Date or Tracking End Date
            input = createEl('input', {
              className: 'tm-ei-cell-input',
              type: 'date',
              value: cell || ''
            });
          } else {
            input = createEl('input', {
              className: 'tm-ei-cell-input',
              type: 'text',
              value: cell || ''
            });
          }

          // Add change listener with validation
          input.addEventListener('change', (e) => {
            const newValue = e.target.value;
            const oldValue = dataModel.getCell(actualRowIndex, colIndex);
            
            if (newValue !== oldValue) {
              undoManager.saveState(`Changed ${HEADERS[colIndex]} in row ${actualRowIndex}`);
              dataModel.setCell(actualRowIndex, colIndex, newValue);
              autoSaveManager.manualSave();
              
              // Apply business rule: Unlimited -> 0 inventory
              if (colIndex === 3 && newValue === 'Unlimited') {
                const invInput = tr.querySelector('[data-col="4"] input, [data-col="4"] select');
                if (invInput && invInput.value !== '0') {
                  invInput.value = '0';
                  dataModel.setCell(actualRowIndex, 4, '0');
                }
              }
              
              // Update cosmetic columns when availability, inventory, or andon changes
              if (colIndex === 3 || colIndex === 4 || colIndex === 6) {
                const cosmeticInputs = tr.querySelectorAll('.tm-ei-cosmetic-column input');
                if (cosmeticInputs.length >= 2) {
                  // First cosmetic column is Reserved Quantity (doesn't change)
                  // Second cosmetic column is Online Availability (updates based on changes)
                  cosmeticInputs[1].value = dataModel.getOnlineAvailability(actualRowIndex);
                }
              }
              
              // Real-time validation
              const cellErrors = validationManager.validateCell(actualRowIndex, colIndex, newValue, dataModel);
              if (cellErrors.length > 0) {
                td.classList.add('tm-ei-error');
                td.title = cellErrors.join(', ');
              } else {
                td.classList.remove('tm-ei-error');
                td.title = '';
              }
            }
          });

          // Add focus/blur effects
          input.addEventListener('focus', () => {
            td.classList.add('tm-ei-focused');
          });
          
          input.addEventListener('blur', () => {
            td.classList.remove('tm-ei-focused');
          });

          td.appendChild(input);
          tr.appendChild(td);
        });
        
        // Add cosmetic column 1: Reserved Quantity
        const reservedTd = createEl('td', { className: 'tm-ei-cosmetic-column' });
        const reservedValue = dataModel.getReservedQuantity(actualRowIndex);
        const reservedInput = createEl('input', {
          className: 'tm-ei-cell-input',
          type: 'text',
          value: reservedValue,
          readOnly: true,
          tabIndex: -1
        });
        reservedInput.title = 'Read-only: Reserved quantity from API';
        reservedTd.appendChild(reservedInput);
        tr.appendChild(reservedTd);
        
        // Add cosmetic column 2: Online Availability
        const onlineTd = createEl('td', { className: 'tm-ei-cosmetic-column' });
        const onlineValue = dataModel.getOnlineAvailability(actualRowIndex);
        const onlineInput = createEl('input', {
          className: 'tm-ei-cell-input',
          type: 'text',
          value: onlineValue,
          readOnly: true,
          tabIndex: -1
        });
        onlineInput.title = 'Read-only: Shows "0" if Andon enabled, "Unlimited" if unlimited, or (inventory - reserved) if limited';
        onlineTd.appendChild(onlineInput);
        tr.appendChild(onlineTd);
        
        tbody.appendChild(tr);
      });
    };
    
    window.updateTableFromModel = renderTableRows; // Make it global for undo/redo
    renderTableRows();
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
    
    // Connect select all checkbox
    $('#ei-select-all').onchange = (e) => {
      const checkboxes = document.querySelectorAll('.tm-ei-row-select');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        updateRowSelection(cb);
      });
    };
    
    // Connect individual row selections
    tbody.addEventListener('change', (e) => {
      if (e.target.classList.contains('tm-ei-row-select')) {
        updateRowSelection(e.target);
        
        // Update select all checkbox
        const allCheckboxes = document.querySelectorAll('.tm-ei-row-select');
        const checkedCheckboxes = document.querySelectorAll('.tm-ei-row-select:checked');
        $('#ei-select-all').checked = allCheckboxes.length === checkedCheckboxes.length;
        $('#ei-select-all').indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
      }
    });
  };

  const updateRowSelection = (checkbox) => {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
      row.classList.add('tm-ei-selected');
    } else {
      row.classList.remove('tm-ei-selected');
    }
  };

  const addBulkOperations = (container, dataModel, undoManager, autoSaveManager) => {
    const bulkOps = createEl('div', { className: 'tm-ei-bulk-ops', style: 'display:none;' });
    
    bulkOps.innerHTML = `
      <strong>Bulk Operations:</strong>
      <button class="bulk-limited">Set to Limited</button>
      <button class="bulk-unlimited">Set to Unlimited</button>
      <input type="number" id="ei-bulk-inventory" placeholder="Inventory" style="width:100px;" min="0" max="10000">
      <button class="bulk-inventory">Set Inventory</button>
      <input type="number" id="ei-bulk-capacity" placeholder="Capacity" style="width:100px;" min="0" max="10000">
      <button class="bulk-capacity">Set Sales Floor Capacity</button>
      <button class="bulk-andon-enabled">Enable Andon</button>
      <button class="bulk-andon-disabled">Disable Andon</button>
      <input type="date" id="ei-bulk-tracking-start" style="width:140px;">
      <button class="bulk-tracking-start">Set Tracking Start Date</button>
      <input type="date" id="ei-bulk-tracking-end" style="width:140px;">
      <button class="bulk-tracking-end">Set Tracking End Date</button>
      <button class="bulk-delete">Delete Selected</button>
      <span id="ei-selected-count" style="margin-left:10px;font-size:12px;color:#666;"></span>
    `;
    container.appendChild(bulkOps);
    
    // Show/hide bulk operations based on selection
    const updateBulkOpsVisibility = () => {
      const selected = document.querySelectorAll('.tm-ei-row-select:checked');
      bulkOps.style.display = selected.length > 0 ? 'flex' : 'none';
      $('#ei-selected-count').textContent = `${selected.length} rows selected`;
    };
    
    // Listen for selection changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('tm-ei-row-select') || e.target.id === 'ei-select-all') {
        updateBulkOpsVisibility();
      }
    });
    
    // Bulk operations handlers
    bulkOps.querySelector('.bulk-limited').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Set ${selected.length} rows to Limited availability?`)) {
        undoManager.saveState(`Bulk set ${selected.length} rows to Limited`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 3, 'Limited');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set ${selected.length} rows to Limited</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-unlimited').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Set ${selected.length} rows to Unlimited availability? This will also set inventory to 0.`)) {
        undoManager.saveState(`Bulk set ${selected.length} rows to Unlimited`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 3, 'Unlimited');
          dataModel.setCell(rowIndex, 4, '0');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set ${selected.length} rows to Unlimited</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-inventory').onclick = () => {
      const selected = getSelectedRows();
      const inventory = $('#ei-bulk-inventory').value;
      
      if (!inventory || isNaN(inventory) || inventory < 0 || inventory > 10000) {
        showInlineError(container, 'Please enter a valid inventory value (0-10000)');
        return;
      }
      
      if (selected.length && confirm(`Set inventory to ${inventory} for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk set inventory to ${inventory} for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 4, inventory);
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set inventory to ${inventory} for ${selected.length} rows</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-capacity').onclick = () => {
      const selected = getSelectedRows();
      const capacity = $('#ei-bulk-capacity').value;
      
      if (!capacity || isNaN(capacity) || capacity < 0 || capacity > 10000) {
        showInlineError(container, 'Please enter a valid sales floor capacity value (0-10000)');
        return;
      }
      
      if (selected.length && confirm(`Set sales floor capacity to ${capacity} for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk set sales floor capacity to ${capacity} for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 5, capacity);
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set sales floor capacity to ${capacity} for ${selected.length} rows</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-andon-enabled').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Enable Andon Cord for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk enable Andon for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 6, 'Enabled');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Enabled Andon Cord for ${selected.length} rows</div>`);
      }
    };

    bulkOps.querySelector('.bulk-andon-disabled').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Disable Andon Cord for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk disable Andon for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 6, 'Disabled');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:orange;">✓ Disabled Andon Cord for ${selected.length} rows</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-tracking-start').onclick = () => {
      const selected = getSelectedRows();
      const startDate = $('#ei-bulk-tracking-start').value;
      
      if (!startDate) {
        showInlineError(container, 'Please select a tracking start date');
        return;
      }
      
      // Validate date format
      const dateObj = new Date(startDate);
      if (isNaN(dateObj.getTime())) {
        showInlineError(container, 'Please enter a valid date');
        return;
      }
      
      if (selected.length && confirm(`Set tracking start date to ${startDate} for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk set tracking start date to ${startDate} for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 7, startDate);
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set tracking start date to ${startDate} for ${selected.length} rows</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-tracking-end').onclick = () => {
      const selected = getSelectedRows();
      const endDate = $('#ei-bulk-tracking-end').value;
      
      if (!endDate) {
        showInlineError(container, 'Please select a tracking end date');
        return;
      }
      
      // Validate date format
      const dateObj = new Date(endDate);
      if (isNaN(dateObj.getTime())) {
        showInlineError(container, 'Please enter a valid date');
        return;
      }
      
      if (selected.length && confirm(`Set tracking end date to ${endDate} for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk set tracking end date to ${endDate} for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 8, endDate);
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set tracking end date to ${endDate} for ${selected.length} rows</div>`);
      }
    };
    bulkOps.querySelector('.bulk-delete').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Delete ${selected.length} selected rows? This cannot be undone via undo.`)) {
        undoManager.saveState(`Bulk delete ${selected.length} rows`);
        dataModel.deleteRows(selected);
        updateTableFromModel();
        autoSaveManager.manualSave();
        bulkOps.style.display = 'none';
        showInlineError(container, `<div style="color:red;">🗑 Deleted ${selected.length} rows</div>`);
      }
    };
  };

  const getSelectedRows = () => {
    const selected = [];
    document.querySelectorAll('.tm-ei-row-select:checked').forEach(checkbox => {
      selected.push(parseInt(checkbox.dataset.row));
    });
    return selected;
  };

  /* -------------------------------------------------- *
   *  INPUT VALIDATION FOR INCREMENT FEATURE
   * -------------------------------------------------- */
  const validateIncrementInput = (type, value) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return { valid: false, message: 'Please enter a valid number' };
    }
    
    if (type === 'fixed') {
      if (numValue < -999 || numValue > 999) {
        return { valid: false, message: 'Fixed increment must be between -999 and 999' };
      }
    } else if (type === 'percentage') {
      if (numValue < -100 || numValue > 1000) {
        return { valid: false, message: 'Percentage must be between -100% and 1000%' };
      }
    }
    
    return { valid: true, value: numValue };
  };

  const addControls = (container, dataModel, undoManager, autoSaveManager, validationManager) => {
    const controlsHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;width:100%;box-sizing:border-box;">
        <div id="ei-increment-wrap">
          <label style="font-weight:500;">Increment Inventory:</label>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
            <select id="ei-increment-type" style="width:100px;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
            <input id="ei-increment-input" type="number" value="1" min="-999" max="999" step="1" placeholder="e.g., 5"
                   style="width:80px;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
            <button id="ei-increment-btn" class="tm-ei-action blue"
                    style="padding:6px 18px;font-size:14px;margin-top:0;white-space:nowrap;">Apply</button>
            <span id="ei-increment-help" style="color:#666;font-size:12px;flex-shrink:0;">(Limited items only, -999 to 999)</span>
          </div>
        </div>
        
        <div>
          <label style="font-weight:500;">Quick Actions:</label>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
            <button id="ei-validate-all-btn" class="tm-ei-action green"
                    style="padding:6px 12px;font-size:14px;margin-top:0;flex:1;min-width:100px;">Validate All</button>
            <button id="ei-download-btn" class="tm-ei-action blue"
                    style="padding:6px 12px;font-size:14px;margin-top:0;flex:1;min-width:100px;">Download CSV</button>
          </div>
          <label style="font-weight:400;display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;color:#666;">
            <input type="checkbox" id="ei-include-cosmetic" style="margin:0;">
            Include cosmetic columns (Reserved Qty, Online Availability) in CSV export
          </label>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', controlsHtml);
    
    // Dynamic input field updates based on increment type
    $('#ei-increment-type').onchange = (e) => {
      const type = e.target.value;
      const input = $('#ei-increment-input');
      const help = $('#ei-increment-help');
      
      if (type === 'fixed') {
        input.min = '-999';
        input.max = '999';
        input.step = '1';
        input.placeholder = 'e.g., 5';
        help.textContent = '(Limited items only, -999 to 999)';
      } else if (type === 'percentage') {
        input.min = '-100';
        input.max = '1000';
        input.step = '0.1';
        input.placeholder = 'e.g., 10.5';
        help.textContent = '(Limited items only, -100% to 1000%, rounded down)';
      }
    };
    
    // Connect increment
    $('#ei-increment-btn').onclick = () => {
      const type = $('#ei-increment-type').value;
      const inputValue = $('#ei-increment-input').value;
      
      // Validate input
      const validation = validateIncrementInput(type, inputValue);
      if (!validation.valid) {
        showInlineError(container, validation.message);
        return;
      }
      
      // Confirm percentage operations for clarity
      if (type === 'percentage' && !confirm(
        `Apply ${validation.value}% increment to all Limited items?\n\n` +
        `This will calculate ${validation.value}% of each item's current inventory ` +
        `and add it (rounded down to whole numbers).`
      )) {
        return;
      }
      
      // Execute increment
      undoManager.saveState(`${type === 'fixed' ? 'Fixed' : 'Percentage'} increment by ${validation.value}${type === 'percentage' ? '%' : ''}`);
      const result = incrementInventory(dataModel, validation.value, type);
      updateTableFromModel();
      autoSaveManager.manualSave();
      
      // Enhanced feedback message
      const typeLabel = type === 'fixed' ? '' : '%';
      const calculatedInfo = type === 'percentage' ? ` (${result.totalCalculated} total units added)` : '';
      showInlineError(container,
        `<div style="color:green;">✓ ${type === 'fixed' ? 'Fixed' : 'Percentage'} increment of ${validation.value}${typeLabel} applied to ${result.updatedCount} Limited items${calculatedInfo}</div>`
      );
    };
    
    // Connect validation
    $('#ei-validate-all-btn').onclick = () => {
      updateModelFromTable(dataModel);
      const errors = validationManager.validateData(dataModel);
      highlightErrors(errors);
      
      if (errors.length) {
        showInlineError(container, `Validation found ${errors.length} issues:<br>` + 
          errors.slice(0, 5).map(e => `<div>• Row ${e.row}: ${e.msg}</div>`).join('') +
          (errors.length > 5 ? `<div>• ... and ${errors.length - 5} more</div>` : ''));
      } else {
        showInlineError(container, '<div style="color:green;">✓ All validation checks passed!</div>');
      }
    };
    
    // Connect download
    $('#ei-download-btn').onclick = () => {
      updateModelFromTable(dataModel);
      const errors = validationManager.validateData(dataModel);
      
      if (errors.length && !confirmWarning(`Found ${errors.length} validation warnings. Download anyway?`)) {
        return;
      }

      // Check if user wants to include cosmetic columns
      const includeCosmeticColumns = $('#ei-include-cosmetic').checked;
      const csv = dataModel.toCSV(includeCosmeticColumns);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = createEl('a', {
        href: URL.createObjectURL(blob),
        download: `ExistingItemEdit_${new Date().toISOString().slice(0,10)}.csv`
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      
      const cosmeticMsg = includeCosmeticColumns ? ' (with cosmetic columns)' : '';
      showInlineError(container, `<div style="color:green;">✓ CSV downloaded successfully${cosmeticMsg}!</div>`);
    };
  };

  /* -------------------------------------------------- *
   *  UTILITY FUNCTIONS
   * -------------------------------------------------- */
  const updateModelFromTable = (dataModel) => {
    const inputs = document.querySelectorAll('#ei-data-table input, #ei-data-table select');
    inputs.forEach(input => {
      const cell = input.closest('td');
      if (cell && cell.dataset.row && cell.dataset.col) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        dataModel.setCell(row, col, input.value);
      }
    });
  };

  const incrementInventory = (dataModel, increment, type = 'fixed') => {
    const data = dataModel.getData();
    let updatedCount = 0;
    let totalCalculated = 0;
    
    for (let r = 1; r < data.length; r++) {
      const availability = dataModel.getCell(r, 3);
      if (availability === 'Limited') {
        const current = parseInt(dataModel.getCell(r, 4), 10) || 0;
        let newValue;
        
        if (type === 'fixed') {
          newValue = current + increment;
          totalCalculated += increment;
        } else if (type === 'percentage') {
          // Calculate percentage increment and round down
          const percentageIncrease = Math.floor(current * (increment / 100));
          newValue = current + percentageIncrease;
          totalCalculated += percentageIncrease;
        }
        
        // Apply bounds checking
        newValue = Math.max(0, Math.min(10000, newValue));
        dataModel.setCell(r, 4, newValue);
        updatedCount++;
      }
    }
    
    return {
      updatedCount,
      totalCalculated: totalCalculated
    };
  };

  const highlightErrors = (errors) => {
    clearValidationErrors();
    errors.forEach(error => {
      const cell = document.querySelector(`td[data-row="${error.row}"][data-col="${error.col}"]`);
      if (cell) {
        cell.classList.add('tm-ei-error');
        cell.title = error.msg;
      }
    });
  };

  const clearValidationErrors = () => {
    document.querySelectorAll('.tm-ei-error').forEach(el => {
      el.classList.remove('tm-ei-error');
      el.title = '';
    });
  };

  const setupKeyboardShortcuts = (dataModel, undoManager, autoSaveManager) => {
    document.addEventListener('keydown', (e) => {
      // Only apply shortcuts when not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              undoManager.redo();
            } else {
              undoManager.undo();
            }
            updateTableFromModel();
            autoSaveManager.manualSave();
            break;
          case 's':
            e.preventDefault();
            autoSaveManager.manualSave();
            break;
        }
      }
    });
  };

  /* -------------------------------------------------- *
   *  ENTRY POINT
   * -------------------------------------------------- */
  (function() {
    const observer = new MutationObserver(() => {
      if (!$('#' + EDIT_BTN_ID)) addEditBtn();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    addEditBtn();
  })();

})();
} catch (e) {
  console.error('[CAM_Tools] Module ExistingItemEditor.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: Settings.js
 * ================================================================ */
try {
/* eslint-env browser */
(function () {
  'use strict';
  //001
  // ------------------------------------------------------------------
  //  SETTINGS STORAGE
  // ------------------------------------------------------------------
  const SETTINGS_KEY = 'cam_tools_settings';
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
  }
  function setSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('camToolsSettingsChanged', { detail: s }));
  }

  // ------------------------------------------------------------------
  //  CENTRALIZED STATE
  // ------------------------------------------------------------------
  const SETTINGS_VERSION = 1;
  
  // ------------------------------------------------------------------
  //  UPDATE SYSTEM CONFIGURATION
  // ------------------------------------------------------------------
  const CAM_TOOLS_VERSION = '4.0.2'; // injected by build.js
  // Tamarin script page links (feedback)
  const TAMARIN_BUG_URL = 'https://tamarin.harmony.a2z.com/script/cam-admin-tools/report-bug';
  const TAMARIN_FEATURE_URL = 'https://tamarin.harmony.a2z.com/script/cam-admin-tools/request-feature';
  const GITHUB_RAW_URL = 'https://tamarin.aces.amazon.dev/scripts/cam-admin-tools/install.user.js'; // injected by build.js (Tamarin raw script URL)
  const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  const UPDATE_STORAGE_PREFIX = 'cam_tools_update_';
  
  const defaultSettings = {
    menuStyle: 'side',
    accentTheme: 'blue',
    accentCustom: '#3ea6ff',
    autoCheckUpdates: true,
    debugMode: false,
    updateCheckInterval: UPDATE_CHECK_INTERVAL,
    __version: SETTINGS_VERSION
  };
  let state = {
    settingsMenuOpen: false,
    sideMenuOpen: false,
    bottomBarVisible: false,
    // Update system state
    updateModalOpen: false,
    updateCheckInProgress: false,
    lastUpdateCheck: 0,
    availableUpdate: null,
    skippedVersion: null,
    ...defaultSettings,
    ...getSettings()
  };
  // Bottom bar should be visible by default when using bottom layout
  if (state.menuStyle === 'bottom') {
    state.bottomBarVisible = true;
  }

  // ------------------------------------------------------------------
  //  THEME HELPERS (reads from tm-theme.js CSS vars at runtime)
  // ------------------------------------------------------------------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function accent()    { return cssVar('--tm-accent-primary') || '#3ea6ff'; }
  function accentHov() { return cssVar('--tm-accent-hover')   || '#65b8ff'; }

  // Only persist these keys
  function persistSettings() {
    setSettings({
      menuStyle: state.menuStyle,
      accentTheme: state.accentTheme,
      accentCustom: state.accentCustom,
      autoCheckUpdates: state.autoCheckUpdates,
      debugMode: state.debugMode,
      updateCheckInterval: state.updateCheckInterval
    });
  }

  // Central state update
  function setState(partial) {
    let changed = false;
    for (const k in partial) {
      if (state[k] !== partial[k]) {
        state[k] = partial[k];
        changed = true;
      }
    }
    if (changed) {
      persistSettings();
      render();
    }
  }

  // ------------------------------------------------------------------
  //  UPDATE SYSTEM STORAGE
  // ------------------------------------------------------------------
  function getUpdateData(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(UPDATE_STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function setUpdateData(key, value) {
    try {
      localStorage.setItem(UPDATE_STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn('[Settings] Failed to store update data:', error);
    }
  }

  // ------------------------------------------------------------------
  //  UPDATE SYSTEM CORE FUNCTIONALITY
  // ------------------------------------------------------------------
  let updateCheckInterval = null;

  function isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(part => parseInt(part, 10));
    const currentParts = current.split('.').map(part => parseInt(part, 10));
    
    const maxLength = Math.max(latestParts.length, currentParts.length);
    while (latestParts.length < maxLength) latestParts.push(0);
    while (currentParts.length < maxLength) currentParts.push(0);
    
    for (let i = 0; i < maxLength; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }
    
    return false;
  }

  function extractVersionFromScript(scriptContent) {
    const versionMatch = scriptContent.match(/@version\s+([^\s]+)/);
    return versionMatch ? versionMatch[1].trim() : null;
  }

  // Fetches the published script source. Uses GM_xmlhttpRequest when available:
  // it runs outside the page origin, so it bypasses CORS and sends the user's
  // Midway cookies to tamarin.aces.amazon.dev (requires @connect in the header).
  // Falls back to fetch() for test environments without the GM API.
  function fetchScriptSource(url) {
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: url,
          headers: { 'Cache-Control': 'no-cache' },
          timeout: 30000,
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) {
              resolve(res.responseText);
            } else {
              reject(new Error(`HTTP ${res.status}`));
            }
          },
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Request timed out'))
        });
      });
    }
    return fetch(url, { cache: 'no-cache' }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    });
  }

  async function checkForUpdates(showNoUpdateMessage = false) {
    if (state.updateCheckInProgress) return;
    
    setState({ updateCheckInProgress: true });
    
    try {
      const lastCheck = getUpdateData('lastVersionCheck', 0);
      const now = Date.now();
      
      if (!showNoUpdateMessage && (now - lastCheck) < state.updateCheckInterval) {
        setState({ updateCheckInProgress: false });
        return;
      }
      
      const scriptContent = await fetchScriptSource(GITHUB_RAW_URL);
      const latestVersion = extractVersionFromScript(scriptContent);
      if (!latestVersion) {
        throw new Error('Could not extract version from script');
      }
      
      setUpdateData('lastVersionCheck', now);
      setState({ lastUpdateCheck: now });
      
      const skippedVersion = getUpdateData('skippedVersion');
      const hasUpdate = isNewerVersion(latestVersion, CAM_TOOLS_VERSION);
      const shouldNotify = hasUpdate && latestVersion !== skippedVersion;
      
      if (shouldNotify) {
        setState({
          availableUpdate: latestVersion,
          updateModalOpen: true
        });
      } else if (showNoUpdateMessage) {
        showUpdateStatusMessage(hasUpdate ? 'skipped' : 'current', latestVersion);
      }
      
    } catch (error) {
      console.error('[Settings] Update check failed:', error);
      if (showNoUpdateMessage) {
        showUpdateStatusMessage('error', null, error.message);
      }
    } finally {
      setState({ updateCheckInProgress: false });
    }
  }

  // Show update status via toast (replaces alert())
  function showUpdateStatusMessage(status, version, errorMsg) {
    const toast = window.TmTheme ? window.TmTheme.showToast : null;
    
    switch (status) {
      case 'current':
        if (toast) {
          toast(`Running latest version (v${CAM_TOOLS_VERSION})`, 'success', 4000);
        }
        break;
      case 'skipped':
        if (toast) {
          toast(`Update v${version} available but skipped`, 'info', 4000);
        }
        break;
      case 'error':
        if (toast) {
          toast(`Update check failed: ${errorMsg}`, 'error', 5000);
        }
        break;
    }
  }

  function initializeUpdateSystem() {
    setState({
      lastUpdateCheck: getUpdateData('lastVersionCheck', 0),
      skippedVersion: getUpdateData('skippedVersion')
    });
    
    if (!state.autoCheckUpdates) return;
    
    setTimeout(() => {
      checkForUpdates(false);
    }, 5000);
    
    if (updateCheckInterval) clearInterval(updateCheckInterval);
    updateCheckInterval = setInterval(() => {
      if (state.autoCheckUpdates) {
        checkForUpdates(false);
      }
    }, state.updateCheckInterval);
  }

  // ------------------------------------------------------------------
  //  ELEMENT HELPERS
  // ------------------------------------------------------------------
  function createButton({ id, title, html, style, onClick }) {
    const btn = document.createElement('button');
    if (id) btn.id = id;
    if (title) btn.title = title;
    if (html) btn.innerHTML = html;
    Object.assign(btn.style, style);
    if (onClick) btn.onclick = onClick;
    return btn;
  }

  // ------------------------------------------------------------------
  //  CSS FOR VISUAL HIDING + DARK MODE OVERRIDES
  // ------------------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    .nav-bar-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
    }
    .drawer[aria-hidden="true"] {
      display: none !important;
    }
    .drawer[aria-hidden="false"] {
      display: flex !important;
    }
  `;
  document.head.appendChild(style);

  // ------------------------------------------------------------------
  //  UI ELEMENTS  (dark mode)
  // ------------------------------------------------------------------
  const settingsBtn = createButton({
    id: 'settings-btn',
    title: 'Settings',
    html: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`,
    style: {
      position: 'fixed', left: '0', top: 'calc(10vh + 192px)',
      width: '36px', height: '36px', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', color: '#f1f1f1',
      border: '1px solid #303030', borderLeft: 'none',
      borderRadius: '0 8px 8px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.4)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background 150ms ease'
    }
  });

  const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="7"  x2="20" y2="7"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="17" x2="20" y2="17"/></svg>`;
  const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5"  y1="5"  x2="19" y2="19"/>
    <line x1="19" y1="5"  x2="5"  y2="19"/></svg>`;

  const toggleBtn = createButton({
    title: 'Show Menu',
    html: hamburgerSVG,
    style: {
      position: 'fixed', left: '0', top: 'calc(10vh + 150px)',
      width: '36px', height: '36px', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', color: '#f1f1f1',
      border: '1px solid #303030', borderLeft: 'none',
      borderRadius: '0 8px 8px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.4)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background 150ms ease'
    }
  });

  // Settings Menu Panel (dark, centered modal)
  const settingsMenu = document.createElement('div');
  Object.assign(settingsMenu.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0.95)',
    width: '340px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    background: '#1a1a1a',
    color: '#f1f1f1',
    display: 'none',
    flexDirection: 'column',
    gap: '18px',
    padding: '0',
    fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: '12px',
    border: '1px solid #303030',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
    zIndex: '9995',
    overflowY: 'auto',
    opacity: '0',
    transition: 'opacity .2s ease, transform .2s ease'
  });

  // Settings Modal Overlay (full-screen backdrop)
  const drawerOverlay = document.createElement('div');
  Object.assign(drawerOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.6)',
    zIndex: '9990',
    display: 'none'
  });
  drawerOverlay.addEventListener('click', () => setState({ settingsMenuOpen: false }));

  /** Icon Bar for Side Menu (dark) **/
  const iconBar = document.createElement('div');
  Object.assign(iconBar.style, {
    position: 'fixed',
    left: '0',
    top: 'calc(10vh + 192px + 36px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: '9999',
    background: 'transparent',
    padding: '8px 0',
    width: '36px',
    pointerEvents: 'auto'
  });
  iconBar.setAttribute('aria-label', 'Quick Tools');
  iconBar.setAttribute('role', 'menu');

  // ------------------------------------------------------------------
  //  UPDATE NOTIFICATION MODAL (dark)
  // ------------------------------------------------------------------
  function createUpdateModal(latestVersion) {
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9995',
      fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      background: '#1a1a1a',
      border: '1px solid #303030',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      animation: 'tm-fade-in 150ms ease-out'
    });

    const a = accent();
    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; background: ${a}; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
          <svg width="24" height="24" fill="#0f0f0f" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #f1f1f1;">
            CAM Tools Update Available
          </h2>
          <p style="margin: 4px 0 0; color: #aaaaaa; font-size: 14px;">
            A new version is ready to install
          </p>
        </div>
      </div>
      
      <div style="background: #242424; border: 1px solid #303030; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 500; color: #f1f1f1;">Current Version:</span>
          <span style="font-family: monospace; color: #aaaaaa;">${CAM_TOOLS_VERSION}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 500; color: #f1f1f1;">Latest Version:</span>
          <span style="font-family: monospace; color: ${a}; font-weight: 600;">${latestVersion}</span>
        </div>
      </div>
      
      <p style="color: #aaaaaa; line-height: 1.5; margin-bottom: 24px; font-size: 14px;">
        Click "Update Now" to open the latest version in a new tab. Install it through Tampermonkey.
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="update-skip-btn" style="padding: 8px 16px; border: 1px solid #3f3f3f; background: transparent;
                color: #aaaaaa; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;
                transition: background 150ms ease;">
          Skip Version
        </button>
        <button id="update-remind-btn" style="padding: 8px 16px; border: 1px solid ${a};
                background: transparent; color: ${a}; border-radius: 4px; cursor: pointer;
                font-size: 14px; font-weight: 500; transition: all 150ms ease;">
          Remind Later
        </button>
        <button id="update-now-btn" style="padding: 8px 20px; border: none; background: ${a};
                color: #0f0f0f; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;
                transition: background 150ms ease;">
          Update Now
        </button>
      </div>
    `;

    // Event handlers
    const updateBtn = modalContent.querySelector('#update-now-btn');
    const remindBtn = modalContent.querySelector('#update-remind-btn');
    const skipBtn = modalContent.querySelector('#update-skip-btn');

    updateBtn.onclick = () => {
      window.open(GITHUB_RAW_URL, '_blank');
      closeUpdateModal();
    };

    remindBtn.onclick = () => {
      setUpdateData('lastVersionCheck', 0);
      setState({ lastUpdateCheck: 0 });
      closeUpdateModal();
    };

    skipBtn.onclick = () => {
      setUpdateData('skippedVersion', latestVersion);
      setState({ skippedVersion: latestVersion });
      closeUpdateModal();
    };

    function closeUpdateModal() {
      setState({ updateModalOpen: false, availableUpdate: null });
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }

    modal.onclick = (e) => {
      if (e.target === modal) closeUpdateModal();
    };

    modal.onkeydown = (e) => {
      if (e.key === 'Escape') closeUpdateModal();
    };

    modal.appendChild(modalContent);
    return modal;
  }

  // ------------------------------------------------------------------
  //  STATIC SIDE MENU CONFIGURATION
  // ------------------------------------------------------------------
  const sideMenuItems = [
    {
      label: 'Download',
      tooltip: 'Download Data',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3v14m0 0l-5-5m5 5l5-5"/><rect x="4" y="19" width="16" height="2" rx="1" fill="currentColor" stroke="none"/></svg>`,
      action: () => document.getElementById('downloadDataButton')?.click()
    },
    {
      label: 'Add',
      tooltip: 'Add Item',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      action: () => document.getElementById('addItemButton')?.click()
    },
    {
      label: 'Activate',
      tooltip: 'Activate/Deactivate',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="7" rx="2"/><circle cx="12" cy="8" r="3"/></svg>`,
      action: () => document.getElementById('activateButton')?.click()
    },
    {
      label: 'Redrive',
      tooltip: 'Redrive',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/></svg>`,
      action: () => document.getElementById('redriveButton')?.click()
    },
    {
      label: 'Help',
      tooltip: 'General Help Tools',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`,
      action: () => document.getElementById('generalHelpToolsButton')?.click()
    },
    {
      label: 'Editor',
      tooltip: 'Edit Existing Items',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`,
      action: () => document.getElementById('tm-ei-openEditor')?.click()
    },
    {
      label: 'GCC',
      tooltip: 'Grocery Central Connect',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
      </svg>`,
      action: () => {
        const panel = document.querySelector('.tm-gcc-panel');
        if (panel) {
          panel.classList.toggle('tm-active');
          if (panel.classList.contains('tm-active')) {
            const input = document.querySelector('.tm-gcc-input');
            if (input) input.focus();
          }
        }
      }
    }
  ];

  // ------------------------------------------------------------------
  //  EXTRA OBSERVER FOR EDITOR ICON (stub)
  // ------------------------------------------------------------------
  const editorObserver = new MutationObserver(() => {});
  editorObserver.observe(document.body, { childList: true, subtree: true });

  const bottomButtonIds = ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton'];

  // ------------------------------------------------------------------
  //  RENDER FUNCTION
  // ------------------------------------------------------------------
  function render() {
    // Settings Button -- accent tint on hover handled via events
    settingsBtn.style.background = '#1a1a1a';

    // Settings Menu (centered modal)
    if (state.settingsMenuOpen) {
      renderSettingsMenu();
      settingsMenu.style.display = 'flex';
      drawerOverlay.style.display = 'block';
      // Trigger reflow for animation
      void settingsMenu.offsetWidth;
      settingsMenu.style.opacity = '1';
      settingsMenu.style.transform = 'translate(-50%, -50%) scale(1)';
      settingsMenu.style.pointerEvents = 'auto';
      settingsMenu.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const firstInput = settingsMenu.querySelector('select, input[type="color"]');
        if (firstInput) firstInput.focus();
      }, 100);
    } else {
      settingsMenu.style.opacity = '0';
      settingsMenu.style.transform = 'translate(-50%, -50%) scale(0.95)';
      settingsMenu.style.pointerEvents = 'none';
      settingsMenu.setAttribute('aria-hidden', 'true');
      drawerOverlay.style.display = 'none';
      // Hide after transition completes
      setTimeout(() => {
        if (!state.settingsMenuOpen) settingsMenu.style.display = 'none';
      }, 200);
    }

    // Hamburger/Close Button
    toggleBtn.innerHTML = (state.sideMenuOpen || state.bottomBarVisible) ? closeSVG : hamburgerSVG;
    toggleBtn.title = (state.sideMenuOpen || state.bottomBarVisible) ? 'Hide Menu' : 'Show Menu';

    // Update Modal
    const existingModal = document.getElementById('cam-tools-update-modal');
    if (state.updateModalOpen && state.availableUpdate) {
      if (!existingModal) {
        const modal = createUpdateModal(state.availableUpdate);
        modal.id = 'cam-tools-update-modal';
        document.body.appendChild(modal);
      }
    } else if (existingModal) {
      document.body.removeChild(existingModal);
    }

    // Icon Bar (side menu mode)
    if (state.menuStyle === 'side') {
      if (state.bottomBarVisible) {
        state.bottomBarVisible = false;
      }
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('nav-bar-hidden');
      });
      // Render icon bar (dark themed)
      iconBar.innerHTML = '';
      sideMenuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'iconbar-item';
        btn.setAttribute('role', 'menuitem');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-label', item.tooltip || item.label);
        btn.title = item.tooltip || item.label;
        btn.innerHTML = item.icon;
        Object.assign(btn.style, {
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a1a',
          color: '#f1f1f1',
          border: '1px solid #303030',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          margin: '0',
          padding: '0',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
          transition: 'background 150ms ease'
        });
        btn.onmouseenter = () => { btn.style.background = '#242424'; };
        btn.onmouseleave = () => { btn.style.background = '#1a1a1a'; };
        btn.onclick = item.action;
        iconBar.appendChild(btn);
      });
      iconBar.style.display = '';
    } else {
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('nav-bar-hidden');
        if (el) el.style.display = state.bottomBarVisible ? '' : 'none';
      });
      iconBar.style.display = 'none';
    }
  }

  // ------------------------------------------------------------------
  //  SETTINGS MENU CONTENT (dark)
  // ------------------------------------------------------------------
  function renderSettingsMenu() {
    const a = accent();
    const currentAccent = (window.TmTheme && window.TmTheme.getAccent) ? window.TmTheme.getAccent() : 'blue';
    const accentDefs = (window.TmTheme && window.TmTheme.listAccents)
      ? window.TmTheme.listAccents()
      : [{ name: 'blue', label: 'Blue', primary: '#3ea6ff' },
         { name: 'red', label: 'Red', primary: '#ff0000' },
         { name: 'green', label: 'WFM', primary: '#00a650' }];
    const customColor = /^#[0-9a-fA-F]{6}$/.test(state.accentCustom) ? state.accentCustom : '#3ea6ff';

    settingsMenu.innerHTML = `
      <div style="font-size:16px;font-weight:600;color:#f1f1f1;
                  display:flex;align-items:center;gap:8px;padding:14px 18px;
                  background:#242424;border-bottom:1px solid #303030;border-radius:12px 12px 0 0;
                  font-family:'Roboto','Segoe UI',sans-serif;flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Settings</span><span style="flex:1"></span>
        <button id="settings-close" style="background:none;border:none;
                font-size:22px;color:#717171;cursor:pointer;padding:4px;
                transition:color 150ms ease">&times;</button>
      </div>

      <div style="padding:18px;overflow-y:auto;flex:1;">
      <!-- Appearance Section (collapsible) -->
      <details open style="margin-bottom:4px;">
        <summary style="font-size:14px;font-weight:600;color:#f1f1f1;cursor:pointer;padding:8px 0;
                        display:flex;align-items:center;gap:8px;list-style:none;user-select:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Appearance
        </summary>
        <div style="padding:4px 0 8px;">
          <span style="font-weight:500;display:block;margin-bottom:6px;color:#aaaaaa;font-size:13px">Accent Color</span>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            ${accentDefs.map(d => `
              <button class="accent-swatch" data-accent="${d.name}" title="${d.label}"
                      style="width:26px;height:26px;border-radius:50%;cursor:pointer;padding:0;
                      background:${d.primary};box-sizing:border-box;
                      border:2px solid ${currentAccent === d.name ? '#f1f1f1' : 'rgba(255,255,255,0.15)'};
                      transform:${currentAccent === d.name ? 'scale(1.15)' : 'scale(1)'};
                      transition:all 150ms ease"></button>
            `).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <input type="color" id="accent-custom-picker" value="${customColor}"
                   title="Pick a custom accent color"
                   style="width:34px;height:26px;padding:0;border:2px solid ${currentAccent === 'custom' ? '#f1f1f1' : 'rgba(255,255,255,0.15)'};
                   border-radius:4px;background:transparent;cursor:pointer">
            <span style="font-size:12px;color:${currentAccent === 'custom' ? '#f1f1f1' : '#717171'}">
              Custom${currentAccent === 'custom' ? ` -- <span style="font-family:monospace">${customColor}</span>` : ''}
            </span>
          </div>
          <span style="font-weight:500;display:block;margin-bottom:6px;color:#aaaaaa;font-size:13px">Button Layout</span>
          <select id="menuStyle" style="width:100%;padding:8px 10px;border:1px solid #3f3f3f;border-radius:4px;
                  background:#0f0f0f;color:#f1f1f1;font-size:14px;font-family:inherit">
            <option value="side"   ${state.menuStyle === 'side' ? 'selected' : ''}>Side Menu</option>
            <option value="bottom" ${state.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Bar</option>
          </select>
        </div>
      </details>

      <!-- Developer Section (collapsible) -->
      <details style="border-top: 1px solid #303030; padding-top: 8px;">
        <summary style="font-size:14px;font-weight:600;color:#f1f1f1;cursor:pointer;padding:8px 0;
                        display:flex;align-items:center;gap:8px;list-style:none;user-select:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Developer
        </summary>
        <div style="padding:4px 0 8px;">
          <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
            <span class="tm-toggle">
              <input type="checkbox" id="debugMode" ${state.debugMode ? 'checked' : ''}>
              <span class="tm-toggle-slider"></span>
            </span>
            <span style="font-size: 13px; color: #aaaaaa;">Debug logging</span>
          </label>
          <div style="font-size: 11px; color: #717171; line-height: 1.5; margin-bottom: 4px;">
            When enabled, verbose debug messages from all modules are written to the browser console.
          </div>
        </div>
      </details>

      <!-- Updates Section (collapsible) -->
      <details style="border-top: 1px solid #303030; padding-top: 8px;">
        <summary style="font-size:14px;font-weight:600;color:#f1f1f1;cursor:pointer;padding:8px 0;
                        display:flex;align-items:center;gap:8px;list-style:none;user-select:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Updates
        </summary>
        <div style="padding:4px 0 8px;">
          <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
            <span class="tm-toggle">
              <input type="checkbox" id="autoCheckUpdates" ${state.autoCheckUpdates ? 'checked' : ''}>
              <span class="tm-toggle-slider"></span>
            </span>
            <span style="font-size: 13px; color: #aaaaaa;">Auto-check for updates</span>
          </label>
          
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button id="manual-update-check" style="flex: 1; padding: 8px 12px; border: 1px solid ${a};
                    background: transparent; color: ${a}; border-radius: 4px; cursor: pointer;
                    font-size: 13px; font-weight: 500; transition: all 150ms ease;
                    ${state.updateCheckInProgress ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
              ${state.updateCheckInProgress ? 'Checking...' : 'Check Now'}
            </button>
            <button id="reset-skipped-version" style="padding: 8px 12px; border: 1px solid #3f3f3f;
                    background: transparent; color: #aaaaaa; border-radius: 4px; cursor: pointer;
                    font-size: 13px; font-weight: 500; transition: all 150ms ease;"
                    title="Reset skipped version">
              Reset Skip
            </button>
          </div>
          
          <div style="font-size: 11px; color: #717171; line-height: 1.5;">
            <div>v${CAM_TOOLS_VERSION}</div>
            ${state.lastUpdateCheck ? `<div>Last check: ${new Date(state.lastUpdateCheck).toLocaleString()}</div>` : ''}
            ${state.skippedVersion ? `<div>Skipped: <span style="font-family: monospace;">${state.skippedVersion}</span></div>` : ''}
          </div>
        </div>
      </details>

      <!-- Feedback (Tamarin) -->
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="report-bug-btn" style="flex:1;padding:8px;border:1px solid #3f3f3f;
                background:transparent;color:#aaaaaa;border-radius:4px;cursor:pointer;
                font-size:13px;font-weight:500;transition:all 150ms ease;">
          Report Bug
        </button>
        <button id="request-feature-btn" style="flex:1;padding:8px;border:1px solid #3f3f3f;
                background:transparent;color:#aaaaaa;border-radius:4px;cursor:pointer;
                font-size:13px;font-weight:500;transition:all 150ms ease;">
          Request Feature
        </button>
      </div>

      <!-- Reset to Defaults -->
      <button id="reset-defaults" style="width:100%;margin-top:12px;padding:8px;border:1px solid #3f3f3f;
              background:transparent;color:#aaaaaa;border-radius:4px;cursor:pointer;
              font-size:13px;font-weight:500;transition:all 150ms ease;">
        Reset to Defaults
      </button>

      <!-- Dev Mark -->
      <div style="text-align: center; padding: 12px 0 4px; font-size: 11px; color: #717171; border-top: 1px solid #303030; margin-top: auto;">
        Developed by <a href="https://tamarin.harmony.a2z.com/script/cam-admin-tools" target="_blank" rel="noopener noreferrer"
                        style="color: ${a}; text-decoration: none;">Ryan Satterfield</a>
      </div>
      </div>
    `;

    // --- Wiring ---
    settingsMenu.querySelector('#settings-close').onclick = () => setState({ settingsMenuOpen: false });

    // Accent theme toggle (preset swatches)
    settingsMenu.querySelectorAll('.accent-swatch').forEach((btn) => {
      btn.onclick = () => {
        const name = btn.dataset.accent;
        if (window.TmTheme) window.TmTheme.setAccent(name);
        setState({ accentTheme: name });
      };
    });

    // Custom accent color picker: live preview while dragging (oninput does
    // not persist or re-render), commit on close (onchange).
    const customPicker = settingsMenu.querySelector('#accent-custom-picker');
    customPicker.oninput = (e) => {
      if (window.TmTheme) window.TmTheme.setAccent('custom', e.target.value);
    };
    customPicker.onchange = (e) => {
      if (window.TmTheme) window.TmTheme.setAccent('custom', e.target.value);
      setState({ accentTheme: 'custom', accentCustom: e.target.value });
    };

    settingsMenu.querySelector('#menuStyle').onchange = e => {
      const newStyle = e.target.value;
      setState({
        menuStyle: newStyle,
        sideMenuOpen: false,
        bottomBarVisible: newStyle === 'bottom',
        settingsMenuOpen: false
      });
    };
    
    // Update system event handlers
    settingsMenu.querySelector('#autoCheckUpdates').onchange = e => {
      setState({ autoCheckUpdates: e.target.checked });
      if (e.target.checked) {
        initializeUpdateSystem();
      } else if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
        updateCheckInterval = null;
      }
    };
    
    settingsMenu.querySelector('#manual-update-check').onclick = () => {
      if (!state.updateCheckInProgress) {
        checkForUpdates(true);
      }
    };
    
    settingsMenu.querySelector('#reset-skipped-version').onclick = () => {
      setUpdateData('skippedVersion', null);
      setState({ skippedVersion: null });
      if (window.TmTheme && window.TmTheme.showToast) {
        window.TmTheme.showToast('Skipped version reset', 'success', 3000);
      }
    };

    // Debug mode toggle
    settingsMenu.querySelector('#debugMode').onchange = e => {
      setState({ debugMode: e.target.checked });
      if (window.TmTheme && window.TmTheme.showToast) {
        window.TmTheme.showToast(
          e.target.checked ? 'Debug logging enabled' : 'Debug logging disabled',
          'info', 3000
        );
      }
    };

    // Reset to Defaults
    settingsMenu.querySelector('#report-bug-btn').onclick = () => {
      window.open(TAMARIN_BUG_URL, '_blank');
    };
    settingsMenu.querySelector('#request-feature-btn').onclick = () => {
      window.open(TAMARIN_FEATURE_URL, '_blank');
    };

    settingsMenu.querySelector('#reset-defaults').onclick = () => {
      if (window.TmTheme) window.TmTheme.setAccent('blue');
      setState({
        menuStyle: defaultSettings.menuStyle,
        accentTheme: 'blue',
        accentCustom: defaultSettings.accentCustom,
        autoCheckUpdates: defaultSettings.autoCheckUpdates,
        debugMode: defaultSettings.debugMode,
        updateCheckInterval: defaultSettings.updateCheckInterval,
        settingsMenuOpen: true
      });
      setUpdateData('skippedVersion', null);
      setUpdateData('lastVersionCheck', 0);
      if (window.TmTheme && window.TmTheme.showToast) {
        window.TmTheme.showToast('Settings reset to defaults', 'success', 3000);
      }
    };
  }

  // ------------------------------------------------------------------
  //  EVENT HANDLERS
  // ------------------------------------------------------------------
  settingsBtn.onmouseenter = () => { settingsBtn.style.background = '#242424'; };
  settingsBtn.onmouseleave = () => { settingsBtn.style.background = '#1a1a1a'; };
  settingsBtn.onclick = () => setState({ settingsMenuOpen: !state.settingsMenuOpen });

  toggleBtn.onmouseenter = () => { toggleBtn.style.background = '#242424'; };
  toggleBtn.onmouseleave = () => { toggleBtn.style.background = '#1a1a1a'; };
  toggleBtn.onclick = () => {
    if (state.menuStyle === 'side') {
      setState({ sideMenuOpen: !state.sideMenuOpen, bottomBarVisible: false });
    } else {
      setState({ bottomBarVisible: !state.bottomBarVisible, sideMenuOpen: false });
    }
  };

  // Keyboard accessibility
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.updateModalOpen) setState({ updateModalOpen: false, availableUpdate: null });
      if (state.settingsMenuOpen) setState({ settingsMenuOpen: false });
      if (state.sideMenuOpen) setState({ sideMenuOpen: false });
      if (state.bottomBarVisible) setState({ bottomBarVisible: false });
    }
    if (state.settingsMenuOpen || state.sideMenuOpen || state.updateModalOpen) {
      const focusable = Array.from(document.querySelectorAll('button, [tabindex="0"], select, input'));
      const visible = focusable.filter(el => el.offsetParent !== null);
      if (!visible.length) return;
      const first = visible[0], last = visible[visible.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });

  // Cross-tab settings sync
  window.addEventListener('camToolsSettingsChanged', () => {
    const newSettings = getSettings();
    let changed = false;
    ['menuStyle', 'accentTheme', 'accentCustom'].forEach(k => {
      if (state[k] !== newSettings[k]) {
        state[k] = newSettings[k];
        changed = true;
      }
    });
    if (changed) render();
  });

  // ------------------------------------------------------------------
  //  MOUNT EVERYTHING
  // ------------------------------------------------------------------
  if (!document.body.contains(drawerOverlay)) document.body.appendChild(drawerOverlay);
  if (!document.body.contains(settingsBtn)) document.body.appendChild(settingsBtn);
  if (!document.body.contains(settingsMenu)) document.body.appendChild(settingsMenu);
  if (!document.body.contains(toggleBtn)) document.body.appendChild(toggleBtn);
  if (!document.body.contains(iconBar)) document.body.appendChild(iconBar);

  // Transition styles
  const transitionStyle = document.createElement('style');
  transitionStyle.textContent = `
    #settings-btn, #settings-btn:focus { outline: none; }
    .drawer, #settings-btn, #settingsMenu {
      transition: box-shadow .25s, background 150ms ease, left .25s, transform .25s;
    }
    .drawer[aria-hidden="false"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    .drawer[aria-hidden="true"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="false"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="true"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #scratchpad-toggle-btn { z-index: 10000 !important; }
    [id^="scratchpad-toggle-btn"] { z-index: 10000 !important; }
    .iconbar-item { outline: none; }
    .iconbar-item:focus-visible { outline: 2px solid var(--tm-accent-primary); outline-offset: 2px; }
  `;
  document.head.appendChild(transitionStyle);

  // ------------------------------------------------------------------
  //  DYNAMIC BUTTON OBSERVER
  // ------------------------------------------------------------------
  (function observeNavButtons() {
    if (!Array.isArray(bottomButtonIds) || bottomButtonIds.length === 0) return;

    function applyButtonVisibility(el) {
      if (!el) return;
      if (state.menuStyle === 'side') {
        el.classList.add('nav-bar-hidden');
        el.style.display = '';
      } else {
        el.classList.remove('nav-bar-hidden');
        el.style.display = state.bottomBarVisible ? '' : 'none';
      }
    }

    // Apply initial visibility to any buttons already in the DOM
    bottomButtonIds.forEach(id => applyButtonVisibility(document.getElementById(id)));

    const observer = new MutationObserver((mutationsList) => {
      let shouldRender = false;
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            bottomButtonIds.forEach(id => {
              if (node.id === id) {
                applyButtonVisibility(node);
                shouldRender = true;
              }
              const descendant = node.querySelector && node.querySelector(`#${id}`);
              if (descendant) {
                applyButtonVisibility(descendant);
                shouldRender = true;
              }
            });
          }
        }
      }
      if (shouldRender) render();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();

  // Initial render
  render();

  // ------------------------------------------------------------------
  //  INITIALIZE UPDATE SYSTEM
  // ------------------------------------------------------------------
  initializeUpdateSystem();

  // Cursor emoji feature removed

})();
} catch (e) {
  console.error('[CAM_Tools] Module Settings.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: auditHistoryPull.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            auditHistoryPull
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Define the auditHistoryPull function
    async function auditHistoryPull() {
      // Password protection (same as AddItemButton.js)
      var pw = prompt('Enter password to access Audit History Pull:');
      if (pw !== 'Leeloo') {
        alert('Incorrect password. Access denied.');
        return;
      }

        console.log('[AuditHistory] Pull initiated');

        const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
        const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

        const headersStores = {
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/x-amz-json-1.0',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
        };

        // Create overlay and status elements
        const overlay = document.createElement('div');
        overlay.id = 'auditHistoryOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        let isCancelled = false;
        const statusContainer = document.createElement('div');
        statusContainer.style.position = 'relative';
        statusContainer.style.backgroundColor = '#1a1a1a';
        statusContainer.style.color = '#f1f1f1';
        statusContainer.style.padding = '0';
        statusContainer.style.borderRadius = '12px';
        statusContainer.style.width = '340px';
        statusContainer.style.maxWidth = '95vw';
        statusContainer.style.border = '1px solid #303030';
        statusContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
        statusContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
        statusContainer.style.overflow = 'hidden';
        statusContainer.innerHTML = `
            <div style="background:#242424;padding:12px 16px;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #303030;">
                <span>Audit History</span>
                <span id="auditHistoryCloseBtn" style="font-size:22px;cursor:pointer;color:#aaaaaa;padding:0 4px;transition:color 150ms ease;">&times;</span>
            </div>
            <div class="tm-form-stack">
                <p id="statusMessage" style="margin:0;font-size:13px;color:var(--tm-accent-primary, #3ea6ff);">Initializing...</p>
                <label class="tm-field-label">By</label>
                <select id="bySelect" class="tm-select">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <select id="storeSelect" class="tm-select"></select>
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="getAsinCheckbox">
                    <span>Get ASIN (extra slow)</span>
                </label>
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="allStoresCheckbox">
                    <span>All Stores</span>
                </label>
                <div style="display:flex;gap:8px;">
                    <button id="nextRequestButton" class="tm-form-action" style="flex:1;">Next Request</button>
                    <button id="cancelButton" class="tm-form-cancel" style="flex:1;margin-top:0;">Cancel</button>
                </div>
            </div>
        `;

        statusContainer.querySelector('#auditHistoryCloseBtn').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });
        overlay.appendChild(statusContainer);
        document.body.appendChild(overlay);

        let compiledData = [];

        const updateStatus = (message) => {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerText = message;
            }
        };

        // Now that elements are created, add event listeners
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                isCancelled = true;
                updateStatus('Cancelling...');
            });
        }

        async function fetchASIN(storeId, plu) {
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;
            const payload = { storeId: storeId, wfmScanCode: plu };
            // Short delay to avoid hammering
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const response = await fetch(apiUrlBase, {
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'x-amz-target': 'WfmCamBackendService.GetItemAvailability',
                        'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
                        'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${storeId}/item/${plu}`,
                        'Referrer-Policy': 'strict-origin-when-cross-origin'
                    },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                const data = await response.json();
                return data.itemAvailability ? data.itemAvailability.asin : 'error';
            } catch (err) {
                console.error(`Fetch error for PLU "${plu}":`, err);
                return 'error';
            }
        }

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        async function fetchAuditHistoryWithDelay(item, attempt = 1) {
            const maxAttempts = 5;
            const delayTime = Math.pow(2, attempt) * 100;

            try {
                // Short delay between each item request
                await new Promise(resolve => setTimeout(resolve, 500));

                const headersAudit = {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'x-amz-target': 'WfmCamBackendService.GetAuditHistory',
                    'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
                    'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${item.storeId}/item/${item.wfmScanCode}`,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                };

                const response = await fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersAudit,
                    body: JSON.stringify({
                        storeId: item.storeId,
                        wfmScanCode: item.wfmScanCode
                    }),
                    credentials: 'include'
                });

                // Handle 429 rate limiting
                if (response.status === 429 && attempt < maxAttempts) {
                    console.warn(`Rate limited, retrying in ${delayTime / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                    return fetchAuditHistoryWithDelay(item, attempt + 1);
                }

                const auditData = await response.json();
                console.log('Audit Data Response:', auditData);
                console.log('Compiled Data Before Push:', compiledData);

                // Determine the most recent "Andon Cord enabled" event
                const andonEnabledEvent = auditData.auditHistory
                    .filter(entry => entry.updateReason === "Andon Cord enabled")
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

                const timeSinceAndonEnabled = andonEnabledEvent
                    ? `${Math.floor((new Date() - new Date(andonEnabledEvent.updatedAt)) / (1000 * 60 * 60 * 24))} days ago`
                    : `${Math.floor((new Date() - new Date(auditData.auditHistory[0].updatedAt)) / (1000 * 60 * 60 * 24))} days ago (since earliest entry)`;

                for (const entry of auditData.auditHistory) {
                    let asin = 'Not Requested';
                    if (document.getElementById('getAsinCheckbox').checked) {
                        asin = await fetchASIN(item.storeId, item.wfmScanCode);
                    }
                    const uniqueKey = `${item.storeId}-${item.wfmScanCode}`;
                    compiledData.push({
                        uniqueKey: uniqueKey,
                        storeId: item.storeId,
                        wfmScanCode: item.wfmScanCode,
                        newValue: entry.newValue,
                        previousValue: entry.previousValue || 'N/A',
                        updateReason: entry.updateReason,
                        updatedAt: entry.updatedAt,
                        updatedBy: entry.updatedBy,
                        timeSinceAndonEnabled: timeSinceAndonEnabled,
                        asin: asin
                    });
                }
            } catch (error) {
                console.error('Error fetching audit history:', error);
                updateStatus('Error fetching audit history for item.');
            }
        }

        // Fetch stores
        updateStatus('Fetching list of stores...');
        fetch(apiUrlBase, {
            method: 'POST',
            headers: headersStores,
            body: JSON.stringify({}),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(storeData => {
            if (!storeData || !storeData.storesInformation) {
                throw new Error('Invalid store data received');
            }

            const bySelectElement = document.getElementById('bySelect');
            const storeSelect = document.getElementById('storeSelect');
            const allStoresCheckbox = document.getElementById('allStoresCheckbox');

            // Disable store dropdown if "All Stores" is checked
            allStoresCheckbox.addEventListener('change', function() {
                storeSelect.disabled = this.checked;
            });

            const stores = [];
            for (const region in storeData.storesInformation) {
                const states = storeData.storesInformation[region];
                for (const state in states) {
                    states[state].forEach(store => {
                        stores.push({
                            value: store.storeTLC,
                            text: `${store.storeTLC} - ${store.storeName}`
                        });
                    });
                }
            }

            // Populate store dropdown or region dropdown based on "bySelect"
            bySelectElement.addEventListener('change', function() {
                const bySelectValue = bySelectElement.value;
                storeSelect.innerHTML = ''; // Clear existing options
                storeSelect.placeholder = `Select a ${bySelectValue.toLowerCase()}...`;
                if (bySelectValue === 'Store') {
                    stores.forEach(store => {
                        const option = document.createElement('option');
                        option.value = store.value;
                        option.text = store.text;
                        storeSelect.add(option);
                    });
                } else {
                    // Populate with region names
                    Object.keys(storeData.storesInformation).forEach(region => {
                        const option = document.createElement('option');
                        option.value = region;
                        option.text = region;
                        storeSelect.add(option);
                    });
                }
            });

            // Initialize store select with a placeholder
            storeSelect.innerHTML = '<option value="">Select a store...</option>';
            bySelectElement.dispatchEvent(new Event('change')); // Trigger to populate initial options
            updateStatus('Store information retrieved successfully.');

            // Sort stores alphabetically for the Store dropdown
            stores.sort((a, b) => a.text.localeCompare(b.text));
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.value;
                option.text = store.text;
                storeSelect.add(option);
            });

            // Make the dropdown searchable (requires Select2)
            $(storeSelect).select2({
                placeholder: 'Select a store...',
                allowClear: true
            });

            // ------------------------------------------------------------------
            //  Batching logic: fetch items in groups of (say) 10 stores at a time
            // ------------------------------------------------------------------
            const headersItems = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
            };

            // Helper function to fetch items for store IDs in batches
            async function fetchItemsInBatches(storeIds, batchSize=10) {
                let allItems = [];
                // Break the array of storeIds into slices of size "batchSize"
                for (let i = 0; i < storeIds.length; i += batchSize) {
                    const storeIdBatch = storeIds.slice(i, i + batchSize);
                    updateStatus(`Fetching items for stores [${storeIdBatch.join(', ')}] ...`);

                    // Single fetch call for this batch
                    const response = await fetch(apiUrlBase, {
                        method: 'POST',
                        headers: headersItems,
                        body: JSON.stringify({
                            filterContext: {
                                storeIds: storeIdBatch
                            },
                            paginationContext: {
                                pageNumber: 0,
                                pageSize: 10000
                            }
                        }),
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (data && data.itemsAvailability) {
                        allItems.push(...data.itemsAvailability);
                    }

                    // Short delay between batches to avoid overwhelming the server
                    await delay(500);
                }
                return allItems;
            }

            // Handle the "Next Request" button
            const nextRequestButton = document.getElementById('nextRequestButton');
            if (nextRequestButton) {
                nextRequestButton.addEventListener('click', function() {
                    const bySelectValue = document.getElementById('bySelect').value;
                    const selectedValue = $(storeSelect).val(); // Use select2 method
                    const allStoresSelected = document.getElementById('allStoresCheckbox').checked;

                    // Must choose a store/region unless "All Stores" is checked
                    if (!selectedValue && !allStoresSelected) {
                        updateStatus(`Please select a ${bySelectValue.toLowerCase()}.`);
                        return;
                    }

                    // Prepare the store list depending on "By Store", "By Region", or "All Stores"
                    const storeIds = allStoresSelected
                        ? Object.values(storeData.storesInformation).flatMap(regionObj =>
                            Object.values(regionObj).flat().map(store => store.storeTLC)
                          )
                        : bySelectValue === 'Store'
                            ? [selectedValue]
                            : Object.values(storeData.storesInformation[selectedValue])
                                 .flat()
                                 .map(store => store.storeTLC);

                    // Now fetch *all* items from those storeIds in batches
                    fetchItemsInBatches(storeIds, 10)
                        .then(async (allItemsAvailability) => {
                            // Filter for Andon
                            const items = allItemsAvailability.filter(item => item.andon === true);
                            const itemsData = allItemsAvailability.map(item => ({
                                storeId: item.storeId,
                                wfmScanCode: item.wfmScanCode,
                                itemName: item.itemName,
                                inventoryStatus: item.inventoryStatus,
                                currentInventoryQuantity: item.currentInventoryQuantity
                            }));

                            console.log('Items with Andon Cord enabled:', items);
                            updateStatus(`Found ${items.length} items with Andon Cord enabled`);

                            // -------------------------------
                            // Concurrency for Audit History
                            // -------------------------------
                            let maxConcurrentRequests = 5; // Start with a default concurrency
                            let currentIndex = 0;
                            const startTime = Date.now();

                            const processNextBatch = async () => {
                                if (isCancelled || currentIndex >= items.length) return;

                                const batch = items.slice(currentIndex, currentIndex + maxConcurrentRequests);
                                currentIndex += batch.length;

                                const results = await Promise.all(batch.map(async (item) => {
                                    try {
                                        await fetchAuditHistoryWithDelay(item);
                                        // Estimate progress/time
                                        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                                        const estimatedTotalTime = (elapsedTime / currentIndex) * items.length;
                                        const remainingTime = estimatedTotalTime - elapsedTime;
                                        updateStatus(`Gathering audit history... ${currentIndex} / ${items.length}. Estimated time left: ${Math.round(remainingTime)} seconds`);
                                        return true; // success
                                    } catch (error) {
                                        console.error('Error fetching audit history:', error);
                                        return false; // failure
                                    }
                                }));

                                // Dynamically adjust concurrency based on success rate
                                const successRate = results.filter(Boolean).length / results.length;
                                if (successRate < 0.8) {
                                    maxConcurrentRequests = Math.max(1, maxConcurrentRequests - 1);
                                } else if (successRate === 1) {
                                    maxConcurrentRequests = Math.min(10, maxConcurrentRequests + 1);
                                }

                                // Short delay between batches
                                await delay(100);

                                // Continue to next batch
                                return processNextBatch();
                            };

                            await Promise.all([processNextBatch()]);

                            // Optional progress bar container
                            const progressContainer = document.createElement('div');
                            progressContainer.id = 'progressContainer';
                            statusContainer.appendChild(progressContainer);

                            // Example React-based progress bar (requires React/ReactDOM)
                            const ProgressBar = ({ progress }) => (
                                React.createElement('div', { className: 'progress', style: { width: '100%', marginTop: '10px' } },
                                    React.createElement('div', {
                                        className: 'progress-bar',
                                        role: 'progressbar',
                                        style: { width: `${progress}%` },
                                        'aria-valuenow': progress,
                                        'aria-valuemin': '0',
                                        'aria-valuemax': '100'
                                    }, `${progress}%`)
                                )
                            );
                            const progress = (currentIndex / items.length) * 100;
                            if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
                                ReactDOM.render(
                                    React.createElement(ProgressBar, { progress }),
                                    progressContainer
                                );
                            }

                            // Final Excel export if not cancelled and we got data
                            if (!isCancelled && compiledData.length > 0) {
                                const workbook = XLSX.utils.book_new();

                                // "ItemsAvailability" sheet
                                const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
                                XLSX.utils.book_append_sheet(workbook, itemsWorksheet, 'ItemsAvailability');

                                // For the audit history: reduce to one row per unique key
                                // Create unique data by keeping the most recent entry for each uniqueKey
                                const uniqueDataMap = new Map();
                                compiledData.forEach(item => {
                                    const existing = uniqueDataMap.get(item.uniqueKey);
                                    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
                                        uniqueDataMap.set(item.uniqueKey, item);
                                    }
                                });
                                const uniqueData = Array.from(uniqueDataMap.values());
                                console.log('Unique Data Before Download:', uniqueData);

                                if (uniqueData.length > 0) {
                                    console.log('Preparing to download data...');
                                    const uniqueWorksheet = XLSX.utils.json_to_sheet(uniqueData);
                                    const compiledWorksheet = XLSX.utils.json_to_sheet(compiledData);

                                    XLSX.utils.book_append_sheet(workbook, uniqueWorksheet, 'UniqueAuditHistory');
                                    XLSX.utils.book_append_sheet(workbook, compiledWorksheet, 'CompiledAuditHistory');
                                    XLSX.writeFile(workbook, 'AuditHistoryData.xlsx');
                                    updateStatus('Audit history data exported to Excel file.');
                                    console.log('Download triggered.');
                                } else {
                                    updateStatus('No data available to export.');
                                }
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching items:', error);
                            updateStatus('Error fetching items for store.');
                        });
                });
            }
        })
        .catch(error => {
            console.error('Error fetching store data:', error);
            updateStatus('Error fetching store data.');
        });
    }

    // Setup mutation observer for button
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const auditHistoryPullButton = document.getElementById('auditHistoryPullButton');
                if (auditHistoryPullButton) {
                    auditHistoryPullButton.addEventListener('click', auditHistoryPull);
                    observer.disconnect();
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
} catch (e) {
  console.error('[CAM_Tools] Module auditHistoryPull.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: DesyncFinder.js
 * ================================================================ */
try {
(function() {
    'use strict';

    // Expose the function to the global scope for testing, wrap in a try so that it doesn't crash Tampermonkey
    try {
        module.exports = {
            addDesyncFinderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addDesyncFinderFunctionality() {
        console.log('[DesyncFinder] Button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'desyncFinderOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Create close button
        var closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#fff';
        closeButton.style.backgroundColor = '#000';
        closeButton.style.padding = '5px';
        closeButton.style.borderRadius = '0';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Desync Finder</h3>
            <label for="dailyInventoryFileInput">Daily Inventory File (.xlsx):</label>
            <input type="file" id="dailyInventoryFileInput" style="width: 100%; margin-bottom: 10px;" accept=".xlsx">
            <label for="fullCAMDataFileInput">Full CAM Data File (.csv):</label>
            <input type="file" id="fullCAMDataFileInput" style="width: 100%; margin-bottom: 10px;" accept=".csv">
            <button id="findDesyncIssuesButton" style="width: 100%; margin-bottom: 10px;" onclick="findDesyncIssues()">Find Desync Issues</button>
            <div id="statusMessage" style="margin-top: 10px; text-align: center; font-size: 14px; color: #004E36;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
    }

    // Make this globally visible so the button can call it
    window.findDesyncIssues = function() {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerText = 'Processing...';
        console.log('Button clicked, starting desync analysis...');

        // Utility to read file async
        const readFileAsync = (file, isCsv = false) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                // If it's a CSV, read as text. For XLSX, read as binary.
                if (isCsv) {
                    reader.readAsText(file);
                } else {
                    reader.readAsBinaryString(file);
                }
            });
        };

        const processFiles = async () => {
            try {
                // Step 1: Read the CAM (CSV) data
                console.log('Reading CAM data...');
                statusMessage.innerText = 'Reading CAM data...';
                const camFileInput = document.getElementById('fullCAMDataFileInput').files[0];
                const camFileContents = await readFileAsync(camFileInput, true /* isCsv */);
                const camData = XLSX.read(camFileContents, {
                    type: 'string', // since it's CSV
                    raw: true,      // faster, no format conversions
                    cellDates: true,
                    cellStyles: true
                });
                statusMessage.innerText = 'CAM data read successfully.';

                console.log('Processing CAM data...');
                statusMessage.innerText = 'Processing CAM data...';
                const camSheet = camData.Sheets[camData.SheetNames[0]];
                const camJson = XLSX.utils.sheet_to_json(camSheet, { raw: true })
                    .map(row => ({
                        ...row,
                        // Construct "Helper CAM" for matching
                        'Helper CAM': row['storeId'] + row['wfmScanCode']
                    }));
                console.log("Cam Helper Column Complete");
                statusMessage.innerText = 'Cam Helper Column Complete';

                // Step 2: Read the Daily Inventory (XLSX) data
                console.log('Reading Daily Inventory data...');
                statusMessage.innerText = 'Reading Daily Inventory data...';
                const diFileInput = document.getElementById('dailyInventoryFileInput').files[0];
                const diFileContents = await readFileAsync(diFileInput, false /* isCsv */);
                const diData = XLSX.read(diFileContents, {
                    type: 'binary',
                    raw: true,
                    cellDates: true,
                    cellStyles: true
                });
                statusMessage.innerText = 'Daily Inventory data read successfully.';

                console.log('Processing Daily Inventory data...');
                statusMessage.innerText = 'Processing Daily Inventory data...';
                const diSheet = diData.Sheets['WFMOAC Inventory Data'];
                const diJson = XLSX.utils.sheet_to_json(diSheet, { raw: true })
                    .map(row => ({
                        ...row,
                        // Construct "Helper DI" for matching
                        'Helper DI': row['store_tlc'] + row['sku_wo_chck_dgt']
                    }));
                console.log("Daily Inventory Helper Column Complete");
                statusMessage.innerText = 'Daily Inventory Helper Column Complete';

                // Step 3: Build a map from daily inventory data for faster lookup
                const diMap = new Map(diJson.map(row => [row['Helper DI'], row]));

                // Step 4: Join data in a single pass (avoid filter(...some(...)) which is O(n*m))
                const joinedData = [];
                for (const camRow of camJson) {
                    const diRow = diMap.get(camRow['Helper CAM']);
                    if (diRow) {
                        // If we found a matching daily-inventory row, merge them
                        joinedData.push({ ...camRow, ...diRow });
                    }
                }

                // Step 5: Identify desyncs
                console.log('Identifying desyncs...');
                statusMessage.innerText = 'Identifying desyncs...';

                // NOTE: The condition here might look "backwards" but is presumably correct for your logic.
                const desyncs = joinedData.reduce((acc, row) => {
                    // This condition flags items that are "in sync" if we read it plainly,
                    // but the script's naming is reversed, so we keep it as-is if you say it is correct.
                    if (
                        (row['andon'] === 'Disabled' && row['listing_status'] === 'Inactive') ||
                        (row['andon'] === 'Enabled' && row['listing_status'] === 'Active')
                    ) {
                        acc.push(row);
                    }
                    return acc;
                }, []);

                // Step 6: Output Results
                if (desyncs.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(desyncs);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Desynced Items');
                    XLSX.writeFile(wb, 'Desynced_Items.xlsx');
                    console.log('Desynced items file created and downloaded.');
                    statusMessage.innerText = 'Desynced items file created and downloaded.';
                } else {
                    console.log('No desyncs found.');
                    statusMessage.innerText = 'No desyncs found.';
                }
            } catch (error) {
                console.error('Error processing files:', error);
                statusMessage.innerText = 'Error processing files.';
            }
        };

        processFiles();
    };

    // Attach event listener to the Desync Finder button when it appears
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const desyncFinder = document.getElementById('desyncFinderButton');
                if (desyncFinder) {
                    desyncFinder.addEventListener('click', addDesyncFinderFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
} catch (e) {
  console.error('[CAM_Tools] Module DesyncFinder.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: scratchpaper.js
 * ================================================================ */
try {
(function() {
    try {
        'use strict';

        // --- Persistent State Helpers ---
        function getTabs() {
            try {
                return JSON.parse(localStorage.getItem('scratchpad-tabs')) || [
                    { name: 'Tab 1', content: '' }
                ];
            } catch {
                return [{ name: 'Tab 1', content: '' }];
            }
        }
        function setTabs(tabs) {
            localStorage.setItem('scratchpad-tabs', JSON.stringify(tabs));
        }
        function getActiveTab() {
            return parseInt(localStorage.getItem('scratchpad-active-tab') || '0', 10);
        }
        function setActiveTab(idx) {
            localStorage.setItem('scratchpad-active-tab', idx);
        }
        // --- Settings Helpers ---
        function getMenuStyleSetting() {
            try {
                const settings = JSON.parse(localStorage.getItem('cam_tools_settings'));
                return settings && settings.menuStyle ? settings.menuStyle : 'side';
            } catch {
                return 'side';
            }
        }

        // --- UI Elements ---
        // Button
        const scratchpadButton = document.createElement('button');
        scratchpadButton.id = 'scratchpad-toggle-btn';
        scratchpadButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Pad';
        scratchpadButton.style.position = 'fixed';
        scratchpadButton.style.left = '0';
        scratchpadButton.style.top = '10vh';
        scratchpadButton.style.zIndex = '2000';
        scratchpadButton.style.background = '#1a1a1a';
        scratchpadButton.style.color = '#f1f1f1';
        scratchpadButton.style.border = '1px solid #303030';
        scratchpadButton.style.border = 'none';
        scratchpadButton.style.borderRadius = '0 5px 5px 0';
        scratchpadButton.style.padding = '10px 0';
        scratchpadButton.style.cursor = 'pointer';
        scratchpadButton.style.fontSize = '16px';
        scratchpadButton.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
        scratchpadButton.style.height = '140px';
        scratchpadButton.style.width = '36px';
        scratchpadButton.style.writingMode = 'vertical-rl';
        scratchpadButton.style.textOrientation = 'mixed';
        scratchpadButton.style.letterSpacing = '2px';
        scratchpadButton.style.textAlign = 'center';
        scratchpadButton.style.userSelect = 'none';

        // Container
        const scratchpadContainer = document.createElement('div');
        scratchpadContainer.id = 'scratchpad-container';
        scratchpadContainer.style.position = 'fixed';
        scratchpadContainer.style.width = '340px';
        scratchpadContainer.style.maxWidth = '95vw';
        scratchpadContainer.style.background = '#1a1a1a';
        scratchpadContainer.style.border = '1px solid #303030';
        scratchpadContainer.style.color = '#f1f1f1';
        scratchpadContainer.style.borderRadius = '8px';
        scratchpadContainer.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
        scratchpadContainer.style.display = 'none';
        scratchpadContainer.style.zIndex = '2000';

        // Helper: center the scratchpad on screen
        function centerScratchpad() {
            scratchpadContainer.style.top = '50%';
            scratchpadContainer.style.left = '50%';
            scratchpadContainer.style.transform = 'translate(-50%, -50%)';
            scratchpadContainer.style.right = 'auto';
            scratchpadContainer.style.bottom = 'auto';
        }
        centerScratchpad();

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = '#242424';
        header.style.color = '#f1f1f1';
        header.style.borderBottom = '1px solid #303030';
        header.style.padding = '8px 12px';
        header.style.borderRadius = '8px 8px 0 0';
        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        const title = document.createElement('span');
        title.innerText = 'Scratchpad';

        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.marginLeft = '10px';

        header.appendChild(title);
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
const infoBox = document.createElement('div');
infoBox.id = 'scratchpadInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '44px';
infoBox.style.left = '12px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.border = '1px solid #303030';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
infoBox.style.zIndex = '2002';
infoBox.style.minWidth = '220px';
infoBox.style.maxWidth = '320px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;">Scratchpad</div>
            The Scratchpad is a persistent, multi-tab notepad for quick notes, lists, or code snippets.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Click the <b>Scratchpad</b> button on the left to open or close the pad.</li>
                <li>Use multiple tabs to organize your notes. Double-click a tab to rename it, or click "+" to add a new tab.</li>
                <li>All content is saved automatically and persists across sessions.</li>
                <li>Drag the header to reposition the pad anywhere on the screen.</li>
                <li>Use <b>Ctrl+Shift+S</b> to quickly toggle the pad.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Tab content is saved as you type.</li>
                <li>Close tabs with the "×" on each tab (at least one tab must remain).</li>
                <li>All data is stored locally in your browser and is not synced to the cloud.</li>
            </ul>
        </div>
        <button id="closeScratchpadInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
scratchpadContainer.style.position = 'relative';
scratchpadContainer.appendChild(infoBox);

// Add info icon to header
const infoIcon = document.createElement('span');
infoIcon.id = 'scratchpadInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#3f3f3f';
infoIcon.style.color = '#f1f1f1';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
`;
header.appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('scratchpadInfoIcon');
    var infoBox = document.getElementById('scratchpadInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(12, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeScratchpadInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);
        header.appendChild(closeBtn);

        // Tab Bar
        const tabBar = document.createElement('div');
        tabBar.id = 'scratchpad-tab-bar';
        tabBar.style.display = 'flex';
        tabBar.style.alignItems = 'center';
        tabBar.style.background = '#f2f2f2';
        tabBar.style.borderBottom = '1px solid #ccc';
        tabBar.style.padding = '0 4px';
        tabBar.style.overflowX = 'auto';

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'scratchpad-textarea';
        textarea.style.width = '96%';
        textarea.style.height = '180px';
        textarea.style.margin = '10px 2% 10px 2%';
        textarea.style.resize = 'vertical';
        textarea.style.fontSize = '15px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.border = '1px solid #ccc';
        textarea.style.borderRadius = '4px';
        textarea.style.padding = '8px';
        textarea.style.boxSizing = 'border-box';
        textarea.placeholder = 'Type or paste anything here...';

        // --- Tab Logic ---
        let tabs = getTabs();
        let activeTab = Math.min(getActiveTab(), tabs.length - 1);

        function renderTabs() {
            // Remove all children
            while (tabBar.firstChild) tabBar.removeChild(tabBar.firstChild);

            tabs.forEach((tab, idx) => {
                const tabBtn = document.createElement('div');
                tabBtn.innerText = tab.name;
                tabBtn.style.padding = '4px 10px';
                tabBtn.style.margin = '4px 2px 4px 0';
                tabBtn.style.borderRadius = '5px 5px 0 0';
                tabBtn.style.background = idx === activeTab ? '#e0e0e0' : 'transparent';
                tabBtn.style.cursor = 'pointer';
                tabBtn.style.position = 'relative';
                tabBtn.style.fontWeight = idx === activeTab ? 'bold' : 'normal';
                tabBtn.style.userSelect = 'none';
                tabBtn.title = 'Double-click to rename';

                // Switch tab
                tabBtn.addEventListener('click', function() {
                    saveCurrentTabContent();
                    activeTab = idx;
                    setActiveTab(activeTab);
                    renderTabs();
                    textarea.value = tabs[activeTab].content;
                    textarea.focus();
                });

                // Rename tab on double-click
                tabBtn.addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                    const newName = prompt('Rename tab:', tab.name);
                    if (newName && newName.trim()) {
                        tabs[idx].name = newName.trim();
                        setTabs(tabs);
                        renderTabs();
                    }
                });

                // Close tab button (if more than 1 tab)
                if (tabs.length > 1) {
                    const closeTabBtn = document.createElement('span');
                    closeTabBtn.innerHTML = '&times;';
                    closeTabBtn.style.position = 'absolute';
                    closeTabBtn.style.right = '2px';
                    closeTabBtn.style.top = '2px';
                    closeTabBtn.style.fontSize = '13px';
                    closeTabBtn.style.color = '#717171';
                    closeTabBtn.style.cursor = 'pointer';
                    closeTabBtn.title = 'Close tab';
                    closeTabBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        tabs.splice(idx, 1);
                        if (activeTab >= tabs.length) activeTab = tabs.length - 1;
                        setTabs(tabs);
                        setActiveTab(activeTab);
                        renderTabs();
                        textarea.value = tabs[activeTab].content;
                    });
                    tabBtn.appendChild(closeTabBtn);
                }

                tabBar.appendChild(tabBtn);
            });

            // Add tab button
            const addTabBtn = document.createElement('div');
            addTabBtn.innerText = '+';
            addTabBtn.style.padding = '4px 10px';
            addTabBtn.style.margin = '4px 2px 4px 0';
            addTabBtn.style.borderRadius = '5px 5px 0 0';
            addTabBtn.style.background = 'transparent';
            addTabBtn.style.cursor = 'pointer';
            addTabBtn.style.fontWeight = 'bold';
            addTabBtn.title = 'Add new tab';
            addTabBtn.addEventListener('click', function() {
                saveCurrentTabContent();
                const newTabName = `Tab ${tabs.length + 1}`;
                tabs.push({ name: newTabName, content: '' });
                activeTab = tabs.length - 1;
                setTabs(tabs);
                setActiveTab(activeTab);
                renderTabs();
                textarea.value = '';
                textarea.focus();
            });
            tabBar.appendChild(addTabBtn);
        }

        function saveCurrentTabContent() {
            if (tabs[activeTab]) {
                tabs[activeTab].content = textarea.value;
                setTabs(tabs);
            }
        }

        // --- Textarea Persistence ---
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';
        textarea.addEventListener('input', function() {
            if (tabs[activeTab]) {
                tabs[activeTab].content = textarea.value;
                setTabs(tabs);
            }
        });

        // --- UI Logic ---
        let hasBeenDragged = false;

        function showScratchpad() {
            if (!hasBeenDragged) centerScratchpad();
            scratchpadContainer.style.display = 'block';
            textarea.focus();
        }
        function hideScratchpad() {
            saveCurrentTabContent();
            scratchpadContainer.style.display = 'none';
        }

        scratchpadButton.addEventListener('click', function() {
            if (scratchpadContainer.style.display === 'none') {
                showScratchpad();
            } else {
                hideScratchpad();
            }
        });
        closeBtn.addEventListener('click', hideScratchpad);

        // Keyboard shortcut: Ctrl+Shift+S to toggle
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                if (scratchpadContainer.style.display === 'none') {
                    showScratchpad();
                } else {
                    hideScratchpad();
                }
                e.preventDefault();
            }
        });

        // Drag-and-drop logic for the scratchpad container
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            const rect = scratchpadContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            // Clear centering transform on drag start
            scratchpadContainer.style.transform = 'none';
            scratchpadContainer.style.zIndex = '3000';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                hasBeenDragged = true;
                let left = e.clientX - dragOffsetX;
                let top = e.clientY - dragOffsetY;
                left = Math.max(0, Math.min(window.innerWidth - scratchpadContainer.offsetWidth, left));
                top = Math.max(0, Math.min(window.innerHeight - scratchpadContainer.offsetHeight, top));
                scratchpadContainer.style.left = left + 'px';
                scratchpadContainer.style.top = top + 'px';
                scratchpadContainer.style.right = 'auto';
                scratchpadContainer.style.bottom = 'auto';
                scratchpadContainer.style.position = 'fixed';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                scratchpadContainer.style.zIndex = '2000';
                document.body.style.userSelect = '';
            }
        });

        // --- Assemble and add to DOM ---
        scratchpadContainer.appendChild(header);
        scratchpadContainer.appendChild(tabBar);
        scratchpadContainer.appendChild(textarea);
        document.body.appendChild(scratchpadButton);
        document.body.appendChild(scratchpadContainer);

        // Initial render
        renderTabs();
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';

    } catch (err) {
        // Log error but do not break the rest of the page
        console.error('[Scratchpad] Error initializing scratchpad:', err);
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module scratchpaper.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: GroceryCentralConnect.js
 * ================================================================ */
try {
/**
 * GroceryCentralConnect.js -- Query Grocery Central API for item metadata by scan code
 * Uses GM_xmlhttpRequest to bypass CORS restrictions when calling grocerycentral.amazon.dev
 * from the cam.wfm.amazon.dev origin. Requires @grant GM_xmlhttpRequest and
 * @connect grocerycentral.amazon.dev in the userscript header.
 */
(function () {
  'use strict';

  const LOG_PREFIX = '[GCC]';

  // ------------------------------------------------------------------
  //  SVG ICONS (Lucide-style, inline)
  // ------------------------------------------------------------------
  const ICONS = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    package: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    thermometer: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>',
    wine: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    database: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    searchEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 8h6"/></svg>'
  };

  // ------------------------------------------------------------------
  //  GRAPHQL QUERY
  // ------------------------------------------------------------------
  const GRAPHQL_QUERY = `query getItems($getItemsInput: GetItemsInput!) {
  getItems(input: $getItemsInput) {
    itemResponseMetadata { totalItems totalPages }
    items {
      identity { asin itemId scanCode }
      itemId localeId name
      payload {
        consumerInformation
        fields {
          alcoholContent { unit value }
          allergens
          brand { languageTag value }
          brandAbbreviation brandClassId
          customerFriendlyItemName dataSource detailedItemType dimensionsDataSource inactive
          ingredients { languageTag value }
          itemName { languageTag value }
          manufacturer { languageTag value }
          merchandiseClassId merchandiseHierarchy merchandisingTempZone
          nationalClassId nationalHierarchy
          numberOfItems { value }
          packageGroup packageGroupType priceLine priceLineDescription
          priceLookupCode { value }
          productDescription productPosDescription productRetailSize
          productSiteLaunchDate { value }
          productSubteam productSubteamNumber productTaxClass productTaxClassId
          productType { value }
          prohibitDiscount richDataStatus
          size { languageTag value }
          snipid
          totalEaches { value }
          unitCount { type { languageTag value } value }
          wfmAlcohol wfmBeerStyle wfmProductCreatedOn wfmUom wic
        }
        itemAttributes { hierarchies imageUrl scanCodes traits }
        metadata { createTime lastUpdateTime }
      }
    }
  }
}`;

  // ------------------------------------------------------------------
  //  CSS (uses shared --tm-* tokens from tm-theme.js)
  // ------------------------------------------------------------------
  const CSS = `
    /* Container */
    .tm-gcc-container {
      position: fixed;
      top: var(--tm-space-3, 12px);
      right: var(--tm-space-3, 12px);
      z-index: 9999;
      font-family: var(--tm-font-family, 'Roboto','Segoe UI',sans-serif);
      font-size: var(--tm-font-base, 14px);
      color: var(--tm-text-primary, #f1f1f1);
    }

    /* Toggle Button */
    .tm-gcc-toggle {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      background: var(--tm-bg-secondary, #1a1a1a);
      border: 1px solid var(--tm-border-subtle, #303030);
      border-radius: var(--tm-radius-md, 8px);
      cursor: pointer;
      transition: background var(--tm-transition-normal, 150ms ease);
      color: var(--tm-text-secondary, #aaaaaa);
    }
    .tm-gcc-toggle:hover { background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-primary, #f1f1f1); }
    .tm-gcc-toggle:focus-visible { outline: 2px solid var(--tm-accent-primary, #3ea6ff); outline-offset: 2px; }

    /* Panel */
    .tm-gcc-panel {
      display: none;
      background: var(--tm-bg-secondary, #1a1a1a);
      border: 1px solid var(--tm-border-subtle, #303030);
      border-radius: var(--tm-radius-md, 8px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      width: 400px; max-height: 80vh; overflow: hidden;
      margin-top: var(--tm-space-2, 8px);
    }
    .tm-gcc-panel.tm-active { display: block; }

    /* Header */
    .tm-gcc-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      border-bottom: 1px solid var(--tm-border-subtle, #303030);
      background: var(--tm-bg-secondary, #1a1a1a);
    }
    .tm-gcc-title { font-size: var(--tm-font-md, 16px); font-weight: 600; margin: 0; color: var(--tm-text-primary, #f1f1f1); display: flex; align-items: center; gap: 6px; }
    .tm-gcc-info-icon {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--tm-border-default, #3f3f3f); color: var(--tm-text-primary, #f1f1f1);
      cursor: pointer; transition: background var(--tm-transition-fast, 100ms ease);
      outline: none; flex-shrink: 0;
    }
    .tm-gcc-info-icon:hover, .tm-gcc-info-icon:focus-visible { background: var(--tm-accent-primary, #3ea6ff); color: var(--tm-bg-primary, #0f0f0f); }
    .tm-gcc-info-box {
      padding: var(--tm-space-3, 12px);
      margin: 0 var(--tm-space-3, 12px) var(--tm-space-2, 8px);
      background: var(--tm-bg-tertiary, #242424);
      border: 1px solid var(--tm-border-subtle, #303030);
      border-radius: var(--tm-radius-sm, 4px);
      font-size: 13px; line-height: 1.5;
      color: var(--tm-text-secondary, #aaaaaa);
    }
    .tm-gcc-close {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: var(--tm-radius-sm, 4px);
      cursor: pointer; color: var(--tm-text-secondary, #aaaaaa);
      transition: all var(--tm-transition-fast, 100ms ease);
    }
    .tm-gcc-close:hover { background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-primary, #f1f1f1); }

    /* Search Section */
    .tm-gcc-search {
      padding: var(--tm-space-4, 16px);
      border-bottom: 1px solid var(--tm-border-subtle, #303030);
      background: var(--tm-bg-primary, #0f0f0f);
    }
    .tm-gcc-label { display: block; font-size: var(--tm-font-sm, 12px); font-weight: 500; color: var(--tm-text-secondary, #aaaaaa); margin-bottom: var(--tm-space-2, 8px); }
    .tm-gcc-input-row { display: flex; gap: var(--tm-space-2, 8px); }
    .tm-gcc-input {
      flex: 1;
      background: var(--tm-bg-primary, #0f0f0f); color: var(--tm-text-primary, #f1f1f1);
      border: 1px solid var(--tm-border-default, #3f3f3f); border-radius: var(--tm-radius-sm, 4px);
      padding: var(--tm-space-2, 8px) var(--tm-space-3, 12px);
      font-size: var(--tm-font-base, 14px); font-family: inherit;
      transition: border-color var(--tm-transition-normal, 150ms ease);
    }
    .tm-gcc-input:focus { outline: none; border-color: var(--tm-accent-primary, #3ea6ff); }
    .tm-gcc-input::placeholder { color: var(--tm-text-disabled, #717171); }
    .tm-gcc-input-hint { font-size: var(--tm-font-xs, 11px); color: var(--tm-text-disabled, #717171); margin-top: var(--tm-space-2, 8px); }

    .tm-gcc-btn-primary {
      background: var(--tm-accent-primary, #3ea6ff); color: var(--tm-bg-primary, #0f0f0f);
      border: none; border-radius: var(--tm-radius-sm, 4px);
      padding: var(--tm-space-2, 8px) var(--tm-space-4, 16px);
      font-size: var(--tm-font-base, 14px); font-weight: 500;
      cursor: pointer; transition: background var(--tm-transition-normal, 150ms ease); font-family: inherit;
    }
    .tm-gcc-btn-primary:hover { background: var(--tm-accent-hover, #65b8ff); }
    .tm-gcc-btn-primary:disabled { background: var(--tm-border-default, #3f3f3f); color: var(--tm-text-disabled, #717171); cursor: not-allowed; }

    /* Results Section */
    .tm-gcc-results-section { max-height: calc(80vh - 140px); overflow-y: auto; }

    /* Loading */
    .tm-gcc-loading { display: none; text-align: center; padding: var(--tm-space-6, 24px); color: var(--tm-text-secondary, #aaaaaa); }
    .tm-gcc-loading.tm-active { display: block; }
    .tm-gcc-spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--tm-border-default, #3f3f3f);
      border-top-color: var(--tm-accent-primary, #3ea6ff);
      border-radius: 50%;
      animation: tm-gcc-spin 0.8s linear infinite;
      margin: 0 auto var(--tm-space-3, 12px);
    }
    @keyframes tm-gcc-spin { to { transform: rotate(360deg); } }

    /* Error */
    .tm-gcc-error {
      display: none;
      padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      margin: var(--tm-space-3, 12px);
      background: rgba(211,47,47,0.1); border: 1px solid var(--tm-accent-error, #d32f2f);
      border-radius: var(--tm-radius-sm, 4px); color: #ef5350; font-size: var(--tm-font-sm, 12px);
    }
    .tm-gcc-error.tm-active { display: block; }

    /* Results */
    .tm-gcc-results { display: none; }
    .tm-gcc-results.tm-active { display: block; }
    .tm-gcc-results-summary {
      padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      background: var(--tm-bg-tertiary, #242424);
      border-bottom: 1px solid var(--tm-border-subtle, #303030);
      font-size: var(--tm-font-sm, 12px); color: var(--tm-text-secondary, #aaaaaa);
    }
    .tm-gcc-results-summary strong { color: var(--tm-text-primary, #f1f1f1); }

    /* Item Card */
    .tm-gcc-item-card { border-bottom: 1px solid var(--tm-border-subtle, #303030); }
    .tm-gcc-item-header {
      padding: var(--tm-space-4, 16px);
      background: var(--tm-bg-tertiary, #242424);
      border-bottom: 1px solid var(--tm-border-subtle, #303030);
    }
    .tm-gcc-item-title { font-size: var(--tm-font-md, 16px); font-weight: 600; color: var(--tm-text-primary, #f1f1f1); margin: 0 0 var(--tm-space-2, 8px) 0; line-height: 1.3; }
    .tm-gcc-item-meta {
      font-size: var(--tm-font-sm, 12px); color: var(--tm-text-secondary, #aaaaaa);
      margin: 0; display: flex; flex-wrap: wrap; gap: var(--tm-space-2, 8px); align-items: center;
    }
    .tm-gcc-item-meta strong { color: var(--tm-text-primary, #f1f1f1); font-weight: 500; }
    .tm-gcc-badge {
      display: inline-block; padding: 2px var(--tm-space-2, 8px);
      border-radius: var(--tm-radius-sm, 4px);
      font-size: var(--tm-font-xs, 11px); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .tm-gcc-badge-active { background: rgba(46,125,50,0.2); color: #66bb6a; }
    .tm-gcc-badge-inactive { background: rgba(211,47,47,0.2); color: #ef5350; }

    /* Sections */
    .tm-gcc-section { border-bottom: 1px solid var(--tm-border-subtle, #303030); }
    .tm-gcc-section:last-child { border-bottom: none; }
    .tm-gcc-section-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      background: var(--tm-bg-secondary, #1a1a1a);
      cursor: pointer; user-select: none;
      transition: background var(--tm-transition-fast, 100ms ease);
    }
    .tm-gcc-section-header:hover { background: var(--tm-bg-tertiary, #242424); }
    .tm-gcc-section-title {
      display: flex; align-items: center; gap: var(--tm-space-2, 8px);
      font-size: var(--tm-font-sm, 12px); font-weight: 500; color: var(--tm-text-primary, #f1f1f1); margin: 0;
    }
    .tm-gcc-section-title svg { color: var(--tm-text-secondary, #aaaaaa); }
    .tm-gcc-section-toggle { color: var(--tm-text-disabled, #717171); transition: transform var(--tm-transition-normal, 150ms ease); }
    .tm-gcc-section.tm-expanded .tm-gcc-section-toggle { transform: rotate(180deg); }
    .tm-gcc-section-content { display: none; padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px); background: var(--tm-bg-primary, #0f0f0f); }
    .tm-gcc-section.tm-expanded .tm-gcc-section-content { display: block; }

    /* Field Rows */
    .tm-gcc-field { display: flex; padding: var(--tm-space-2, 8px) 0; border-bottom: 1px solid var(--tm-border-subtle, #303030); }
    .tm-gcc-field:last-child { border-bottom: none; }
    .tm-gcc-field-label {
      flex: 0 0 140px; font-size: var(--tm-font-xs, 11px); font-weight: 500;
      color: var(--tm-text-secondary, #aaaaaa); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .tm-gcc-field-value { flex: 1; font-size: var(--tm-font-sm, 12px); color: var(--tm-text-primary, #f1f1f1); word-break: break-word; }
    .tm-gcc-field-value.tm-null { color: var(--tm-text-disabled, #717171); font-style: italic; }

    /* No Results */
    .tm-gcc-no-results { padding: var(--tm-space-6, 24px); text-align: center; color: var(--tm-text-secondary, #aaaaaa); }
    .tm-gcc-no-results-icon { margin-bottom: var(--tm-space-3, 12px); color: var(--tm-text-disabled, #717171); }
    .tm-gcc-no-results-text { font-size: var(--tm-font-sm, 12px); }

    /* Raw JSON */
    .tm-gcc-json-btn {
      display: block; width: calc(100% - 32px);
      margin: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      padding: var(--tm-space-2, 8px);
      background: transparent; border: 1px solid var(--tm-border-default, #3f3f3f);
      border-radius: var(--tm-radius-sm, 4px);
      color: var(--tm-text-secondary, #aaaaaa); font-size: var(--tm-font-xs, 11px);
      cursor: pointer; transition: all var(--tm-transition-normal, 150ms ease); font-family: inherit;
    }
    .tm-gcc-json-btn:hover { background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-primary, #f1f1f1); }
    .tm-gcc-json-container {
      display: none; margin: 0 var(--tm-space-4, 16px) var(--tm-space-4, 16px);
      background: var(--tm-bg-primary, #0f0f0f); border: 1px solid var(--tm-border-subtle, #303030);
      border-radius: var(--tm-radius-sm, 4px); overflow: hidden;
    }
    .tm-gcc-json-container.tm-active { display: block; }
    .tm-gcc-json-header {
      display: flex; justify-content: flex-end; padding: var(--tm-space-2, 8px);
      background: var(--tm-bg-secondary, #1a1a1a); border-bottom: 1px solid var(--tm-border-subtle, #303030);
    }
    .tm-gcc-copy-btn {
      display: flex; align-items: center; gap: var(--tm-space-1, 4px);
      background: transparent; border: 1px solid var(--tm-border-default, #3f3f3f);
      border-radius: var(--tm-radius-sm, 4px); padding: var(--tm-space-1, 4px) var(--tm-space-2, 8px);
      color: var(--tm-text-secondary, #aaaaaa); font-size: var(--tm-font-xs, 11px);
      cursor: pointer; transition: all var(--tm-transition-fast, 100ms ease); font-family: inherit;
    }
    .tm-gcc-copy-btn:hover { background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-primary, #f1f1f1); }
    .tm-gcc-json-content { max-height: 250px; overflow: auto; padding: var(--tm-space-3, 12px); }
    .tm-gcc-json-content pre {
      margin: 0; font-family: 'Consolas','Monaco','Courier New',monospace;
      font-size: var(--tm-font-xs, 11px); color: var(--tm-text-secondary, #aaaaaa);
      white-space: pre-wrap; word-break: break-all;
    }

    /* Inline ASIN badges (injected into page) */
    .tm-gcc-inline-container { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; vertical-align: middle; }
    .tm-gcc-inline-asin {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid var(--tm-accent-primary, #3ea6ff); border-radius: 4px;
      font-family: 'Consolas','Monaco',monospace; font-size: 11px;
      color: var(--tm-accent-primary, #3ea6ff); text-decoration: none;
      cursor: pointer; transition: all 150ms ease;
    }
    .tm-gcc-inline-asin:hover {
      background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
      border-color: var(--tm-accent-hover, #65b8ff); color: var(--tm-accent-hover, #65b8ff);
      transform: translateY(-1px); box-shadow: 0 2px 8px rgba(62,166,255,0.3);
    }
    .tm-gcc-inline-asin-label { font-weight: 600; opacity: 0.7; }
    .tm-gcc-inline-asin-value { font-weight: 500; }

    .tm-gcc-inline-copy {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 6px; background: #1a1a1a; border: 1px solid #3f3f3f;
      border-radius: 4px; color: #aaaaaa; cursor: pointer; transition: all 150ms ease;
    }
    .tm-gcc-inline-copy:hover { background: #242424; border-color: #525252; color: #f1f1f1; }
    .tm-gcc-inline-copy.tm-copied { background: rgba(46,125,50,0.2); border-color: #66bb6a; color: #66bb6a; }
    .tm-gcc-inline-copy svg { width: 12px; height: 12px; }

    .tm-gcc-inline-loading {
      display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;
      padding: 2px 8px; background: #1a1a1a; border: 1px solid #3f3f3f;
      border-radius: 4px; font-size: 11px; color: #717171;
    }
    .tm-gcc-inline-spinner {
      width: 10px; height: 10px;
      border: 2px solid #3f3f3f; border-top-color: var(--tm-accent-primary, #3ea6ff);
      border-radius: 50%; animation: tm-gcc-spin 0.8s linear infinite;
    }
    .tm-gcc-inline-error {
      display: inline-flex; align-items: center; margin-left: 8px;
      padding: 2px 8px; background: rgba(211,47,47,0.1); border: 1px solid #d32f2f;
      border-radius: 4px; font-size: 11px; color: #ef5350;
    }

    /* Scan Page Button */
    .tm-gcc-scan-section {
      padding: var(--tm-space-3, 12px) var(--tm-space-4, 16px);
      border-bottom: 1px solid var(--tm-border-subtle, #303030);
      background: var(--tm-bg-secondary, #1a1a1a);
    }
    .tm-gcc-btn-secondary {
      width: 100%;
      background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-primary, #f1f1f1);
      border: 1px solid var(--tm-border-default, #3f3f3f); border-radius: var(--tm-radius-sm, 4px);
      padding: var(--tm-space-2, 8px) var(--tm-space-4, 16px);
      font-size: var(--tm-font-sm, 12px); font-weight: 500;
      cursor: pointer; transition: all var(--tm-transition-normal, 150ms ease); font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: var(--tm-space-2, 8px);
    }
    .tm-gcc-btn-secondary:hover { background: var(--tm-bg-elevated, #2d2d2d); border-color: var(--tm-border-strong, #525252); }
    .tm-gcc-btn-secondary:disabled { background: var(--tm-bg-tertiary, #242424); color: var(--tm-text-disabled, #717171); cursor: not-allowed; }
    .tm-gcc-scan-status { margin-top: var(--tm-space-2, 8px); font-size: var(--tm-font-xs, 11px); color: var(--tm-text-secondary, #aaaaaa); text-align: center; }
    .tm-gcc-scan-status.tm-success { color: #66bb6a; }
    .tm-gcc-scan-status.tm-error { color: #ef5350; }

    /* Focus styles */
    .tm-gcc-container *:focus-visible { outline: 2px solid var(--tm-accent-primary, #3ea6ff); outline-offset: 2px; }
  `;

  // ------------------------------------------------------------------
  //  INJECT STYLES (via TmTheme or fallback)
  // ------------------------------------------------------------------
  function injectCSS() {
    if (window.TmTheme && window.TmTheme.injectStyle) {
      window.TmTheme.injectStyle('tm-gcc-styles', CSS);
    } else {
      if (document.getElementById('tm-gcc-styles')) return;
      const el = document.createElement('style');
      el.id = 'tm-gcc-styles';
      el.textContent = CSS;
      document.head.appendChild(el);
    }
  }

  // ------------------------------------------------------------------
  //  HELPERS
  // ------------------------------------------------------------------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function getLocalizedValue(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    const enUS = arr.find(item => item.languageTag === 'en_US');
    return enUS ? enUS.value : arr[0]?.value;
  }

  function getValueFromArray(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr[0]?.value;
  }

  function formatAlcoholContent(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    const content = arr[0];
    return content ? `${content.value}% ${content.unit || ''}` : null;
  }

  function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return dateStr; }
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return null;
    try {
      return new Date(parseInt(timestamp)).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return timestamp; }
  }

  function renderField(label, value) {
    const displayValue = value !== null && value !== undefined ? String(value) : null;
    const valueClass = displayValue ? '' : 'tm-null';
    const displayText = displayValue || 'N/A';
    return `<div class="tm-gcc-field"><span class="tm-gcc-field-label">${escapeHtml(label)}</span><span class="tm-gcc-field-value ${valueClass}">${escapeHtml(displayText)}</span></div>`;
  }

  function parseScanCodes(input) {
    return input.split(/[\s,]+/).map(c => c.trim()).filter(c => c.length > 0);
  }

  // ------------------------------------------------------------------
  //  API FETCH (uses standard fetch with credentials)
  // ------------------------------------------------------------------
  async function fetchItemData(scanCodes) {
    const orConditions = scanCodes.map(code => ({ key: 'merchant_sku', operation: { eq: code } }));
    const body = {
      query: GRAPHQL_QUERY,
      variables: {
        getItemsInput: {
          context: { marketplaceId: '199920', clientId: 'WFM_LISTING_PORTAL', profileId: 'wfm_retail', userId: '00001' },
          query: { or: orConditions },
          paginationInfo: { offset: '0', limit: Math.max(10, scanCodes.length * 2), paginationType: 'OFFSET_BASED_PAGINATION' }
        }
      }
    };

    console.log(LOG_PREFIX, 'Fetching item data for', scanCodes.length, 'code(s)');

    // Use GM_xmlhttpRequest to bypass CORS (requires @grant GM_xmlhttpRequest + @connect)
    return new Promise(function (resolve, reject) {
      if (typeof GM_xmlhttpRequest === 'undefined') {
        reject(new Error('GM_xmlhttpRequest not available. Check that @grant GM_xmlhttpRequest is set in the userscript header.'));
        return;
      }
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://grocerycentral.amazon.dev/frontdesk',
        headers: { 'Accept': '*/*', 'Content-Type': 'text/plain;charset=UTF-8' },
        data: JSON.stringify(body),
        anonymous: false,  // send cookies
        onload: function (res) {
          if (res.status >= 200 && res.status < 300) {
            try { resolve(JSON.parse(res.responseText)); }
            catch (e) { reject(new Error('Failed to parse GCC response: ' + e.message)); }
          } else {
            reject(new Error('HTTP ' + res.status + ': ' + res.statusText));
          }
        },
        onerror: function (err) { reject(new Error('GM_xmlhttpRequest network error')); },
        ontimeout: function () { reject(new Error('GM_xmlhttpRequest timed out')); }
      });
    });
  }

  // ------------------------------------------------------------------
  //  UI CREATION
  // ------------------------------------------------------------------
  function createUI() {
    console.log(LOG_PREFIX, 'Creating Grocery Central Connect panel');

    const container = document.createElement('div');
    container.className = 'tm-gcc-container';
    container.innerHTML = `
      <button class="tm-gcc-toggle" title="Grocery Central Connect">${ICONS.database}</button>
      <div class="tm-gcc-panel">
        <div class="tm-gcc-header">
          <h3 class="tm-gcc-title">Grocery Central Connect
            <span class="tm-gcc-info-icon" tabindex="0" title="Usage info">${ICONS.info}</span>
          </h3>
          <button class="tm-gcc-close" title="Close">${ICONS.close}</button>
        </div>
        <div class="tm-gcc-info-box" style="display:none;">
          <div style="font-weight:600;margin-bottom:6px;color:var(--tm-text-primary, #f1f1f1);">Before using Grocery Central Connect:</div>
          <ol style="margin:0 0 0 18px;padding:0;font-size:13px;line-height:1.6;color:var(--tm-text-secondary, #aaaaaa);">
            <li>Open <a href="https://grocerycentral.amazon.dev" target="_blank" rel="noopener noreferrer" style="color:var(--tm-accent-primary, #3ea6ff);">grocerycentral.amazon.dev</a> in another tab and sign in.</li>
            <li>This establishes the authentication cookie needed for API calls.</li>
            <li>Return here and search by scan code / PLU, or use "Scan Page for ASINs".</li>
          </ol>
          <div style="margin-top:8px;font-size:12px;color:var(--tm-text-disabled, #717171);">You only need to do this once per browser session.</div>
        </div>
        <div class="tm-gcc-search">
          <label class="tm-gcc-label">Scan Code(s) / PLU(s)</label>
          <div class="tm-gcc-input-row">
            <input type="text" class="tm-gcc-input" placeholder="Enter scan codes (comma or space separated)">
            <button class="tm-gcc-btn-primary tm-gcc-search-btn">Search</button>
          </div>
          <div class="tm-gcc-input-hint">Tip: Enter multiple codes separated by commas or spaces</div>
        </div>
        <div class="tm-gcc-scan-section">
          <button class="tm-gcc-btn-secondary tm-gcc-scan-btn">${ICONS.search} Scan Page for ASINs</button>
          <div class="tm-gcc-scan-status"></div>
        </div>
        <div class="tm-gcc-results-section">
          <div class="tm-gcc-loading"><div class="tm-gcc-spinner"></div><div>Fetching item data</div></div>
          <div class="tm-gcc-error"></div>
          <div class="tm-gcc-results"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Wire events
    container.querySelector('.tm-gcc-toggle').addEventListener('click', togglePanel);
    container.querySelector('.tm-gcc-close').addEventListener('click', togglePanel);
    container.querySelector('.tm-gcc-search-btn').addEventListener('click', performSearch);

    // Info icon toggle
    const infoIcon = container.querySelector('.tm-gcc-info-icon');
    const infoBox = container.querySelector('.tm-gcc-info-box');
    if (infoIcon && infoBox) {
      infoIcon.addEventListener('click', function () {
        infoBox.style.display = infoBox.style.display === 'none' ? 'block' : 'none';
      });
      infoIcon.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          infoBox.style.display = infoBox.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
    container.querySelector('.tm-gcc-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    container.querySelector('.tm-gcc-scan-btn').addEventListener('click', scanPageForAsins);

    console.log(LOG_PREFIX, 'Panel created');
  }

  // ------------------------------------------------------------------
  //  PANEL TOGGLE
  // ------------------------------------------------------------------
  function togglePanel() {
    const panel = document.querySelector('.tm-gcc-panel');
    panel.classList.toggle('tm-active');
    if (panel.classList.contains('tm-active')) {
      document.querySelector('.tm-gcc-input').focus();
    }
  }

  // ------------------------------------------------------------------
  //  SEARCH
  // ------------------------------------------------------------------
  async function performSearch() {
    const input = document.querySelector('.tm-gcc-input');
    const rawInput = input.value.trim();
    if (!rawInput) { showError('Please enter at least one scan code'); return; }

    const scanCodes = parseScanCodes(rawInput);
    if (scanCodes.length === 0) { showError('Please enter at least one valid scan code'); return; }

    const searchBtn = document.querySelector('.tm-gcc-search-btn');
    const loading = document.querySelector('.tm-gcc-loading');
    const error = document.querySelector('.tm-gcc-error');
    const results = document.querySelector('.tm-gcc-results');

    searchBtn.disabled = true;
    loading.classList.add('tm-active');
    error.classList.remove('tm-active');
    results.classList.remove('tm-active');
    results.innerHTML = '';

    try {
      const response = await fetchItemData(scanCodes);
      displayResults(response, scanCodes);
    } catch (err) {
      console.error(LOG_PREFIX, 'Search failed:', err);
      showError(err.message || 'Failed to fetch item data');
    } finally {
      searchBtn.disabled = false;
      loading.classList.remove('tm-active');
    }
  }

  function showError(message) {
    const error = document.querySelector('.tm-gcc-error');
    error.textContent = message;
    error.classList.add('tm-active');
  }

  // ------------------------------------------------------------------
  //  DISPLAY RESULTS
  // ------------------------------------------------------------------
  function displayResults(data, queriedCodes) {
    const results = document.querySelector('.tm-gcc-results');
    const items = data?.data?.getItems?.items;

    if (!items || items.length === 0) {
      const codeText = queriedCodes.length === 1 ? 'this scan code' : 'these scan codes';
      results.innerHTML = `<div class="tm-gcc-no-results"><div class="tm-gcc-no-results-icon">${ICONS.searchEmpty}</div><div class="tm-gcc-no-results-text">No items found for ${codeText}</div></div>`;
      results.classList.add('tm-active');
      return;
    }

    const foundCodes = items.map(item => item.identity?.scanCode).filter(Boolean);
    const missingCodes = queriedCodes.filter(code => !foundCodes.includes(code));
    let html = '';

    if (queriedCodes.length > 1) {
      html += `<div class="tm-gcc-results-summary">Found <strong>${items.length}</strong> item${items.length !== 1 ? 's' : ''} for <strong>${queriedCodes.length}</strong> queried code${queriedCodes.length !== 1 ? 's' : ''}`;
      if (missingCodes.length > 0) html += `<br>Not found: <strong>${missingCodes.join(', ')}</strong>`;
      html += `</div>`;
    }

    items.forEach((item, index) => {
      const fields = item.payload?.fields || {};
      const identity = item.identity || {};
      const metadata = item.payload?.metadata || {};
      const itemName = getLocalizedValue(fields.itemName) || fields.customerFriendlyItemName || 'Unknown Item';
      const brand = getLocalizedValue(fields.brand) || fields.brandAbbreviation || 'N/A';
      const scanCode = identity.scanCode || 'N/A';
      const asin = identity.asin || 'N/A';
      const isActive = fields.inactive === false;
      const jsonStr = escapeHtml(JSON.stringify(item, null, 2));

      html += `
        <div class="tm-gcc-item-card">
          <div class="tm-gcc-item-header">
            <h4 class="tm-gcc-item-title">${escapeHtml(itemName)}</h4>
            <p class="tm-gcc-item-meta">
              <span>Scan: <strong>${escapeHtml(scanCode)}</strong></span>
              <span>ASIN: <strong>${escapeHtml(asin)}</strong></span>
              <span class="tm-gcc-badge ${isActive ? 'tm-gcc-badge-active' : 'tm-gcc-badge-inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
            </p>
          </div>

          <div class="tm-gcc-section tm-expanded">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.package} Basic Information</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('Brand', brand)}
              ${renderField('Description', fields.productDescription)}
              ${renderField('POS Desc', fields.productPosDescription)}
              ${renderField('Size', getLocalizedValue(fields.size))}
              ${renderField('Retail Size', fields.productRetailSize)}
              ${renderField('UOM', fields.wfmUom)}
              ${renderField('Product Type', getValueFromArray(fields.productType))}
              ${renderField('Item Type', fields.detailedItemType)}
            </div>
          </div>

          <div class="tm-gcc-section">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.tag} Pricing</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('Price Line', fields.priceLine)}
              ${renderField('Price Line Desc', fields.priceLineDescription)}
              ${renderField('PLU Code', getValueFromArray(fields.priceLookupCode))}
              ${renderField('Tax Class', fields.productTaxClass)}
              ${renderField('Tax Class ID', fields.productTaxClassId)}
              ${renderField('No Discount', fields.prohibitDiscount)}
              ${renderField('WIC', fields.wic)}
            </div>
          </div>

          <div class="tm-gcc-section">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.folder} Hierarchy</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('Merch Hierarchy', fields.merchandiseHierarchy)}
              ${renderField('Natl Hierarchy', fields.nationalHierarchy)}
              ${renderField('Merch Class ID', fields.merchandiseClassId)}
              ${renderField('Natl Class ID', fields.nationalClassId)}
              ${renderField('Brand Class ID', fields.brandClassId)}
              ${renderField('Subteam', fields.productSubteam)}
              ${renderField('Subteam No', fields.productSubteamNumber)}
            </div>
          </div>

          <div class="tm-gcc-section">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.thermometer} Storage</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('Temp Zone', fields.merchandisingTempZone)}
              ${renderField('Package Group', fields.packageGroup)}
              ${renderField('Package Type', fields.packageGroupType)}
              ${renderField('Total Eaches', getValueFromArray(fields.totalEaches))}
              ${renderField('Num Items', getValueFromArray(fields.numberOfItems))}
            </div>
          </div>

          ${fields.wfmAlcohol ? `
          <div class="tm-gcc-section">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.wine} Alcohol</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('ABV', fields.wfmAlcohol + '%')}
              ${renderField('Beer Style', fields.wfmBeerStyle)}
              ${renderField('Content', formatAlcoholContent(fields.alcoholContent))}
            </div>
          </div>` : ''}

          <div class="tm-gcc-section">
            <div class="tm-gcc-section-header" data-gcc-toggle>
              <span class="tm-gcc-section-title">${ICONS.info} Metadata</span>
              <span class="tm-gcc-section-toggle">${ICONS.chevronDown}</span>
            </div>
            <div class="tm-gcc-section-content">
              ${renderField('Data Source', fields.dataSource)}
              ${renderField('Rich Data', fields.richDataStatus)}
              ${renderField('Dimensions', fields.dimensionsDataSource)}
              ${renderField('SNIP ID', fields.snipid)}
              ${renderField('Created', formatDate(fields.wfmProductCreatedOn))}
              ${renderField('Launch Date', formatDate(getValueFromArray(fields.productSiteLaunchDate)))}
              ${renderField('Updated', formatTimestamp(metadata.lastUpdateTime))}
            </div>
          </div>

          <button class="tm-gcc-json-btn" data-gcc-json="${index}">Show Raw JSON</button>
          <div id="tm-gcc-json-${index}" class="tm-gcc-json-container">
            <div class="tm-gcc-json-header">
              <button class="tm-gcc-copy-btn" data-gcc-copy="${index}">${ICONS.copy} Copy</button>
            </div>
            <div class="tm-gcc-json-content"><pre>${jsonStr}</pre></div>
          </div>
        </div>`;
    });

    results.innerHTML = html;
    results.classList.add('tm-active');

    // Wire section toggles (no inline onclick)
    results.querySelectorAll('[data-gcc-toggle]').forEach(header => {
      header.addEventListener('click', () => header.parentElement.classList.toggle('tm-expanded'));
    });

    // Wire JSON toggle buttons
    results.querySelectorAll('[data-gcc-json]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-gcc-json');
        const container = document.getElementById('tm-gcc-json-' + idx);
        container.classList.toggle('tm-active');
        btn.textContent = container.classList.contains('tm-active') ? 'Hide Raw JSON' : 'Show Raw JSON';
      });
    });

    // Wire copy buttons
    results.querySelectorAll('[data-gcc-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-gcc-copy');
        const pre = document.querySelector('#tm-gcc-json-' + idx + ' pre');
        navigator.clipboard.writeText(pre.textContent).then(() => { btn.innerHTML = 'Copied'; });
      });
    });
  }

  // ------------------------------------------------------------------
  //  PAGE SCANNING
  // ------------------------------------------------------------------
  const processedElements = new WeakSet();

  function scanPageForAsins() {
    const scanBtn = document.querySelector('.tm-gcc-scan-btn');
    const statusEl = document.querySelector('.tm-gcc-scan-status');
    scanBtn.disabled = true;
    statusEl.textContent = 'Scanning page...';
    statusEl.className = 'tm-gcc-scan-status';

    const pluElements = findPluElements();
    if (pluElements.length === 0) {
      statusEl.textContent = 'No PLU/UPC codes found on page';
      statusEl.className = 'tm-gcc-scan-status tm-error';
      scanBtn.disabled = false;
      return;
    }

    const scanCodeToElement = new Map();
    pluElements.forEach(({ element, scanCode }) => {
      if (processedElements.has(element)) return;
      if (!scanCodeToElement.has(scanCode)) scanCodeToElement.set(scanCode, element);
    });

    const uniqueCodes = Array.from(scanCodeToElement.keys());
    if (uniqueCodes.length === 0) {
      statusEl.textContent = 'All items on page already have ASINs';
      statusEl.className = 'tm-gcc-scan-status tm-success';
      scanBtn.disabled = false;
      return;
    }

    statusEl.textContent = `Found ${uniqueCodes.length} unique code(s), fetching ASINs...`;
    console.log(LOG_PREFIX, 'Scanning', uniqueCodes.length, 'codes');

    // Loading indicators
    scanCodeToElement.forEach((el, scanCode) => {
      if (el.querySelector('.tm-gcc-inline-asin, .tm-gcc-inline-loading, .tm-gcc-inline-error')) return;
      const loader = document.createElement('span');
      loader.className = 'tm-gcc-inline-loading';
      loader.setAttribute('data-gcc-scancode', scanCode);
      loader.innerHTML = '<span class="tm-gcc-inline-spinner"></span> Loading...';
      el.appendChild(loader);
    });

    fetchItemData(uniqueCodes)
      .then(response => {
        const items = response?.data?.getItems?.items || [];
        const asinMap = new Map();
        items.forEach(item => {
          const sc = item.identity?.scanCode;
          const asin = item.identity?.asin;
          if (sc && asin) asinMap.set(sc, asin);
        });

        scanCodeToElement.forEach((el, scanCode) => {
          const loader = el.querySelector('.tm-gcc-inline-loading');
          if (loader) loader.remove();
          if (el.querySelector('.tm-gcc-inline-asin, .tm-gcc-inline-error')) return;

          const asin = asinMap.get(scanCode);
          if (asin) {
            const container = document.createElement('span');
            container.className = 'tm-gcc-inline-container';

            // Copy PLU button
            const copyPluBtn = document.createElement('button');
            copyPluBtn.className = 'tm-gcc-inline-copy';
            copyPluBtn.title = 'Copy PLU';
            copyPluBtn.innerHTML = '<span style="font-size:10px;font-weight:500;">PLU</span>';
            copyPluBtn.addEventListener('click', (e) => {
              e.preventDefault(); e.stopPropagation();
              navigator.clipboard.writeText(scanCode).then(() => {
                copyPluBtn.classList.add('tm-copied');
                copyPluBtn.innerHTML = '&#10003;';
                setTimeout(() => { copyPluBtn.classList.remove('tm-copied'); copyPluBtn.innerHTML = '<span style="font-size:10px;font-weight:500;">PLU</span>'; }, 1500);
              });
            });

            // ASIN link badge
            const badge = document.createElement('a');
            badge.className = 'tm-gcc-inline-asin';
            badge.href = `https://www.wholefoodsmarket.com/product/dp/${asin}?pd_rd_i=${asin}&fpw=alm&almBrandId=aNHVc2Akvg`;
            badge.target = '_blank';
            badge.rel = 'noopener noreferrer';
            badge.title = `View on Whole Foods: ${asin}`;
            badge.innerHTML = `<span class="tm-gcc-inline-asin-label">ASIN:</span> <span class="tm-gcc-inline-asin-value">${escapeHtml(asin)}</span>`;

            // Copy ASIN button
            const copyAsinBtn = document.createElement('button');
            copyAsinBtn.className = 'tm-gcc-inline-copy';
            copyAsinBtn.title = 'Copy ASIN';
            copyAsinBtn.innerHTML = ICONS.copy;
            copyAsinBtn.addEventListener('click', (e) => {
              e.preventDefault(); e.stopPropagation();
              navigator.clipboard.writeText(asin).then(() => {
                copyAsinBtn.classList.add('tm-copied');
                copyAsinBtn.innerHTML = '&#10003;';
                setTimeout(() => { copyAsinBtn.classList.remove('tm-copied'); copyAsinBtn.innerHTML = ICONS.copy; }, 1500);
              });
            });

            container.appendChild(copyPluBtn);
            container.appendChild(badge);
            container.appendChild(copyAsinBtn);
            el.appendChild(container);
          } else {
            const errorBadge = document.createElement('span');
            errorBadge.className = 'tm-gcc-inline-error';
            errorBadge.textContent = 'ASIN not found';
            el.appendChild(errorBadge);
          }
          processedElements.add(el);
        });

        statusEl.textContent = `Done! Found ${asinMap.size} ASIN(s) for ${uniqueCodes.length} code(s)`;
        statusEl.className = 'tm-gcc-scan-status tm-success';
        scanBtn.disabled = false;
        console.log(LOG_PREFIX, 'Scan complete:', asinMap.size, 'ASINs found');
      })
      .catch(err => {
        console.error(LOG_PREFIX, 'Scan failed:', err);
        scanCodeToElement.forEach((el) => {
          const loader = el.querySelector('.tm-gcc-inline-loading');
          if (loader) {
            const errorBadge = document.createElement('span');
            errorBadge.className = 'tm-gcc-inline-error';
            errorBadge.textContent = 'Error';
            loader.replaceWith(errorBadge);
            processedElements.add(el);
          }
        });
        statusEl.textContent = `Error: ${err.message}`;
        statusEl.className = 'tm-gcc-scan-status tm-error';
        scanBtn.disabled = false;
      });
  }

  // ------------------------------------------------------------------
  //  FIND PLU ELEMENTS ON PAGE
  // ------------------------------------------------------------------
  function findPluElements() {
    const results = [];
    const seenElements = new Set();

    function addResult(element, scanCode) {
      if (seenElements.has(element)) return;
      if (element.querySelector('.tm-gcc-inline-asin, .tm-gcc-inline-loading, .tm-gcc-inline-error')) return;
      seenElements.add(element);
      results.push({ element, scanCode });
    }

    // Strategy 1: Item links with scan codes in URL
    document.querySelectorAll('a[href*="/item/"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/item\/(\d+)/);
      if (match) {
        const container = link.closest('td') || link.parentElement;
        if (container) addResult(container, match[1]);
      }
    });

    // Strategy 2: PLU/UPC display elements (list view)
    document.querySelectorAll('.text-gray-600').forEach(el => {
      const text = el.textContent || '';
      if (text.includes('PLU') || text.includes('UPC')) {
        const matches = text.match(/\b(\d{5,14})\b/g);
        if (matches && matches.length > 0) addResult(el, matches[matches.length - 1]);
      }
    });

    // Strategy 3: Item detail page - flex container with PLU/UPC label
    document.querySelectorAll('.flex').forEach(flexContainer => {
      const children = flexContainer.children;
      if (children.length >= 2) {
        const firstChild = children[0];
        const secondChild = children[1];
        if (firstChild.classList.contains('font-bold') && firstChild.textContent.trim() === 'PLU/UPC') {
          const scanCode = secondChild.textContent.trim();
          if (/^\d{5,14}$/.test(scanCode)) addResult(flexContainer, scanCode);
        }
      }
    });

    return results;
  }

  // ------------------------------------------------------------------
  //  INITIALIZE
  // ------------------------------------------------------------------
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

  // ------------------------------------------------------------------
  //  WIRE MENU BUTTON (from GeneralHelpTools)
  // ------------------------------------------------------------------
  function wireMenuButton() {
    const menuBtn = document.getElementById('groceryCentralConnectButton');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        // Close the help tools overlay first
        const helpOverlay = document.getElementById('generalHelpOverlay');
        if (helpOverlay) helpOverlay.style.display = 'none';
        // Toggle GCC panel
        const panel = document.querySelector('.tm-gcc-panel');
        if (panel) {
          panel.classList.add('tm-active');
          const input = document.querySelector('.tm-gcc-input');
          if (input) input.focus();
        }
      });
      return true;
    }
    return false;
  }
  // Try immediately, or watch for DOM changes
  if (!wireMenuButton()) {
    const obs = new MutationObserver(() => { if (wireMenuButton()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ------------------------------------------------------------------
  //  MODULE EXPORT (for testing)
  // ------------------------------------------------------------------
  try {
    module.exports = { fetchItemData, findPluElements };
  } catch (e) {
    // Browser environment
  }
})();
} catch (e) {
  console.error('[CAM_Tools] Module GroceryCentralConnect.js failed to initialize:', e);
}

/* ================================================================
 * MODULE: mainCore.js
 * ================================================================ */
try {
/**
 * mainCore.js -- Core bootstrap extracted from the legacy MainScript.user.js body.
 * Tracks registered event listeners and re-attaches them when the SPA
 * re-renders nodes. Runs LAST in the bundle (after all modules).
 */
(function () {
    'use strict';
    console.log("MainScript Started - loading buttons");

    const eventListeners = [];

    function addEventListenerWithTracking(target, type, listener, options) {
        try {
            target.addEventListener(type, listener, options);
            eventListeners.push({ target, type, listener, options });
        } catch (error) {
            console.error(`Error adding event listener: ${error.message}`, { target, type, listener, options });
        }
    }

    try {
        const observer = new MutationObserver((mutationsList) => {
            // Only restore event listeners for added nodes that match tracked targets
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    eventListeners.forEach(({ target, type, listener, options }) => {
                        // If the added node is the target, or contains the target, restore the listener
                        if (node === target || (node.contains && node.contains(target))) {
                            try {
                                target.addEventListener(type, listener, options);
                            } catch (error) {
                                console.error(`Error restoring event listener: ${error.message}`, { target, type, listener, options });
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
        console.error(`Error setting up MutationObserver: ${error.message}`);
    }

    // Exposed for any module that wants tracked listeners
    try {
        window.CAM_addEventListenerWithTracking = addEventListenerWithTracking;
    } catch (e) { /* ignore */ }

    // Module export for testing
    try {
        module.exports = { addEventListenerWithTracking };
    } catch (e) {
        // Browser environment
    }
})();
} catch (e) {
  console.error('[CAM_Tools] Module mainCore.js failed to initialize:', e);
}

console.log('[CAM_Tools] Bundle v4.0.2 loaded (24 modules)');
