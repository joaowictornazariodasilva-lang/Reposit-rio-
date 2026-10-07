// Verificações automáticas do episódio: `npm test`
// 1) timeline coerente  2) narração cabe nos slots  3) loop visual sem salto
// 4) loop de áudio sem clique  5) MP4 no formato do Shorts  6) página sem erros
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(ROOT, 'src/timeline.js'), 'utf8');
const TL = JSON.parse(src.slice(src.indexOf('{', src.indexOf('window.TIMELINE')), src.lastIndexOf('}') + 1));
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failed++; };

// 1) timeline
const audioPy = readFileSync(resolve(ROOT, 'scripts/audio.py'), 'utf8');
ok(TL.width / TL.height === 9 / 16, `formato 9:16 (${TL.width}x${TL.height})`);
ok(TL.duration >= 14 && TL.duration <= 16, `duração ~15 s (${TL.duration}s)`);
ok(Math.abs((TL.duration * TL.bpm) / 60 / 4 - Math.round((TL.duration * TL.bpm) / 60 / 4)) < 1e-9, 'música fecha em compassos inteiros (loop musical)');
const missingKeys = TL.sfx.filter((c) => !(c.k in TL.keys)).map((c) => c.k);
ok(missingKeys.length === 0, `todo efeito aponta para uma chave existente ${missingKeys.join(',')}`);
const missingSfx = [...new Set(TL.sfx.map((c) => c.s))].filter((s) => !audioPy.includes(`def sfx_${s}(`));
ok(missingSfx.length === 0, `todo efeito tem sintetizador ${missingSfx.join(',')}`);
ok(TL.keys.groundStart < 0.5 && TL.keys.bodyStart < 0.5, 'algo começa a ser desenhado antes de 0,5 s (hook)');

// 2) narração
const cuesPath = resolve(ROOT, 'assets/audio/cues.json');
ok(existsSync(cuesPath), 'cues.json existe (rode npm run audio)');
if (existsSync(cuesPath)) {
  const cues = JSON.parse(readFileSync(cuesPath, 'utf8'));
  const words = cues.reduce((a, c) => a + c.words, 0);
  ok(words >= 20 && words <= 35, `narração curta: ${words} palavras`);
  const overlaps = cues.slice(1).filter((c, i) => c.start < cues[i].end - 0.02).map((c) => c.id);
  ok(overlaps.length === 0, `nenhuma fala atropela a anterior ${overlaps.join(',')}`);
  ok(cues[0].start <= 0.5, `primeira fala começa cedo (${cues[0].start}s)`);
  ok(cues.at(-1).end <= TL.keys.rewind, `última fala termina antes do "rebobinar" (${cues.at(-1).end}s)`);
}

// 3) loop visual + 6) erros na página
const tmp = resolve(ROOT, 'build/check');
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: TL.width, height: TL.height } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(pathToFileURL(resolve(ROOT, 'src/index.html')).href + '?render=1');
await page.waitForFunction(() => window.sceneReady === true);
const snap = async (t, name) => {
  await page.evaluate((tt) => window.seek(tt), t);
  await page.screenshot({ path: resolve(tmp, name) });
  return resolve(tmp, name);
};
const first = await snap(0, 'first.png');
const last = await snap(TL.duration - 1 / TL.fps, 'last.png');
const mid = await snap(9.6, 'mid.png');
const ssim = (a, b) => {
  const r = spawnSync('ffmpeg', ['-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'], { encoding: 'utf8' });
  return Number(/All:([\d.]+)/.exec(r.stderr)[1]);
};
const sLoop = ssim(first, last), sMid = ssim(first, mid);
ok(sLoop > 0.98, `último quadro ≈ primeiro quadro (SSIM ${sLoop.toFixed(4)})`);
ok(sMid < sLoop, `sanidade: meio do vídeo difere do início (SSIM ${sMid.toFixed(4)})`);
for (let t = 0; t < TL.duration; t += 0.5) await page.evaluate((tt) => window.seek(tt), t);
ok(errors.length === 0, `página sem erros de JS ${errors.join(' | ')}`);
await browser.close();

// 4) loop de áudio
const mixPath = resolve(ROOT, 'assets/audio/mix.wav');
if (existsSync(mixPath)) {
  const buf = readFileSync(mixPath);
  const pcm = new Int16Array(buf.buffer, buf.byteOffset + 44, (buf.length - 44) >> 1);
  const dur = pcm.length / 48000;
  ok(Math.abs(dur - TL.duration) < 0.01, `áudio tem ${dur.toFixed(3)} s`);
  let maxStep = 0;
  for (let i = 1; i < pcm.length; i++) maxStep = Math.max(maxStep, Math.abs(pcm[i] - pcm[i - 1]));
  const wrapStep = Math.abs(pcm[0] - pcm[pcm.length - 1]);
  ok(wrapStep <= maxStep * 0.5, `emenda do loop de áudio sem clique (salto ${wrapStep} vs. máx. interno ${maxStep})`);
}

// 5) MP4
const mp4 = resolve(ROOT, `out/pituco-${TL.episode}.mp4`);
if (existsSync(mp4)) {
  const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], { encoding: 'utf8' }));
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  ok(v && v.width === TL.width && v.height === TL.height, `MP4 ${v?.width}x${v?.height}`);
  ok(v && v.r_frame_rate === `${TL.fps}/1`, `MP4 a ${v?.r_frame_rate} fps`);
  ok(!!a, 'MP4 tem áudio');
  const d = Number(info.format.duration);
  ok(Math.abs(d - TL.duration) < 0.1, `MP4 dura ${d.toFixed(2)} s`);
} else {
  console.log('… MP4 ainda não renderizado (npm run render) — verificação pulada');
}

console.log(failed ? `\n${failed} verificação(ões) falharam` : '\ntudo certo');
process.exit(failed ? 1 : 0);
