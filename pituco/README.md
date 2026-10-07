# Pituco 🌱⭐ — série infantil em animação 2D "desenhada na hora"

Episódio 01: **"Cadê a estrelinha?"** — 15 s, 9:16, loop perfeito, pronto para YouTube Shorts.

**Vídeo final:** [`out/pituco-ep01-estrelinha.mp4`](out/pituco-ep01-estrelinha.mp4) (1080×1920, 30 fps, H.264 + AAC, −14,8 LUFS)

## Documentos

- [Personagem, série e identidade visual](docs/01-personagem-e-serie.md)
- [Roteiro do ep. 01: narração, timeline, cenas, movimentos, sons, draw-on e loop](docs/02-roteiro-ep01.md)
- [10 próximos Shorts](docs/03-proximos-shorts.md)

## Como funciona

```
src/timeline.js   fonte única de verdade: tempos-chave, falas e efeitos
src/draw.js       traço "à mão": draw-on, line boil, curvas, mola, keyframes
src/scene.js      render(t): função pura do tempo → mesmo t, mesmo quadro
src/index.html    player (tocar/pausar, linha do tempo, zonas do Shorts) e modo ?render=1
scripts/tts.py    narração pt-BR (voz neural) → assets/voice/*.mp3 (versionados)
scripts/audio.py  efeitos + "voz" do Pituco + música original + mix circular → assets/audio/mix.wav
scripts/render.mjs captura quadro a quadro (Playwright) → ffmpeg → out/*.mp4
scripts/check.mjs testes: loop visual (SSIM), loop de áudio, sincronia das falas, formato do MP4
```

## Comandos

```bash
npm install
npm run dev        # abre o player em http://localhost:8080/src/
npm run voice      # (opcional, precisa de internet) regera a narração
npm run audio      # gera a trilha
npm run stills     # quadros-chave + folha de contato em build/stills/
npm run render     # exporta o MP4 (~3–4 min)
npm test           # 20 verificações
```

Chromium: usa `PW_CHROMIUM_PATH` ou `/opt/pw-browsers/chromium`. Precisa de `ffmpeg` e Python 3 com `numpy`, `scipy` e `edge-tts`.

## Trocar a voz por uma locutora humana

Grave as 12 frases de `docs/02-roteiro-ep01.md` (seção 6) como `assets/voice/n01.mp3` … `n12.mp3`,
rode `npm run audio && npm run render && npm test`. O teste avisa se alguma fala não couber no tempo dela.
