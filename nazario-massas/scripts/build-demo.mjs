#!/usr/bin/env node
/**
 * Builds the self-contained demo (store + admin, API simulated in the browser)
 * into apps/web/dist-demo — a static folder you can host anywhere.
 *   npm run build:demo
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const web = join(import.meta.dirname, '../apps/web');
const out = join(web, 'dist-demo');
rmSync(out, { recursive: true, force: true });
execSync('npx vite build', { cwd: web, stdio: 'inherit', env: { ...process.env, VITE_DEMO: '1' } });

// WebP only (every browser that runs the app supports it) — halves the upload.
for (const f of readdirSync(join(out, 'images'))) if (f.endsWith('.avif')) rmSync(join(out, 'images', f));
for (const f of ['og-image.jpg', 'sitemap.xml', 'robots.txt', 'site.webmanifest', 'icon-512.png', 'icon-192.png', 'apple-touch-icon.png']) {
  rmSync(join(out, f), { force: true });
}

// Strip server-only hints (API preload, hero preload script, JSON-LD) from the HTML.
let html = readFileSync(join(out, 'index.html'), 'utf8');
html = html
  .replace(/\s*<!-- The menu request[^>]*-->\s*<link rel="preload" href="\/api\/catalog"[^>]*>/, '')
  .replace(/\s*<script>\s*\/\/ Preload the hero photo[\s\S]*?<\/script>/, '')
  .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  .replace(/\s*<link rel="(manifest|apple-touch-icon|canonical)"[^>]*>/g, '');
writeFileSync(join(out, 'index.html'), html);

// Page fragment for hosts that wrap the document themselves (title, styles, root, script).
const head = html.match(/<head>([\s\S]*)<\/head>/)?.[1] ?? '';
const keep = head
  .split('\n')
  .filter((l) => /<title>|rel="stylesheet"|rel="modulepreload"|type="module"|rel="icon"|name="description"/.test(l))
  .join('\n');
writeFileSync(join(out, "page.html"), `${keep.replace(/<title>[^<]*<\/title>/, "<title>Nazário Massas</title>")}\n<div id="root"></div>\n`);
console.log('Demo ready →', out);
