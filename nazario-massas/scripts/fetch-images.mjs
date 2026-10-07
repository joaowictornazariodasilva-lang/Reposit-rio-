#!/usr/bin/env node
/**
 * Downloads the menu photography (Unsplash License — free for commercial use)
 * and writes responsive AVIF + WebP renditions to apps/web/public/images.
 *
 *   npm run images
 *
 * Replace any entry with the restaurant's own photography later: drop a file at
 * apps/web/public/images/<name>-<width>.{avif,webp} or upload a URL in /admin.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/web/public/images');
/** Keep in sync with apps/web/src/lib/images.ts */
const PRODUCT_WIDTHS = [400, 800, 1200];
const EDITORIAL_WIDTHS = [640, 1280, 1920];
const isEditorial = (name) => name.startsWith('hero') || name.startsWith('editorial');

/** name → Unsplash photo id */
const PHOTOS = {
  // editorial
  'hero-forno': '1579751626657-72bc17010498',
  'editorial-queijo': '1541745537411-b8046dc6d66c',
  'editorial-garfo': '1556761223-4c4282c73f77',
  'editorial-cozinha': '1600565193348-f74bd3c7ccdf',
  'categoria-pizzas': '1595854341625-f33ee10dbf94',
  'categoria-massas': '1612874742237-6526221588e3',
  'categoria-bebidas': '1581636625402-29b2a704ef13',
  // pizzas
  'pizza-especial-nazario': '1593560708920-61dd98c46a4e',
  'pizza-margherita': '1604068549290-dea0e4a305ca',
  'pizza-bufala': '1574071318508-1cdbab80d002',
  'pizza-calabresa': '1534308983496-4fabb1a015ee',
  'pizza-quatro-queijos': '1513104890138-7c749659a591',
  'pizza-portuguesa': '1571066811602-716837d681de',
  'pizza-frango-catupiry': '1588315029754-2dd089d39a1a',
  'pizza-pepperoni': '1628840042765-356cda07504e',
  'pizza-bacon-cogumelos': '1590947132387-155cc02f3212',
  'pizza-napolitana': '1576458088443-04a19bb13da6',
  'pizza-presunto-queijo': '1594007654729-407eedc4be65',
  'pizza-carne-seca': '1506354666786-959d6d497f1a',
  'pizza-vegetariana': '1552539618-7eec9b4d1796',
  'pizza-rucula': '1528137871618-79d2761e3fd5',
  // massas
  'massa-bolonhesa': '1598866594230-a7c12756260f',
  'massa-alfredo': '1645112411341-6c4fd023714a',
  'massa-penne-quatro-queijos': '1608219992759-8d74ed8d76eb',
  'massa-penne-arrabbiata': '1621996346565-e3dbc646d9a9',
  'massa-lasanha-bolonhesa': '1574894709920-11b28e7367e3',
  'massa-lasanha-frango': '1619895092538-128341789043',
  'massa-talharim-ragu': '1611270629569-8b357cb88da9',
  'massa-carbonara': '1612874742237-6526221588e3',
  'massa-ravioli': '1587740908075-9e245070dfaa',
  'massa-frutos-do-mar': '1563379926898-05f4575a45d8',
};

const exists = (p) => access(p).then(() => true, () => false);

await mkdir(outDir, { recursive: true });
const force = process.argv.includes('--force');
let done = 0;

await Promise.all(
  Object.entries(PHOTOS).map(async ([name, id]) => {
    const WIDTHS = isEditorial(name) ? EDITORIAL_WIDTHS : PRODUCT_WIDTHS;
    const last = join(outDir, `${name}-${WIDTHS.at(-1)}.webp`);
    if (!force && (await exists(last))) return;
    const res = await fetch(`https://images.unsplash.com/photo-${id}?w=2000&q=85&fm=jpg`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());
    for (const width of WIDTHS) {
      // Menu photos are square; hero/editorial frames keep their original aspect ratio.
      const pipeline = isEditorial(name)
        ? sharp(input).resize({ width, withoutEnlargement: true })
        : sharp(input).resize({ width, height: width, fit: 'cover', position: 'attention' });
      await writeFile(join(outDir, `${name}-${width}.avif`), await pipeline.clone().avif({ quality: 52, effort: 5 }).toBuffer());
      await writeFile(join(outDir, `${name}-${width}.webp`), await pipeline.clone().webp({ quality: 74 }).toBuffer());
    }
    done++;
    console.log(`✓ ${name}`);
  }),
);

// Transparent cut-out of a top-down pizza for the scroll "exploded pizza" scene.
const CUTOUT = { name: 'pizza-topo', id: '1595854341625-f33ee10dbf94', cx: 612, cy: 546, rx: 426, ry: 438, sourceWidth: 1600 };
if (force || !(await exists(join(outDir, `${CUTOUT.name}-1000.webp`)))) {
  const res = await fetch(`https://images.unsplash.com/photo-${CUTOUT.id}?w=${CUTOUT.sourceWidth}&q=90&fm=jpg`);
  if (!res.ok) throw new Error(`${CUTOUT.name}: HTTP ${res.status}`);
  const side = Math.max(CUTOUT.rx, CUTOUT.ry) * 2 + 8;
  const left = Math.round(CUTOUT.cx - side / 2);
  const top = Math.round(CUTOUT.cy - side / 2);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"><defs><filter id="f"><feGaussianBlur stdDeviation="2"/></filter></defs>` +
      `<ellipse cx="${side / 2}" cy="${side / 2}" rx="${CUTOUT.rx}" ry="${CUTOUT.ry}" fill="#fff" filter="url(#f)"/></svg>`,
  );
  const square = await sharp(Buffer.from(await res.arrayBuffer()))
    .extract({ left, top, width: side, height: side })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  for (const width of [600, 1000]) {
    await writeFile(join(outDir, `${CUTOUT.name}-${width}.webp`), await sharp(square).resize(width, width).webp({ quality: 80, alphaQuality: 90 }).toBuffer());
  }
  console.log(`✓ ${CUTOUT.name} (cut-out)`);
}

console.log(`Images ready (${done} processed) → ${outDir}`);
