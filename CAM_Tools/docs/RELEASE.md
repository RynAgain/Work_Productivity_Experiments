# CAM Tools -- Release & Cache-Busting Strategy

## Version Scheme

CAM Tools uses three-segment semantic versioning: `MAJOR.MINOR.PATCH` (e.g., `3.1.0`).

- **MAJOR**: Breaking architecture changes
- **MINOR**: New features, new modules
- **PATCH**: Bug fixes, style changes, refactors

The canonical version lives in two places that must stay in sync:
1. [`MainScript.user.js`](../MainScript.user.js) `@version` header (line 4)
2. [`Settings.js`](../JS/Settings.js) `CAM_TOOLS_VERSION` constant

---

## Cache-Busting Strategy

### Problem

Tampermonkey aggressively caches `@require` files. Pushing code to GitHub `main` branch does not guarantee users get the new version -- Tampermonkey may serve a stale copy for hours or days.

### Solution: Query Parameter Versioning

Every internal `@require` URL in `MainScript.user.js` includes a `?v=` query parameter matching the current version:

```
// @require https://github.com/.../raw/main/CAM_Tools/JS/Settings.js?v=3.1.0
```

When the version bumps, all `?v=` values bump too, which forces Tampermonkey to re-fetch every module.

### Release Checklist

1. Make code changes across module files
2. Bump version in `MainScript.user.js` `@version` header
3. Bump `CAM_TOOLS_VERSION` in `Settings.js` to match
4. Find-and-replace `?v=OLD_VERSION` with `?v=NEW_VERSION` across all `@require` lines in `MainScript.user.js`
5. Commit and push to `main`

### Why Not Tagged Releases?

Tagged release URLs (`/raw/v3.1.0/...`) would pin specific snapshots, but:

- The `@require` URLs would need to change on every release anyway
- GitHub raw serving from tags can have propagation delays
- The `?v=` approach is simpler and proven in production

Tagged releases may be adopted in the future for stability, but query parameters are the current standard.

### External Library URLs

CDN-hosted libraries (jQuery, React, jszip, etc.) use version-pinned CDN URLs and do not need cache busting:

```
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
```

These only change when explicitly upgrading the library version.

---

## Auto-Update Flow

1. `@updateURL` and `@downloadURL` point to the MainScript on `main` branch (no `?v=` -- Tampermonkey handles its own check interval)
2. When Tampermonkey detects a new `@version` in the header, it prompts the user to update
3. On update, all `@require` files are re-fetched because the `?v=` values changed

---

*Last updated: 2026-02-27*
