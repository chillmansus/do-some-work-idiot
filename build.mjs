// Builds the installable app into dist/ from src/.
// src/index.html stays in "artifact" form (no doctype) so the prototype link keeps working;
// this script wraps it in a real page and adds the manifest, icons and service worker.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'icons'), { recursive: true });

const page = readFileSync(join(src, 'index.html'), 'utf8');
const cut = page.indexOf('<div id="app">');
if (cut < 0) throw new Error('src/index.html: <div id="app"> not found');
const head = page.slice(0, cut).replace(/<meta name="claude:[^>]*>\s*/g, '').trim();
const body = page.slice(cut).trim();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="description" content="A personal habit tracker. Small habits, one vote at a time.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-64.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Do Work">
${head}
</head>
<body>
${body}
</body>
</html>
`;

const files = { 'index.html': html };
for (const f of ['app.css', 'app.js', 'manifest.webmanifest']) files[f] = readFileSync(join(src, f));
for (const f of readdirSync(join(src, 'icons'))) files['icons/' + f] = readFileSync(join(src, 'icons', f));

const hash = createHash('sha256');
for (const [name, data] of Object.entries(files)) { hash.update(name); hash.update(data); }
// Content hash + build time: every deploy gets a fresh cache, so phones always pick up the newest copy.
const version = hash.digest('hex').slice(0, 8) + '-' + Date.now().toString(36);

const assets = ['./', ...Object.keys(files).map(f => './' + f)];
files['sw.js'] = readFileSync(join(src, 'sw.js'), 'utf8')
  .replace('__VERSION__', version)
  .replace('__ASSETS__', JSON.stringify(assets));
files['_headers'] = '/sw.js\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Content-Type: application/manifest+json\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n';

for (const [name, data] of Object.entries(files)) writeFileSync(join(dist, name), data);
console.log(`built dist/ (${Object.keys(files).length} files, version ${version})`);
