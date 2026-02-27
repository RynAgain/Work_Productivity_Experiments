# CAM Tools -- Feature Tracker

> Master checklist for the system-wide facelift. Each item is a discrete, reviewable unit of work.
> Mark `[x]` when merged, `[-]` when actively in progress.

---

## 1. Style Guide Alignment

Bring every module into compliance with [`Anti-AI_Style-Guide.md`](Anti-AI_Style-Guide.md).

### 1.1 CSS Variable Adoption

- [ ] Create a shared runtime style injector that writes the `--tm-*` CSS variable block (from the style guide `:root` template) into `<head>` once, before any module renders
- [ ] Migrate [`globalPieces.js`](../JS/globalPieces.js) `.button`, `.overlay`, `.form-container`, `.close-button` classes to use `--tm-*` tokens instead of hardcoded hex
- [ ] Migrate [`Settings.js`](../JS/Settings.js) -- settings panel, icon bar, toggle/hamburger buttons, update modal -- to `--tm-*` tokens
- [ ] Migrate [`GeneralHelpToolsButton.js`](../JS/GeneralHelpToolsButton.js) `STYLES` object to `--tm-*` tokens
- [ ] Migrate [`RedriveButton.js`](../JS/RedriveButton.js) inline styles to `--tm-*` tokens
- [ ] Migrate [`DownloadButton.js`](../JS/DownloadButton.js) inline styles to `--tm-*` tokens
- [ ] Migrate [`AddItemButton.js`](../JS/AddItemButton.js) inline styles to `--tm-*` tokens
- [ ] Migrate [`MassUploaderButton.js`](../JS/MassUploaderButton.js) style tag rules to `--tm-*` tokens
- [ ] Migrate [`ExistingItemEditor.js`](../JS/ExistingItemEditor.js) inline/class styles to `--tm-*` tokens
- [ ] Migrate [`inventoryPFDS.js`](../JS/inventoryPFDS.js) styles to `--tm-*` tokens
- [ ] Migrate [`FileChunker.js`](../JS/FileChunker.js) styles (if any UI) to `--tm-*` tokens
- [ ] Migrate [`EmbedExcel.js`](../JS/EmbedExcel.js) styles to `--tm-*` tokens
- [ ] Migrate [`auditHistoryPull.js`](../JS/auditHistoryPull.js) styles to `--tm-*` tokens
- [ ] Migrate [`DesyncFinder.js`](../JS/DesyncFinder.js) styles to `--tm-*` tokens
- [ ] Migrate [`scratchpaper.js`](../JS/scratchpaper.js) styles to `--tm-*` tokens

### 1.2 Dark Mode First

- [ ] Switch all overlay/modal backgrounds from `#fff` to `--tm-bg-secondary` (`#1a1a1a`)
- [ ] Switch all body text from dark-on-white to `--tm-text-primary` (`#f1f1f1`) on dark surfaces
- [ ] Switch Settings panel from white panel to dark theme
- [ ] Switch Update modal from white card to dark theme
- [ ] Replace `#004E36` brand green with `--tm-accent-primary` (`#3ea6ff` blue or `#ff0000` red, user-selectable)
- [ ] Implement accent theme toggle (blue / red) per style guide section "Accent Theme Toggle" -- store via `localStorage` alongside existing `cam_tools_settings`

### 1.3 Typography & Iconography

- [ ] Standardize font stack to `'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif` across all modules (currently varies: some use `'Segoe UI, Arial, sans-serif'`, some inherit)
- [ ] Replace all emoji usage in UI text with inline SVGs from approved sources (Heroicons, Lucide, Tabler, Material Symbols) -- currently emojis appear in Settings status messages (`showUpdateStatusMessage`), button labels, and `confirmWarning`
- [ ] Standardize icon sizes to 16/20/24px per style guide
- [ ] Audit border-radius values -- cap at 12px max (some modules use `12px` already, verify none exceed)

### 1.4 Class Naming & Prefixes

- [ ] Adopt `tm-` prefix for all shared/reusable CSS classes (currently `globalPieces.js` uses unprefixed `.button`, `.overlay`, `.form-container` which risk collision with host page)
- [ ] Rename ExistingItemEditor `ei-` prefixed classes to `tm-ei-` to follow the `tm-` namespace convention
- [ ] Rename MassUploader `.massUploader-*` classes to `tm-mu-*`
- [ ] Document the naming convention in the style guide if not already covered

---

## 2. Code Review & Quality

### 2.1 Module Pattern Consistency

- [ ] Wrap [`AddItemButton.js`](../JS/AddItemButton.js) top-level functions (`generateCSV`, `fetchAllStoreCodes`) inside the IIFE -- they currently leak to global scope
- [ ] Remove `window.injectStyles` / `window.overlayTemplate` globals from [`globalPieces.js`](../JS/globalPieces.js) -- refactor consumers to import via a shared registry pattern or keep inside IIFE with controlled exposure
- [ ] Remove `window.showInlineError` / `window.clearInlineError` / `window.confirmWarning` globals from [`ExistingItemEditor.js`](../JS/ExistingItemEditor.js) -- scope to module
- [ ] Standardize all modules to use `(function() { 'use strict'; ... })();` IIFE pattern (currently some use arrow-function IIFEs `(() => { ... })()`, some use standard)
- [ ] Move `try { module.exports = ... } catch (e) {}` blocks to the *end* of each module (some like `globalPieces.js` have it at the top before function definitions)

### 2.2 Variable Declarations

- [ ] Replace all `var` declarations with `let`/`const` -- identified in [`RedriveButton.js`](../JS/RedriveButton.js), [`DownloadButton.js`](../JS/DownloadButton.js), [`AddItemButton.js`](../JS/AddItemButton.js)
- [ ] Audit for accidental implicit globals

### 2.3 Style Injection Consolidation

- [ ] Create a single shared style injection utility (inject once, deduplicate by ID) to replace the three current approaches:
  - Inline via `Object.assign(el.style, {...})` (GeneralHelpToolsButton, RedriveButton, DownloadButton, Settings)
  - `<style>` tag injection with deduplication check (MassUploaderButton, ExistingItemEditor)
  - `globalPieces.js` `injectStyles()` function
- [ ] Decide on primary approach: style-tag-based is cleaner for reuse; inline is acceptable for one-off dynamic values. Document the decision.

### 2.4 MutationObserver Deduplication

- [ ] Audit all MutationObserver usages across modules -- currently each module (MainScript, GeneralHelpToolsButton, Settings, ExistingItemEditor, etc.) creates its own observer
- [ ] Evaluate consolidating into a single shared observer in MainScript that dispatches custom events, reducing DOM observation overhead

### 2.5 Console Logging

- [ ] Standardize all console.log calls to use `[ModuleName]` prefix format (per multi-tampermonkey-guide best practices) -- currently inconsistent, e.g., `'Redrive button clicked'` vs `'Enhanced Mass Uploader button clicked'`
- [ ] Add log-level gating so debug logs can be toggled via a `FEATURE_FLAGS.DEBUG` or `Settings.debugMode` flag

### 2.6 Error Handling

- [ ] Replace bare `alert()` calls in [`Settings.js`](../JS/Settings.js) `showUpdateStatusMessage` and `reset-skipped-version` handler with a proper toast/notification component
- [ ] Audit all `catch` blocks -- several silently swallow errors (`catch (e) {}`) with no logging

### 2.7 Developer Attribution

- [ ] Implement the dev mark from [`MyDevMark.md`](MyDevMark.md) in the Settings panel footer
- [ ] Include version display (`CAM_TOOLS_VERSION`) in the dev mark

---

## 3. Cache Busting on Dependencies / Externals

### 3.1 GitHub Raw URL Versioning

All `@require` URLs in [`MainScript.user.js`](../MainScript.user.js) point to `/raw/main/` (branch HEAD). Tampermonkey caches these aggressively.

- [ ] Add cache-busting query parameter to every GitHub raw `@require` URL (e.g., `?v=2.6.253`) and bump on each release
- [ ] Alternatively, switch internal `@require` URLs from `/raw/main/` to tagged releases (`/raw/v2.6.253/`) so each version pins a specific snapshot
- [ ] Document the chosen cache-busting strategy in the multi-tampermonkey guide or a new `RELEASE.md`

### 3.2 External Library Versions

| Library | Current | Latest Stable | Action |
|---------|---------|--------------|--------|
| jszip | 3.7.1 | 3.10.x | [ ] Upgrade |
| xlsx | 0.17.0 | 0.18.x+ / SheetJS CE | [ ] Evaluate upgrade or pin |
| PapaParse | 5.3.2 | 5.4.x | [ ] Upgrade |
| React | 17.0.2 | 18.x | [ ] Evaluate -- may be intentional for compat |
| ReactDOM | 17.0.2 | 18.x | [ ] Evaluate alongside React |
| jQuery | 3.6.0 | 3.7.x | [ ] Upgrade |
| select2 | 4.1.0-rc.0 | 4.1.0 stable | [ ] Upgrade to stable release |
| x-data-spreadsheet | 1.1.5 | 1.1.9+ | [ ] Evaluate upgrade |

### 3.3 Tampermonkey Update Mechanism

- [ ] Verify `@updateURL` and `@downloadURL` both use the same canonical URL format (currently they do -- both point to `/raw/main/MainScript.user.js`)
- [ ] Consider adding SRI hashes or checksum validation for external CDN scripts if Tampermonkey supports it

---

## 4. UI/UX Improvements

### 4.1 Layout & Responsiveness

- [ ] Bottom nav bar buttons use fixed `width: 20%` and `left: 0/20/40/60/80%` positioning -- breaks on narrow viewports. Refactor to flexbox or grid layout
- [ ] Settings panel is fixed at 260px wide with no responsive adaptation -- add `max-width: 90vw` fallback
- [ ] Overlay modals should respect `max-height: 90vh` consistently (some do, some don't)
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

- [ ] Consolidate to the style guide scale: Dropdown `9990`, Modal `9995`, Floating Panel `9999`, Toast `10000`
- [ ] Document the z-index allocation in the style guide

### 4.3 Interaction Feedback

- [ ] Add loading spinners / disabled states for async operations (update check, store data fetch, file upload, redrive execution)
- [ ] Implement a reusable toast notification component per style guide patterns (replace `alert()` calls)
- [ ] Add `transition: background 150ms ease` to all interactive elements that lack it
- [ ] Add `:focus-visible` outlines per style guide accessibility section -- currently only partially implemented

### 4.4 Overlay & Modal Consistency

- [ ] Standardize overlay backdrop to `rgba(0, 0, 0, 0.6)` (currently varies: `0.5` in most, `0.6` in update modal, `0.15` in drawer overlay)
- [ ] Standardize modal card pattern: header bar + scrollable content + footer actions
- [ ] Add `Escape` key close to all overlays (currently only Settings/Update modal handle it)
- [ ] Add click-outside-to-close to all overlays (currently inconsistent)
- [ ] Add entrance/exit animations (150ms ease-out open, 150ms ease-in close) per style guide timing

### 4.5 Floating Panel Pattern

The style guide defines a standard floating panel pattern (`tm-floating-panel`) that is not yet adopted:

- [ ] Evaluate refactoring the Settings side-panel to use the floating panel pattern
- [ ] Evaluate refactoring the icon bar to use the collapsed toggle (40x40px) -> expanded panel pattern

### 4.6 Settings Panel Enhancements

- [ ] Group settings into collapsible sections (Appearance, Updates, Advanced)
- [ ] Add a "Reset to Defaults" button
- [ ] Display all active tool modules and their loaded status (diagnostic view)
- [ ] Add the accent theme toggle (blue/red) from the style guide

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

---

*Last updated: 2026-02-27*
