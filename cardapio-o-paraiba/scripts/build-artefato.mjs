/**
 * Gera UM arquivo HTML com tudo embutido (JS, CSS e fontes em data: URI) para
 * publicar a prévia no claude.ai, cujo visualizador bloqueia fontes de outros
 * arquivos. O site de verdade continua sendo o `npm run build` (dist/).
 *   node scripts/build-artefato.mjs [saida.html]
 */
import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const raiz = resolve(import.meta.dirname, '..');
const saida = resolve(process.argv[2] ?? join(raiz, 'dist-artefato.html'));
const tmp = mkdtempSync(join(tmpdir(), 'artefato-'));

await build({
  root: raiz,
  configFile: false,
  logLevel: 'warn',
  base: './',
  plugins: [(await import('@vitejs/plugin-react')).default()],
  build: {
    outDir: tmp,
    emptyOutDir: true,
    assetsInlineLimit: 10_000_000, // fontes viram data: URI
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: join(raiz, 'index.html'), output: { inlineDynamicImports: true } },
  },
});

let html = readFileSync(join(tmp, 'index.html'), 'utf8');
const assets = join(tmp, 'assets');
for (const arquivo of readdirSync(assets)) {
  const conteudo = readFileSync(join(assets, arquivo), 'utf8');
  if (arquivo.endsWith('.css')) {
    html = html.replace(new RegExp(`<link rel="stylesheet"[^>]*${arquivo}[^>]*>`), () => `<style>${conteudo}</style>`);
  } else if (arquivo.endsWith('.js')) {
    html = html.replace(
      new RegExp(`<script type="module"[^>]*${arquivo}[^>]*></script>`),
      // O script vai para o fim do <body>, depois do #root.
      '',
    );
    html = html.replace('</body>', () => `<script type="module">${conteudo.replace(/<\/script/g, '<\\/script')}</script>\n</body>`);
  }
}
const favicon = readFileSync(join(raiz, 'public/favicon.svg'), 'utf8');
html = html.replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`);
if (/\.\/assets\//.test(html)) throw new Error('Sobrou referência a ./assets no HTML');
writeFileSync(saida, html);
rmSync(tmp, { recursive: true, force: true });
console.log(`${saida} (${(html.length / 1024).toFixed(0)} kB)`);
