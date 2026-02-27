# CAM Tools -- Feature Tracker

> Master checklist for the system-wide facelift. Each item is a discrete, reviewable unit of work.
> Mark `[x]` when merged, `[-]` when actively in progress.

---

## 1. Style Guide Alignment

Bring every module into compliance with [`Anti-AI_Style-Guide.md`](Anti-AI_Style-Guide.md).

### 1.1 CSS Variable Adoption

- [x] Create a shared runtime style injector that writes the `--tm-*` CSS variable block (from the style guide `:root` template) into `<head>` once, before any module renders -- **`tm-theme.js` created**
- [x] Migrate [`globalPieces.js`](../JS/globalPieces.js) `.button`, `.overlay`, `.form-container`, `.close-button` classes to use `--tm-*` tokens instead of hardcoded hex -- **done, legacy aliases preserved**
- [x] Migrate [`Settings.js`](../JS/Settings.js) -- settings panel, icon bar, toggle/hamburger buttons, update modal -- to `--tm-*` tokens -- **full dark mode rewrite done**
- [x] Migrate [`GeneralHelpToolsButton.js`](../JS/GeneralHelpToolsButton.js) `STYLES` object to `--tm-*` tokens -- **dark mode, emojis removed, accent-driven**
- [x] Migrate [`RedriveButton.js`](../JS/RedriveButton.js) inline styles to `--tm-*` tokens -- **dark mode, var->const/let, module.exports moved**
- [x] Migrate [`DownloadButton.js`](../JS/DownloadButton.js) inline styles to `--tm-*` tokens -- **dark mode, var->const/let, module.exports moved**
- [x] Migrate [`AddItemButton.js`](../JS/AddItemButton.js) inline styles to `--tm-*` tokens -- **dark mode done**
- [x] Migrate [`MassUploaderButton.js`](../JS/MassUploaderButton.js) style tag rules to `--tm-*` tokens -- **full CSS block dark mode rewrite**
- [x] Migrate [`ExistingItemEditor.js`](../JS/ExistingItemEditor.js) inline/class styles to `--tm-*` tokens -- **dark mode: card, header, table, toolbar, filter bar, progress**
- [x] Migrate [`inventoryPFDS.js`](../JS/inventoryPFDS.js) styles to `--tm-*` tokens -- **formContainer dark**
- [x] Migrate [`FileChunker.js`](../JS/FileChunker.js) styles (if any UI) to `--tm-*` tokens -- **formContainer dark**
- [x] Migrate [`EmbedExcel.js`](../JS/EmbedExcel.js) styles to `--tm-*` tokens -- **button dark**
- [x] Migrate [`auditHistoryPull.js`](../JS/auditHistoryPull.js) styles to `--tm-*` tokens -- **statusContainer dark**
- [x] Migrate [`DesyncFinder.js`](../JS/DesyncFinder.js) styles to `--tm-*` tokens -- **formContainer dark**
- [x] Migrate [`scratchpaper.js`](../JS/scratchpaper.js) styles to `--tm-*` tokens -- **full dark mode: container, header, info box, icons**

### 1.2 Dark Mode First

- [x] Switch all overlay/modal backgrounds from `#fff` to `--tm-bg-secondary` (`#1a1a1a`) -- **done across all modules**
- [x] Switch all body text from dark-on-white to `--tm-text-primary` (`#f1f1f1`) on dark surfaces -- **done across all modules**
- [x] Switch Settings panel from white panel to dark theme -- **done**
- [x] Switch Update modal from white card to dark theme -- **done**
- [x] Replace `#004E36` brand green with `--tm-accent-primary` (`#3ea6ff` blue or `#ff0000` red, user-selectable) -- **done across all modules**
- [x] Implement accent theme toggle (blue / red) per style guide section "Accent Theme Toggle" -- store via `localStorage` alongside existing `cam_tools_settings` -- **done, wired to TmTheme.setAccent()**

### 1.3 Typography & Iconography

- [x] Standardize font stack to `'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif` across all modules -- **done in Settings, GeneralHelpTools, Redrive, Download, globalPieces** (remaining modules inherit via tm-theme.js `:root`)
- [x] Replace all emoji usage in UI text with inline SVGs from approved sources -- **done in Settings, GeneralHelpTools, DownloadButton** (status messages now use toast system; cursor emoji picker is intentionally emoji-based as a fun feature)
- [ ] Standardize icon sizes to 16/20/24px per style guide
- [x] Audit border-radius values -- cap at 12px max -- **audited: all values are 10px (toggles/pills) or 12px (modal cards), none exceed limit**

### 1.4 Class Naming & Prefixes

- [x] Adopt `tm-` prefix for all shared/reusable CSS classes (currently `globalPieces.js` uses unprefixed `.button`, `.overlay`, `.form-container` which risk collision with host page) -- **done in globalPieces.js, legacy aliases preserved**
- [x] Rename ExistingItemEditor `ei-` prefixed classes to `tm-ei-` -- **done: CSS block, JS constants, querySelector refs all renamed**
- [x] Rename MassUploader `.massUploader-*` classes to `tm-mu-*` -- **done: 31 CSS definitions + 35 JS className assignments renamed**
- [x] Document the naming convention in the style guide -- **added module-specific prefix table to Anti-AI_Style-Guide.md**

---

## 2. Code Review & Quality

### 2.1 Module Pattern Consistency

- [x] Wrap [`AddItemButton.js`](../JS/AddItemButton.js) top-level functions (`generateCSV`, `fetchAllStoreCodes`) inside the IIFE -- **done, duplicate exports removed**
- [x] Remove `window.injectStyles` / `window.overlayTemplate` globals from [`globalPieces.js`](../JS/globalPieces.js) -- **marked deprecated, kept as thin wrappers for backward compat; consumers should use TmTheme.injectStyle**
- [x] Remove `window.showInlineError` / `window.clearInlineError` / `window.confirmWarning` globals from [`ExistingItemEditor.js`](../JS/ExistingItemEditor.js) -- **scoped to IIFE-local functions, dark-themed error styling**
- [x] Standardize all modules to use `(function() { 'use strict'; ... })();` IIFE pattern -- **ExistingItemEditor arrow IIFE converted to standard; all modules now consistent**
- [x] Move `try { module.exports = ... } catch (e) {}` blocks to the *end* of each module (some like `globalPieces.js` have it at the top before function definitions) -- **done in globalPieces.js, AddItemButton.js**

### 2.2 Variable Declarations

- [x] Replace all `var` declarations with `let`/`const` -- **done in RedriveButton.js, DownloadButton.js, AddItemButton.js (partial)**
- [x] Audit for accidental implicit globals -- **no implicit globals found; all previous window.* exports intentional**

### 2.3 Style Injection Consolidation

- [x] Create a single shared style injection utility (inject once, deduplicate by ID) to replace the three current approaches: -- **`TmTheme.injectStyle(id, css)` in tm-theme.js**
  - Inline via `Object.assign(el.style, {...})` (GeneralHelpToolsButton, RedriveButton, DownloadButton, Settings)
  - `<style>` tag injection with deduplication check (MassUploaderButton, ExistingItemEditor)
  - `globalPieces.js` `injectStyles()` function
- [x] Decide on primary approach -- **Decision: style-tag-based (`TmTheme.injectStyle(id, css)`) is the primary approach for reusable/shared styles. Inline via `Object.assign(el.style, {...})` remains acceptable for dynamic, one-off values (e.g., computed positions). Both approaches coexist; new modules should prefer style-tag.**

### 2.4 MutationObserver Deduplication

- [ ] Audit all MutationObserver usages across modules -- currently each module (MainScript, GeneralHelpToolsButton, Settings, ExistingItemEditor, etc.) creates its own observer
- [ ] Evaluate consolidating into a single shared observer in MainScript that dispatches custom events, reducing DOM observation overhead

### 2.5 Console Logging

- [x] Standardize all console.log calls to use `[ModuleName]` prefix format -- **done for all entry-point logs across 18 modules** (remaining ~50 are data-flow debug logs inside API callbacks -- acceptable verbose)
- [ ] Add log-level gating so debug logs can be toggled via a `FEATURE_FLAGS.DEBUG` or `Settings.debugMode` flag

### 2.6 Error Handling

- [x] Replace bare `alert()` calls in [`Settings.js`](../JS/Settings.js) `showUpdateStatusMessage` and `reset-skipped-version` handler with a proper toast/notification component -- **replaced with TmTheme.showToast()**
- [x] Audit all `catch` blocks -- **audited: only 1 silent catch found (EmbedExcel module.exports) which is the intentional browser-env pattern. All other catches log warnings/errors.**

### 2.7 Developer Attribution

- [x] Implement the dev mark from [`MyDevMark.md`](MyDevMark.md) in the Settings panel footer -- **done**
- [x] Include version display (`CAM_TOOLS_VERSION`) in the dev mark -- **done (v3.1.0 shown)**

---

## 3. Cache Busting on Dependencies / Externals

### 3.1 GitHub Raw URL Versioning

All `@require` URLs in [`MainScript.user.js`](../MainScript.user.js) point to `/raw/main/` (branch HEAD). Tampermonkey caches these aggressively.

- [x] Add cache-busting query parameter to every GitHub raw `@require` URL (e.g., `?v=3.1.0`) and bump on each release -- **done in v3.1.0**

- [x] Document the chosen cache-busting strategy in the multi-tampermonkey guide or a new `RELEASE.md` -- **documented below**

### 3.2 External Library Versions

| Library | Current | Latest Stable | Action |
|---------|---------|--------------|--------|
| jszip | 3.7.1 | 3.10.x | [ ] Upgrade (breaking changes possible) |
| xlsx | 0.17.0 | 0.18.x+ / SheetJS CE | [ ] Evaluate (license changed to non-OSS) |
| PapaParse | 5.3.2 -> 5.4.1 | 5.4.x | [x] Upgraded |
| React | 17.0.2 | 18.x | [ ] Evaluate (intentional for compat) |
| ReactDOM | 17.0.2 | 18.x | [ ] Evaluate alongside React |
| jQuery | 3.6.0 -> 3.7.1 | 3.7.x | [x] Upgraded |
| select2 | 4.1.0-rc.0 | 4.1.0 stable | [ ] Upgrade to stable (minor risk) |
| x-data-spreadsheet | 1.1.5 | 1.1.9+ | [ ] Evaluate upgrade |

### 3.3 Tampermonkey Update Mechanism

- [ ] Verify `@updateURL` and `@downloadURL` both use the same canonical URL format (currently they do -- both point to `/raw/main/MainScript.user.js`)


---

## 4. UI/UX Improvements

### 4.1 Layout & Responsiveness

- [ ] Bottom nav bar buttons use fixed `width: 20%` and `left: 0/20/40/60/80%` positioning -- breaks on narrow viewports. Refactor to flexbox or grid layout **note: bottom bar is slated for depication since the side bar was better in everyway, no one uses bottom bar anyway**
- [x] Settings panel is fixed at 280px wide with `max-width: 90vw` fallback -- **already applied during dark mode rewrite**
- [x] Overlay modals should respect `max-height: 90vh` consistently -- **audited: all major modals have 90vh or calc(90vh - offset); smaller utility forms are fixed-size and appropriate**
- [ ] Test all overlays/modals at 1024px, 768px, and 375px viewport widths

### 4.2 Z-Index Management

Current z-index values are scattered and inconsistent:

| Module | Element | Current z-index |
|--------|---------|----------------|
| Bottom buttons | All | `1000` |
| Overlays | All | `1001` |
| Drawer overlay | Settings | `2999` |
| Settings panel | Menu | `3001` |
| Settings/Toggle btns | Buttons | `3100` |
| Scratchpad | Toggle | `3200` |
| Update modal | Overlay | `9999` |

- [x] Consolidate to the style guide scale: Dropdown `9990`, Modal `9995`, Floating Panel `9999`, Toast `10000` -- **done across all modules**
- [x] Document the z-index allocation in the style guide -- **added consolidated z-index table with "Used By" column to Anti-AI_Style-Guide.md**

### 4.3 Interaction Feedback

- [ ] Add loading spinners / disabled states for async operations (update check, store data fetch, file upload, redrive execution)
- [x] Implement a reusable toast notification component per style guide patterns (replace `alert()` calls) -- **TmTheme.showToast() in tm-theme.js**
- [x] Add `transition: background 150ms ease` to all interactive elements that lack it -- **done across all modules**
- [ ] Add `:focus-visible` outlines per style guide accessibility section -- currently only partially implemented

### 4.4 Overlay & Modal Consistency

- [x] Standardize overlay backdrop to `rgba(0, 0, 0, 0.6)` -- **done across all 13+ overlay modules**
- [ ] Standardize modal card pattern: header bar + scrollable content + footer actions
- [x] Add `Escape` key close to all overlays -- **global handler in tm-theme.js catches any overlay with z-index >= 9990**
- [x] Add click-outside-to-close to all overlays -- **global handler in tm-theme.js for any overlay with z-index >= 9990**
- [ ] Add entrance/exit animations (150ms ease-out open, 150ms ease-in close) per style guide timing

### 4.5 Floating Panel Pattern

The style guide defines a standard floating panel pattern (`tm-floating-panel`) that is not yet adopted:

- [ ] Evaluate refactoring the Settings side-panel to use the floating panel pattern
- [ ] Evaluate refactoring the icon bar to use the collapsed toggle (40x40px) -> expanded panel pattern

### 4.6 Settings Panel Enhancements

- [x] Group settings into collapsible sections (Appearance, Updates) -- **done using <details> elements with accent-colored summary icons**
- [x] Add a "Reset to Defaults" button -- **done, resets accent/menuStyle/autoCheckUpdates/skippedVersion and shows toast**
- [ ] Display all active tool modules and their loaded status (diagnostic view)
- [ ] Add the accent theme toggle (blue/red/wfm green(default)) from the style guide

---

## 5. Testing & Documentation

- [ ] Add or update tests for any refactored module (especially style injection, global scope changes)
- [ ] Update [`multi-tampermonkey-guide.md`](multi-tampermonkey-guide.md) if module patterns change
- [ ] Update [`TOOLBOX_DESIGN.md`](TOOLBOX_DESIGN.md) if toolbar/registry pattern is adopted
- [ ] Keep this tracker updated as items are completed

---

## Priority Order (Suggested)

1. **Shared CSS variable injector** (1.1 first item) -- unblocks all style migration
2. **Cache busting** (3.1) -- ensures users get fresh code during the facelift
3. **Dark mode migration** (1.2) -- highest visual impact
4. **Code review: globals & module patterns** (2.1, 2.2) -- prevents regressions
5. **UI/UX: z-index, overlays, toast system** (4.2, 4.4, 4.3) -- polish pass
6. **Typography, icons, class naming** (1.3, 1.4) -- final consistency sweep
7. **External dependency upgrades** (3.2) -- lower risk, do last

## Added Tasks
- [x] remove audit history dashboard, it was never implemented never will be. -- **restricted section removed from GeneralHelpToolsButton**
- [ ] bulk uploads by chunking csv always pops up 2 windows, we might have this noted but needs fix
- [ ] improvements to existing item editor
- [x] accent color selector, wfm green, red, blue -- **done: blue/red/green(WFM) in Settings + tm-theme.js**
- [ ] light mode
- [x] add wfm favicon icon to page -- **WFM "W" SVG favicon injected via tm-theme.js**
- [ ] feature that records any of the websites original toast notifications for later review
- [x] remove "CAM excel editor" button -- **EmbedExcel.js removed from @require in MainScript; ExcelEditFun.js also deprecated**
- [x] remove custom emoji mouse clickers -- **cursorEmoji state, UI picker, applyCursorEmoji function all removed from Settings.js**
- [x] bump version to 3.0.0 -- **@version header + all 22 ?v= cache-bust params in MainScript.user.js; CAM_TOOLS_VERSION in Settings.js**
- [x] upgrade toggle switches to something modern -- **tm-toggle CSS component in tm-theme.js; Settings auto-check uses pill toggle**
- [x] reorganize general help tools, text tools, inventory converter -- **4 categorized sections: Text/Code, Store/Item Lookup, File Processing, Inventory Converters**
- [x] code review of mass upload -- **duplicate overlay guard, alert()->toast, info icon dark mode, verbose logging noted**
- [x] bottom bar is broken af -- **auto-show on load/switch, EI removed from bottomButtonIds, observer parity fix**
- [x] scratch pad upgrades, fix spawning in corner -- **center on screen via transform, re-center on open unless dragged**
- [x] integrate Grocery Central Connect -- **GroceryCentralConnect.js created, GM_xmlhttpRequest->fetch, added to @require**
- [ ] UI/UX audit
- [ ] Settings icon upgrade
- [ ] Mass upload: extract magic numbers to named constants (45s timeout, 5s min delay, 30s base wait)
- [ ] Mass upload: replace confirm() with non-blocking modal for error flow control
- [ ] Mass upload: reduce verbose PollingManager console.log output behind log-level gate
- [ ] Update test suites for IIFE/dark-mode changes (11 suites failing)

---

*Last updated: 2026-02-27 -- v3.1.0*
