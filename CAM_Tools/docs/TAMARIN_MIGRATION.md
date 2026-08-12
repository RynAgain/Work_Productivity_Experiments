# CAM_Admin_Tools: GitHub -> Tamarin Migration Runbook

Goal: stop serving updates from RynAgain's personal GitHub. All users end up
on the Tamarin registry update path.

## New architecture

- No more per-module GitHub `@require`s. `node build/build.js` concatenates
  every module in `build/config.json` order into `dist/CAM_Admin_Tools.user.js`.
- Each module is wrapped in try/catch in the bundle, preserving the old
  @require behavior where one broken file did not kill the rest.
- Version source of truth: `package.json`. The build auto-bumps patch
  (`--minor`, `--major`, `--set X.Y.Z`, `--no-bump` also available) and
  injects the version into Settings.js's in-app update checker.
- Third-party CDN libraries (jszip, xlsx, papaparse, react, jquery, select2,
  x-spreadsheet) remain as CDN `@require`s -- they were never on GitHub.

## One-time migration steps

1. **Build** (done): `node build/build.js` -> `dist/CAM_Admin_Tools.user.js` v4.0.0.
2. **Upload to Tamarin** (manual, once):
   - Web: upload `dist/CAM_Admin_Tools.user.js` at https://tamarin.harmony.a2z.com
   - Or CLI: `tamarin upload dist/CAM_Admin_Tools.user.js --changelog "Migrated from GitHub @require architecture to bundled Tamarin hosting"`
   - Confirm the slug is `cam-admin-tools` (`tamarin info cam-admin-tools`).
     If it differs, fix the three URLs in `build/config.json`, rebuild
     (`--no-bump`), and `tamarin push --stage prod` the corrected bundle.
3. **Migrate legacy users**: once the Tamarin install URL is confirmed live:
   - `node build/build.js --no-bump --emit-legacy`
   - This overwrites `MainScript.user.js` with the full bundle (same @name +
     @namespace, higher @version, Tamarin @updateURL/@downloadURL).
   - Commit and push to GitHub `main`. Legacy installs update from GitHub one
     last time and land on the Tamarin update path automatically.

## Ongoing releases (after migration)

```
node build/build.js                       # bump patch + build
tamarin push dist/CAM_Admin_Tools.user.js --stage prod --changelog "..."
```

GitHub no longer needs to be touched for releases.

## Notes

- `https://tamarin.aces.amazon.dev/scripts/cam-admin-tools/install.user.js`
  is both the Tampermonkey update URL and what Settings.js polls for its
  in-app update toast ("Update Now" opens it, which triggers the TM installer).
- Jest tests run against the individual files in `JS/` -- unchanged by the
  build. 15 suites were already failing before this migration (test rot,
  tracked separately); the bundler did not touch any module source.
- `MainScript.js` is the stub from the previous (pre-.user.js) migration;
  it stays as-is.
