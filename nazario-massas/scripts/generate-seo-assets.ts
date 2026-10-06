/**
 * Generates favicon PNGs, the Open Graph image and sitemap.xml.
 *   npx tsx scripts/generate-seo-assets.ts
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { seedProducts } from '../apps/api/src/data/seed';

const SITE = process.env.SITE_URL ?? 'https://nazariomassas.com.br';
const pub = join(import.meta.dirname, '../apps/web/public');

const mark = (size: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#16110E"/><path d="M14 50V31a18 18 0 0 1 36 0v19" fill="none" stroke="#E0612F" stroke-width="5" stroke-linecap="round"/><path d="M24 50V36l16 14V36" fill="none" stroke="#F5EFE4" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

for (const [file, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]] as const) {
  await sharp(mark(size)).png().toFile(join(pub, file));
}

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#16110E" stop-opacity=".96"/><stop offset=".55" stop-color="#16110E" stop-opacity=".7"/><stop offset="1" stop-color="#16110E" stop-opacity="0"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="72" y="118" fill="#C9A55A" font-family="Georgia, serif" font-size="22" letter-spacing="6">NAZÁRIO MASSAS</text>
  <text x="72" y="270" fill="#F5EFE4" font-family="Georgia, serif" font-size="76" font-style="italic">48 horas de</text>
  <text x="72" y="355" fill="#F5EFE4" font-family="Georgia, serif" font-size="76">fermentação.</text>
  <text x="72" y="470" fill="#E0612F" font-family="Georgia, serif" font-size="40">90 segundos de forno a lenha.</text>
  <text x="72" y="560" fill="#B9AC9C" font-family="Helvetica, Arial, sans-serif" font-size="24">Peça online · retire no balcão</text>
</svg>`);
await sharp(join(pub, 'images/hero-forno-1920.webp'))
  .resize(1200, 630, { fit: 'cover', position: 'right' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(join(pub, 'og-image.jpg'));

const urls = [
  '/',
  '/cardapio',
  '/cardapio/pizzas',
  '/cardapio/massas',
  '/cardapio/bebidas',
  ...seedProducts.filter((p) => p.categoryId !== 'bebidas').map((p) => `/produto/${p.slug}`),
];
await writeFile(
  join(pub, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc><changefreq>weekly</changefreq><priority>${u === '/' ? '1.0' : '0.7'}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);
console.log(`SEO assets written (${urls.length} sitemap URLs)`);
