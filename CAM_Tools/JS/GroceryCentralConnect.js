/**
 * GroceryCentralConnect.js -- Query Grocery Central API for item metadata by scan code
 * Uses fetch() instead of GM_xmlhttpRequest (compatible with @grant none).
 * NOTE: If fetch fails due to CORS, the standalone userscript with GM_xmlhttpRequest
 *       is needed instead. Both *.amazon.dev domains typically allow cross-origin.
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
    .tm-gcc-title { font-size: var(--tm-font-md, 16px); font-weight: 600; margin: 0; color: var(--tm-text-primary, #f1f1f1); }
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

    const response = await fetch('https://grocerycentral.amazon.dev/frontdesk', {
      method: 'POST',
      headers: { 'Accept': '*/*', 'Content-Type': 'text/plain;charset=UTF-8' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
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
          <h3 class="tm-gcc-title">Grocery Central Connect</h3>
          <button class="tm-gcc-close" title="Close">${ICONS.close}</button>
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
  //  MODULE EXPORT (for testing)
  // ------------------------------------------------------------------
  try {
    module.exports = { fetchItemData, findPluElements };
  } catch (e) {
    // Browser environment
  }
})();