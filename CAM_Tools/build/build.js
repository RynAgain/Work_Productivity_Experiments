#!/usr/bin/env node
/**
 * build.js -- CAM_Admin_Tools userscript bundler.
 *
 * Replaces the legacy GitHub-@require module loading with a single
 * self-contained .user.js artifact suitable for Tamarin hosting.
 *
 * What it does:
 *   1. Bumps the version in package.json (patch by default).
 *   2. Concatenates all modules listed in build/config.json (in order),
 *      each wrapped in try/catch so one broken module cannot take down
 *      the rest (this preserves the old per-file @require isolation).
 *   3. Injects the new version + Tamarin update URLs into Settings.js's
 *      in-app update checker at bundle time (sources stay GitHub-compatible
 *      until the migration is complete).
 *   4. Emits dist/CAM_Admin_Tools.user.js with a generated header.
 *
 * Usage:
 *   node build/build.js                 # bump patch, build
 *   node build/build.js --minor         # bump minor
 *   node build/build.js --major         # bump major
 *   node build/build.js --set 4.0.0     # explicit version
 *   node build/build.js --no-bump       # rebuild at current version
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'JS');
const DIST_DIR = path.join(ROOT, 'dist');
const PKG_PATH = path.join(ROOT, 'package.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');

// ---------------------------------------------------------------- args
const args = process.argv.slice(2);
function hasFlag(f) { return args.includes(f); }
function flagValue(f) {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

// ---------------------------------------------------------------- version
function bumpVersion(v, kind) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`package.json version "${v}" is not X.Y.Z`);
  let [maj, min, pat] = m.slice(1).map(Number);
  if (kind === 'major') { maj++; min = 0; pat = 0; }
  else if (kind === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `${maj}.${min}.${pat}`;
}

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
if (!pkg.version) throw new Error('package.json has no "version" field');

let version;
const explicit = flagValue('--set');
if (explicit) {
  if (!/^\d+\.\d+\.\d+$/.test(explicit)) throw new Error(`--set "${explicit}" is not X.Y.Z`);
  version = explicit;
} else if (hasFlag('--no-bump')) {
  version = pkg.version;
} else {
  version = bumpVersion(pkg.version, hasFlag('--major') ? 'major' : hasFlag('--minor') ? 'minor' : 'patch');
}

// ---------------------------------------------------------------- config
const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// ---------------------------------------------------------------- header
function headerLines() {
  const lines = [];
  const push = (k, v) => lines.push(`// @${k.padEnd(12)} ${v}`);
  lines.push('// ==UserScript==');
  push('name', cfg.name);
  push('namespace', cfg.namespace);
  push('version', version);
  push('description', cfg.description);
  push('author', cfg.author);
  cfg.match.forEach(m => push('match', m));
  cfg.grant.forEach(g => push('grant', g));
  cfg.connect.forEach(c => push('connect', c));
  cfg.cdnRequires.forEach(r => push('require', r));
  push('run-at', cfg.runAt);
  if (cfg.updateURL) push('updateURL', cfg.updateURL);
  if (cfg.downloadURL) push('downloadURL', cfg.downloadURL);
  lines.push('// ==/UserScript==');
  return lines.join('\n');
}

// ---------------------------------------------------------------- transforms
/** Build-time rewrites applied to specific modules. Sources are left
 *  untouched so the legacy GitHub @require path keeps working during
 *  the migration window. */
function transform(name, src) {
  if (name === 'Settings.js') {
    // Version constant must track the bundle version.
    src = src.replace(
      /const CAM_TOOLS_VERSION = '[^']*';[^\n]*/,
      `const CAM_TOOLS_VERSION = '${version}'; // injected by build.js`
    );
    // Point the in-app update checker at Tamarin (once configured).
    if (cfg.updateCheckURL) {
      src = src.replace(
        /const GITHUB_API_URL = '[^']*';[^\n]*/,
        `const GITHUB_API_URL = ''; // disabled by build.js (Tamarin hosting)`
      );
      src = src.replace(
        /const GITHUB_RAW_URL = '[^']*';[^\n]*/,
        `const GITHUB_RAW_URL = '${cfg.updateCheckURL}'; // injected by build.js (Tamarin raw script URL)`
      );
    }
  }
  return src;
}

// ---------------------------------------------------------------- bundle
const parts = [headerLines(), ''];
const missing = [];

for (const name of cfg.modules) {
  const file = path.join(JS_DIR, name);
  if (!fs.existsSync(file)) { missing.push(name); continue; }
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim();
  src = transform(name, src);
  parts.push(
    `/* ================================================================\n` +
    ` * MODULE: ${name}\n` +
    ` * ================================================================ */\n` +
    // try/catch preserves the old @require behavior where one failing
    // file did not stop the others from loading.
    `try {\n${src}\n} catch (e) {\n  console.error('[CAM_Tools] Module ${name} failed to initialize:', e);\n}\n`
  );
}

if (missing.length) {
  console.error('FATAL: missing modules: ' + missing.join(', '));
  process.exit(1);
}

parts.push(`console.log('[CAM_Tools] Bundle v${version} loaded (${cfg.modules.length} modules)');\n`);

fs.mkdirSync(DIST_DIR, { recursive: true });
const outPath = path.join(DIST_DIR, `${cfg.name}.user.js`);
fs.writeFileSync(outPath, parts.join('\n'), 'utf8');

// Persist the bumped version only after a successful write.
if (version !== pkg.version) {
  pkg.version = version;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

// --emit-legacy: overwrite the legacy GitHub-served MainScript.user.js with
// the bundle so existing users get migrated onto the Tamarin update path the
// next time Tampermonkey checks GitHub. Only use once the Tamarin URL is live.
if (hasFlag('--emit-legacy')) {
  const legacyPath = path.join(ROOT, 'MainScript.user.js');
  fs.copyFileSync(outPath, legacyPath);
  console.log('Wrote legacy migration copy: MainScript.user.js (push to GitHub to migrate legacy users)');
}

const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Built ${path.relative(ROOT, outPath)}  v${version}  ${kb} KB  (${cfg.modules.length} modules)`);
if (!cfg.updateURL) {
  console.log('NOTE: updateURL/downloadURL not set in build/config.json yet -- fill in the Tamarin URLs after first upload.');
}
