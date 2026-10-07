// Exporta o episódio quadro a quadro (Playwright + Chromium) e monta o MP4 com ffmpeg.
//   node scripts/render.mjs                 -> out/<episódio>.mp4 (1080x1920, 30 fps, áudio AAC)
//   node scripts/render.mjs --stills        -> build/stills/*.png + folha de contato
//   node scripts/render.mjs --stills 0,1.2  -> só esses instantes
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(ROOT, 'src/timeline.js'), 'utf8');
const TL = JSON.parse(src.slice(src.indexOf('{', src.indexOf('window.TIMELINE')), src.lastIndexOf('}') + 1));
const args = process.argv.slice(2);
const stillsMode = args.includes('--stills');

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: TL.width, height: TL.height }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(ROOT, 'src/index.html')).href + '?render=1');
await page.waitForFunction(() => window.sceneReady === true);
const shot = async (t) => {
  await page.evaluate((tt) => window.seek(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: TL.width, height: TL.height } });
};

if (stillsMode) {
  const dir = resolve(ROOT, 'build/stills');
  mkdirSync(dir, { recursive: true });
  const list = args[args.indexOf('--stills') + 1];
  const times = list && !list.startsWith('--') ? list.split(',').map(Number)
    : [0, 0.6, 1.0, 1.4, 1.8, 2.5, 3.5, 4.2, 4.9, 6.2, 7.8, 8.7, 9.6, 10.1, 10.7, 11.3, 12.4, 13.7, 14.2, 14.6, 14.8, 14.97];
  const files = [];
  for (const t of times) {
    const f = resolve(dir, `t${t.toFixed(2).padStart(5, '0')}.png`);
    await page.evaluate((tt) => window.seek(tt), t);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: TL.width, height: TL.height } });
    files.push(f);
  }
  // Folha de contato (6 colunas) para revisar o timing de relance
  const cols = 6, rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...files.flatMap((f) => ['-i', f]), '-filter_complex',
    files.map((_, i) => `[${i}:v]scale=270:480,drawtext=text='${times[i].toFixed(2)}s':x=8:y=8:fontsize=26:fontcolor=black:box=1:boxcolor=white@0.7[v${i}]`).join(';') + ';' +
    files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=` +
    files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|') + `:fill=gray[out]`,
    '-map', '[out]', '-frames:v', '1', resolve(dir, 'contact-sheet.png')]);
  console.log(`stills: ${files.length} quadros + contact-sheet.png em build/stills (${rows} linhas)`);
} else {
  const audio = resolve(ROOT, 'assets/audio/mix.wav');
  if (!existsSync(audio)) throw new Error('assets/audio/mix.wav não existe — rode `npm run audio` antes.');
  mkdirSync(resolve(ROOT, 'out'), { recursive: true });
  const out = resolve(ROOT, `out/pituco-${TL.episode}.mp4`);
  const total = Math.round(TL.duration * TL.fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-i', '-', '-i', audio,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(TL.duration), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const png = await shot(i / TL.fps);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) process.stdout.write(`\rquadro ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg falhou: ' + c)))));
  console.log(`\nok: ${out} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
await browser.close();
