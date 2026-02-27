/**
 * tm-theme.js -- Shared CSS Variable Injector & Theme Engine
 * -----------------------------------------------------------
 * Injects the --tm-* design-token block defined in Anti-AI_Style-Guide.md
 * into <head> exactly once, before any module renders.
 *
 * Also provides:
 *   - Accent theme toggle (blue / red) persisted via localStorage
 *   - A one-shot style-tag helper other modules can reuse
 *   - A shared toast notification primitive (replaces alert())
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
    blue:  { primary: '#3ea6ff', hover: '#65b8ff' },
    red:   { primary: '#ff0000', hover: '#ff3333' },
    green: { primary: '#00a650', hover: '#2ebe6a' }
  };

  const SETTINGS_KEY = 'cam_tools_settings';

  function readAccent() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return ACCENT_THEMES[settings.accentTheme] ? settings.accentTheme : 'blue';
    } catch {
      return 'blue';
    }
  }

  // ----------------------------------------------------------------
  //  CSS VARIABLE BLOCK  (from Anti-AI_Style-Guide.md :root template)
  // ----------------------------------------------------------------
  function buildVarBlock(accent) {
    const t = ACCENT_THEMES[accent] || ACCENT_THEMES.blue;
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

/* ---- Toggle ---- */
.tm-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--tm-border-default);
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--tm-transition-normal);
  border: none;
  padding: 0;
}
.tm-toggle.active { background: var(--tm-accent-primary); }
.tm-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--tm-text-primary);
  border-radius: 50%;
  transition: transform var(--tm-transition-normal);
}
.tm-toggle.active::after { transform: translateX(16px); }

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
   * @param {'blue'|'red'} accent
   */
  function setAccent(accent) {
    if (!ACCENT_THEMES[accent]) return;
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      settings.accentTheme = accent;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch { /* storage unavailable */ }
    // Hot-swap the two accent variables without full re-inject
    const root = document.documentElement;
    root.style.setProperty('--tm-accent-primary', ACCENT_THEMES[accent].primary);
    root.style.setProperty('--tm-accent-hover', ACCENT_THEMES[accent].hover);
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
  //  EXPOSE
  // ----------------------------------------------------------------
  window.TmTheme = {
    setAccent: setAccent,
    getAccent: getAccent,
    injectStyle: injectStyle,
    showToast: showToast,
    ACCENT_THEMES: ACCENT_THEMES
  };

  // Module export for testing
  try {
    module.exports = {
      setAccent: setAccent,
      getAccent: getAccent,
      injectStyle: injectStyle,
      showToast: showToast,
      ACCENT_THEMES: ACCENT_THEMES
    };
  } catch (e) {
    // Browser environment
  }
})();
