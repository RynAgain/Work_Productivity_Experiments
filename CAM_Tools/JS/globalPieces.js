/**
 * globalPieces.js -- Shared styles and overlay template
 * Uses --tm-* design tokens from tm-theme.js
 */
(function () {
  'use strict';

  // ----------------------------------------------------------------
  //  SHARED STYLES (dark-mode-first, using --tm-* tokens)
  // ----------------------------------------------------------------
  const styles = `
    .tm-input-field {
      font-family: var(--tm-font-family);
      font-size: var(--tm-font-md);
      padding: var(--tm-space-2);
      border: 1px solid var(--tm-border-default);
      border-radius: var(--tm-radius-sm);
      width: 100%;
      box-sizing: border-box;
      background: var(--tm-bg-primary);
      color: var(--tm-text-primary);
      transition: border-color var(--tm-transition-normal),
                  box-shadow var(--tm-transition-normal);
    }
    .tm-input-field:focus {
      border-color: var(--tm-accent-primary);
      box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.25);
      outline: none;
    }
    .tm-input-field::placeholder {
      color: var(--tm-text-disabled);
    }
    .tm-button {
      font-family: var(--tm-font-family);
      font-size: var(--tm-font-base);
      padding: 10px 20px;
      border: none;
      border-radius: var(--tm-radius-sm);
      background: var(--tm-accent-primary);
      color: var(--tm-bg-primary);
      font-weight: 500;
      cursor: pointer;
      transition: background var(--tm-transition-normal);
    }
    .tm-button:hover {
      background: var(--tm-accent-hover);
    }
    /* Legacy alias -- modules still referencing .button will pick up new styles */
    .button {
      font-family: var(--tm-font-family);
      font-size: var(--tm-font-base);
      padding: 10px 20px;
      border: none;
      border-radius: var(--tm-radius-sm);
      background: var(--tm-accent-primary);
      color: var(--tm-bg-primary);
      font-weight: 500;
      cursor: pointer;
      transition: background var(--tm-transition-normal);
    }
    .button:hover {
      background: var(--tm-accent-hover);
    }
    .tm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: var(--tm-z-modal);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    /* Legacy alias */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: var(--tm-z-modal);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .tm-form-container {
      position: relative;
      background: var(--tm-bg-secondary);
      padding: var(--tm-space-5);
      border-radius: var(--tm-radius-md);
      width: 300px;
      border: 1px solid var(--tm-border-subtle);
      color: var(--tm-text-primary);
    }
    /* Legacy alias */
    .form-container {
      position: relative;
      background: var(--tm-bg-secondary);
      padding: var(--tm-space-5);
      border-radius: var(--tm-radius-md);
      width: 300px;
      border: 1px solid var(--tm-border-subtle);
      color: var(--tm-text-primary);
    }
    .tm-close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 24px;
      cursor: pointer;
      color: var(--tm-text-secondary);
      background: transparent;
      border: none;
      padding: var(--tm-space-1);
      border-radius: var(--tm-radius-sm);
      transition: color var(--tm-transition-fast);
    }
    .tm-close-button:hover {
      color: var(--tm-text-primary);
    }
    /* Legacy alias */
    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 24px;
      cursor: pointer;
      color: var(--tm-text-secondary);
      background: transparent;
      border: none;
      padding: var(--tm-space-1);
      border-radius: var(--tm-radius-sm);
      transition: color var(--tm-transition-fast);
    }
    .close-button:hover {
      color: var(--tm-text-primary);
    }
  `;

  // ----------------------------------------------------------------
  //  INJECT STYLES (deduplicated via tm-theme helper or fallback)
  // ----------------------------------------------------------------
  function injectStyles() {
    if (window.TmTheme && window.TmTheme.injectStyle) {
      window.TmTheme.injectStyle('tm-global-pieces', styles);
    } else {
      // Fallback if tm-theme.js hasn't loaded
      if (document.getElementById('tm-global-pieces')) return;
      const styleElement = document.createElement('style');
      styleElement.id = 'tm-global-pieces';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
  }

  // ----------------------------------------------------------------
  //  OVERLAY TEMPLATE
  // ----------------------------------------------------------------
  function overlayTemplate(content) {
    return `
      <div class="tm-overlay overlay">
        <div class="tm-form-container form-container">
          <button class="tm-close-button close-button" aria-label="Close">&times;</button>
          ${content}
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------------------
  //  EXPOSE ON WINDOW (deprecated -- use TmTheme.injectStyle instead)
  //  Kept as thin wrappers for backward compat until all consumers migrate.
  // ----------------------------------------------------------------
  window.injectStyles = injectStyles;
  window.overlayTemplate = overlayTemplate;

  // ----------------------------------------------------------------
  //  MODULE EXPORT (for testing)
  // ----------------------------------------------------------------
  try {
    module.exports = {
      injectStyles: injectStyles,
      overlayTemplate: overlayTemplate
    };
  } catch (e) {
    // Browser environment
  }
})();
