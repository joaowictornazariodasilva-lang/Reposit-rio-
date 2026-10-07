// Episódio 01 — "Cadê a estrelinha?"
// render(t) é uma função pura do tempo: o mesmo t produz sempre o mesmo quadro.
// Isso permite tocar ao vivo (sincronizado com o áudio) e exportar quadro a quadro.
(function () {
  const { clamp, lerp, prog, ease, noise, boil, jitter, smooth, sketchLoop, ring, mk, show, drawOn, setT, kf, step, spring, pop } = window.Draw;
  const TL = window.TIMELINE;
  const K = TL.keys;
  const BEAT = 60 / TL.bpm;

  // ---- Tokens visuais (ver docs/01-personagem-e-serie.md) ----
  const C = {
    paper: '#FFF6E6', ink: '#2E2A47',
    body: '#FF8A4C', belly: '#FFB98A', foot: '#E8622E', cheek: '#FF6B8B',
    leaf: '#5CC45E', star: '#FFD23F', mouth: '#7A2E3B', tongue: '#FF8796',
    blue: '#3D8BFF', pink: '#FF4F9A', green: '#2FB36B', white: '#FFFFFF',
  };
  const INK_W = 10;

  // ---- Geografia da cena (px no quadro 1080x1920) ----
  const GROUND_Y = 1402;
  const PX = 540;                 // Pituco: x dos pés
  const PS = 1.45;                // escala do Pituco no quadro (legibilidade no celular)
  const SS = 1.4;                 // escala da estrelinha
  const STAR0 = [660, 430];       // estrelinha no céu (início e fim do loop)
  const STAR_R = 64;              // raio no desenho base (antes de SS)
  const STAR_UP = 55 * SS;        // distância do topo do caracol até o centro da estrela
  const CURL_R = 20;
  const SPROUT_L = 105;           // brotinho em repouso
  const LEAF_D = [150, 290, 430]; // alturas das folhas/números ao contar

  let svg, L = {}, N = {};

  // ---------- Montagem dos nós SVG (uma vez) ----------
  function build(root) {
    svg = root;
    const defs = mk('defs', svg);
    const paperPattern = mk('pattern', defs, { id: 'paperTex', width: 256, height: 256, patternUnits: 'userSpaceOnUse' });
    mk('image', paperPattern, { href: paperTexture(), width: 256, height: 256 });
    const vg = mk('radialGradient', defs, { id: 'vignette', cx: '50%', cy: '45%', r: '75%' });
    mk('stop', vg, { offset: '60%', 'stop-color': '#000', 'stop-opacity': 0 });
    mk('stop', vg, { offset: '100%', 'stop-color': '#7a5a2a', 'stop-opacity': 0.10 });

    mk('rect', svg, { width: 1080, height: 1920, fill: C.paper });
    mk('rect', svg, { width: 1080, height: 1920, fill: 'url(#paperTex)', opacity: 0.55 });
    mk('rect', svg, { width: 1080, height: 1920, fill: 'url(#vignette)' });

    for (const name of ['sky', 'ground', 'numbers', 'stalk', 'pituco', 'star', 'fx']) L[name] = mk('g', svg, { id: name });

    const inkStroke = (parent, w = INK_W) => mk('path', parent, { fill: 'none', stroke: C.ink, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const fillPath = (parent, color) => mk('path', parent, { fill: color, stroke: 'none' });

    // Céu: nuvem
    N.cloudG = mk('g', L.sky);
    N.cloudFill = fillPath(N.cloudG, C.white);
    N.cloudInk = inkStroke(N.cloudG, 9);

    // Chão
    N.shadow = mk('ellipse', L.ground, { fill: C.ink, opacity: 0.12 });
    N.ground = inkStroke(L.ground, 9);
    N.grass = [0, 1, 2].map(() => inkStroke(L.ground, 8));
    N.flowerG = mk('g', L.ground);
    N.flowerStem = mk('path', N.flowerG, { fill: 'none', stroke: C.green, 'stroke-width': 7, 'stroke-linecap': 'round' });
    N.flowerHead = mk('circle', N.flowerG, { r: 13, fill: C.pink, stroke: C.ink, 'stroke-width': 6 });

    // Números contados (desenhados, não digitados)
    N.nums = [0, 1, 2].map(() => {
      const g = mk('g', L.numbers);
      const ink = inkStroke(g, 46);
      const col = mk('path', g, { fill: 'none', 'stroke-width': 28, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      return { g, ink, col };
    });
    N.numRings = [0, 1, 2].map(() => mk('circle', L.fx, { fill: 'none', 'stroke-width': 8 }));

    // Caule / brotinho (mundo) + folhas
    N.stalkInk = inkStroke(L.stalk, 34);
    N.stalkCol = mk('path', L.stalk, { fill: 'none', stroke: C.leaf, 'stroke-width': 17, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    N.leaves = [0, 1, 2, 3, 4].map(() => {
      const g = mk('g', L.stalk);
      mk('path', g, { d: 'M0,0 C16,-26 48,-28 68,-2 C48,20 16,20 0,0 Z', fill: C.leaf, stroke: C.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' });
      mk('path', g, { d: 'M8,-1 Q30,-4 52,-2', fill: 'none', stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.55 });
      return g;
    });

    // Pituco (coordenadas locais: origem no chão entre os pés)
    N.pit = mk('g', L.pituco);
    N.armInk = [0, 1].map(() => inkStroke(N.pit, 36));
    N.armCol = [0, 1].map(() => mk('path', N.pit, { fill: 'none', stroke: C.body, 'stroke-width': 18, 'stroke-linecap': 'round' }));
    N.feet = [0, 1].map(() => {
      const g = mk('g', N.pit);
      mk('ellipse', g, { rx: 38, ry: 18, fill: C.foot, stroke: C.ink, 'stroke-width': 8 });
      return g;
    });
    N.bodyFillG = mk('g', N.pit);
    N.bodyFill = fillPath(N.bodyFillG, C.body);
    N.belly = mk('ellipse', N.bodyFillG, { cx: 4, cy: -92, rx: 64, ry: 44, fill: C.belly });
    N.bodyInk = inkStroke(N.pit, INK_W);
    N.shine = mk('path', N.pit, { fill: 'none', stroke: C.white, 'stroke-width': 11, 'stroke-linecap': 'round', opacity: 0.75 });
    N.cheeks = [0, 1].map(() => mk('ellipse', N.pit, { rx: 19, ry: 11, fill: C.cheek, opacity: 0.85 }));
    N.eyes = [0, 1].map(() => {
      const g = mk('g', N.pit);
      const open = mk('g', g);
      const white = fillPath(open, C.white);
      const ink = inkStroke(open, 8);
      const pupil = mk('circle', open, { r: 16, fill: C.ink });
      const hl = mk('circle', open, { r: 5.5, fill: C.white });
      const happy = mk('path', g, { d: 'M-22,6 Q0,-22 22,6', fill: 'none', stroke: C.ink, 'stroke-width': 9, 'stroke-linecap': 'round' });
      return { g, open, white, ink, pupil, hl, happy };
    });
    N.mouthG = mk('g', N.pit);
    N.mouthFill = mk('path', N.mouthG, { fill: C.mouth, stroke: C.ink, 'stroke-width': 7, 'stroke-linejoin': 'round' });
    N.tongue = mk('ellipse', N.mouthG, { cx: 0, cy: 16, rx: 13, ry: 7, fill: C.tongue });
    N.mouthLine = inkStroke(N.mouthG, 8);

    // Estrelinha
    N.starG = mk('g', L.star);
    N.starFill = fillPath(N.starG, C.star);
    N.starInk = inkStroke(N.starG, 8);
    N.starShine = mk('path', N.starG, { d: 'M-30,-14 Q-26,-26 -16,-32', fill: 'none', stroke: C.white, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 });
    N.starEyes = [0, 1].map(() => mk('ellipse', N.starG, { rx: 5.5, ry: 8, fill: C.ink }));
    N.starWink = mk('path', N.starG, { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
    N.starMouth = mk('path', N.starG, { fill: 'none', stroke: C.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
    N.starCheeks = [0, 1].map(() => mk('ellipse', N.starG, { rx: 7, ry: 4.5, fill: C.cheek, opacity: 0.8 }));

    // Efeitos
    N.glints = [0, 1, 2, 3].map(() => mk('path', L.fx, { fill: 'none', stroke: C.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }));
    N.rings = [0, 1].map(() => mk('circle', L.fx, { fill: 'none', 'stroke-width': 8 }));
    N.parts = Array.from({ length: 16 }, () => mk('path', L.fx, { stroke: C.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
    N.lines = Array.from({ length: 3 }, () => mk('path', L.fx, { fill: 'none', stroke: C.ink, 'stroke-width': 7, 'stroke-linecap': 'round' }));
  }

  // Textura de papel determinística (gerada uma vez, sem arquivo externo).
  function paperTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = 128 + 70 * noise(7, i) * (0.6 + 0.4 * noise(11, i >> 3));
      img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.95; img.data[i * 4 + 2] = v * 0.85;
      img.data[i * 4 + 3] = 22;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  // ---------- Formas ----------
  const bean = (th) => {
    const s = Math.sin(th), c = Math.cos(th);
    const yy = s > 0 ? Math.pow(s, 0.78) : s;
    return [118 * (1 + 0.08 * s) * c, -150 + 140 * yy];
  };
  const starPt = (i, R = STAR_R) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? R * 0.56 : R;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const starPts = () => Array.from({ length: 10 }, (_, i) => starPt(i));
  const cloud = (th) => {
    const bump = th > Math.PI ? 0.22 * Math.abs(Math.sin(th * 3)) : 0.05 * Math.abs(Math.sin(th * 2));
    return [100 * Math.cos(th) * (1 + bump * 0.6), 46 * Math.sin(th) * (1 + bump * 1.6)];
  };
  const NUM_GLYPH = [
    'M30,52 Q52,36 70,12 L70,192',
    'M16,62 C16,8 106,6 106,62 C106,108 44,140 14,190 L112,190',
    'M18,40 C40,0 106,6 102,52 C99,86 72,96 52,98 C78,98 110,112 108,150 C106,198 40,206 14,170',
  ];
  const NUM_COLORS = [C.blue, C.pink, C.green];
  const NUM_POS = [[235, 1010], [205, 800], [245, 590]]; // coluna levemente torta, de baixo para cima

  // ---------- Estado do Pituco ----------
  function pose(t) {
    let y = 0, sy = 1, rot = 0;
    const jumps = [[K.jump1, 0.48, 120], [K.jump2, 0.55, 190], [K.hop1, 0.42, 90], [K.hop2, 0.42, 90]];
    for (const [t0, d, h] of jumps) {
      if (t >= t0 - 0.1 && t < t0) sy = 1 - 0.12 * Math.sin(((t - t0 + 0.1) / 0.1) * Math.PI / 2);
      else if (t >= t0 && t < t0 + d) {
        const p = (t - t0) / d;
        y = -h * 4 * p * (1 - p);
        sy = 1 + 0.1 * (1 - Math.sin(p * Math.PI));
      } else if (t >= t0 + d && t < t0 + d + 0.35) sy = 1 - 0.16 * Math.exp(-(t - t0 - d) * 9) * Math.cos((t - t0 - d) * 26);
    }
    // nas pontas dos pés tentando alcançar
    sy *= 1 + 0.045 * Math.sin(Math.PI * prog(t, K.reach, K.jump1 - 0.1));
    // balança no ritmo enquanto chama a criança
    if (t > K.perk && t < K.count1 - 0.05) y -= 14 * Math.abs(Math.sin(((t - K.perk) * Math.PI) / BEAT));
    // "força" a cada número
    for (const tc of [K.count1, K.count2, K.count3]) sy *= 1 + spring(t, tc, 0.09, 24, 7);
    sy *= 1 + spring(t, K.perk, 0.08, 26, 7);
    if (t > K.giggle && t < K.giggle + 0.6) rot = 5 * Math.sin((t - K.giggle) * 36) * (1 - (t - K.giggle) / 0.6);
    return { y, sy, sx: 2 - sy, rot };
  }

  const LOOK = [[0, 0, 0], [1.55, 0, 0], [1.7, 5, -11], [K.sad - 0.05, 5, -11], [K.sad + 0.1, -2, 9], [K.perk, -2, 9], [K.perk + 0.12, 0, 0],
    [K.count1 - 0.1, 0, 0], [K.count1 + 0.05, 3, -12], [K.reelEnd - 0.1, 3, -12], [K.reelEnd + 0.05, 0, -6], [K.giggle - 0.1, 0, -6],
    [K.giggle, 0, 0], [K.starHop - 0.05, 0, 0], [K.starHop + 0.1, 6, -12], [15, 6, -12]];
  const EYE_BIG = [[0, 1], [1.6, 1], [1.72, 1.14], [2.1, 1], [K.perk, 1], [K.perk + 0.1, 1.1], [K.count1 - 0.1, 1.1], [K.count1, 1],
    [K.reachStar - 0.1, 1], [K.reachStar, 1.16], [K.reelStart, 1.16], [K.reelStart + 0.2, 1.05], [15, 1.05]];
  const BLINKS = [2.75, 6.45, 13.25];
  const MOUTH = [[0, 'smile'], [1.62, 'o'], [2.05, 'smile'], [K.jump1 - 0.1, 'oSmall'], [K.sad, 'sad'], [K.perk, 'smile'],
    [K.count1 - 0.05, 'o'], [K.reachStar, 'grin'], [K.starHop - 0.05, 'o']];
  // mãos: [t, xEsq, yEsq, xDir, yDir]
  const HANDS = [[0, -152, -88, 152, -88], [K.reach - 0.05, -152, -88, 152, -88], [K.reach + 0.18, -150, -262, 150, -272],
    [K.sad - 0.05, -140, -282, 140, -290], [K.sad + 0.15, -126, -62, 126, -62], [K.perk, -126, -62, 126, -62],
    [K.perk + 0.15, -168, -128, 168, -128], [K.count1 - 0.1, -168, -128, 168, -128], [K.count1 + 0.08, -158, -236, 158, -236],
    [K.reachStar, -158, -236, 158, -236], [K.reachStar + 0.15, -150, -262, 150, -262], [K.reelEnd, -150, -262, 150, -262],
    [K.reelEnd + 0.12, -178, -246, 178, -246], [K.giggle - 0.1, -178, -246, 178, -246], [K.giggle + 0.05, -154, -92, 154, -92],
    [K.starHop - 0.05, -154, -92, 154, -92], [K.starHop + 0.15, -150, -262, 150, -272], [15, -150, -262, 150, -272]];

  // Comprimento do caule ao longo do tempo
  function stalkLen(t, Lfull) {
    if (t < K.count1) return SPROUT_L;
    const grow = (a, from, to, d = 0.34) => lerp(from, to, ease.outBack(prog(t, a, a + d), 1.4));
    if (t < K.count2) return grow(K.count1, SPROUT_L, LEAF_D[0] + 50);
    if (t < K.count3) return grow(K.count2, LEAF_D[0] + 50, LEAF_D[1] + 50);
    if (t < K.reelStart) return lerp(LEAF_D[1] + 50, Lfull, ease.out(prog(t, K.count3, K.reachStar)));
    return lerp(Lfull, SPROUT_L, ease.inOut(prog(t, K.reelStart, K.reelEnd)));
  }

  // Pontos do caule em coordenadas do mundo
  function stalkPts(t, base, len, Lfull) {
    const grow = clamp((len - SPROUT_L) / (Lfull - SPROUT_L));
    const tipOff = lerp(26, STAR0[0] - CURL_R - base[0], grow);
    const sway = 22 * clamp((len - SPROUT_L) / 260) * (1 - 0.6 * grow);
    const stem = [];
    const n = 8 + Math.round(len / 40);
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      stem.push([base[0] + tipOff * s * s + sway * Math.sin(Math.PI * 2 * s + t * 2.4), base[1] - s * len]);
    }
    const tip = stem[stem.length - 1];
    const c = [tip[0] + CURL_R, tip[1]];
    const curl = [];
    for (let i = 1; i <= 9; i++) {
      const a = Math.PI + (i / 9) * 1.6 * Math.PI;
      const r = CURL_R * (1 - 0.5 * (i / 9));
      curl.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
    }
    // inclinação (murchar / mola) em torno da base, maior na ponta
    let bend = 0.05 * Math.sin(t * 3.1);
    bend += spring(t, K.sproutEnd, 0.32, 24, 6);
    bend += 1.25 * ease.out(prog(t, K.sad, K.sad + 0.35)) * (t < K.perk ? 1 : 0);
    if (t >= K.perk) bend += 1.25 * Math.exp(-(t - K.perk) * 9) * Math.cos((t - K.perk) * 20) * (t < K.perk + 0.8 ? 1 : 0);
    for (const [j0, d] of [[K.jump1, 0.48], [K.jump2, 0.55], [K.hop1, 0.42], [K.hop2, 0.42]]) bend += spring(t, j0 + d, 0.22, 20, 6);
    const all = stem.concat(curl);
    const total = all.length - 1;
    const out = all.map((p, i) => {
      const s = Math.min(1, (i / total) * 1.05);
      const a = bend * Math.pow(s, 1.6) * (1 - 0.85 * grow);
      const dx = p[0] - base[0], dy = p[1] - base[1];
      return [base[0] + dx * Math.cos(a) - dy * Math.sin(a), base[1] + dx * Math.sin(a) + dy * Math.cos(a)];
    });
    return { pts: out, stemCount: stem.length, top: out[stem.length + 2] };
  }

  // Ponto e ângulo do caule a uma distância d da base
  function along(pts, stemCount, d, len) {
    const s = clamp(d / len) * (stemCount - 1);
    const i = Math.min(stemCount - 2, Math.floor(s));
    const p = s - i;
    const a = pts[i], b = pts[i + 1];
    return { p: [lerp(a[0], b[0], p), lerp(a[1], b[1], p)], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }

  // Visibilidade "rebobinar": 1 até a, 0 depois de b.
  const unwind = (t, a, b) => 1 - ease.in(prog(t, a, b));

  // ---------- Quadro ----------
  function render(t) {
    t = ((t % TL.duration) + TL.duration) % TL.duration;
    const B = boil(t);
    const R = K.rewind;

    // Chão
    const gp = [];
    for (let x = 60; x <= 1020; x += 40) gp.push([x, GROUND_Y + 5 * Math.sin(x / 130)]);
    drawOn(N.ground, smooth(jitter(gp, 1 + B, 1.6)), Math.min(ease.inOut(prog(t, K.groundStart, K.groundEnd)), unwind(t, 14.72, K.rewindEnd)));
    const tufts = [[190, 0], [820, 0.08], [890, 0.16]];
    tufts.forEach(([x, dly], i) => {
      const d = smooth(jitter([[x - 16, GROUND_Y - 22], [x - 6, GROUND_Y - 2], [x, GROUND_Y - 30], [x + 6, GROUND_Y - 2], [x + 16, GROUND_Y - 22]], 20 + i + B, 1.2));
      drawOn(N.grass[i], d, Math.min(prog(t, K.grass + dly, K.grass + dly + 0.15), unwind(t, 14.6, 14.72)));
    });
    const fl = pop(t, K.grass + 0.25) * unwind(t, 14.6, 14.72);
    if (show(N.flowerG, fl > 0.01)) {
      setT(N.flowerG, 960 - 210, GROUND_Y, fl);
      N.flowerStem.setAttribute('d', 'M0,0 Q4,-24 0,-44');
      N.flowerHead.setAttribute('cy', -52);
    }

    // Nuvem (deriva em ciclo exato de 15 s)
    const cv = Math.min(prog(t, K.cloud, K.cloud + 0.35), unwind(t, 14.5, 14.7));
    if (show(N.cloudG, cv > 0.002)) {
      setT(N.cloudG, 225 + 14 * Math.sin((t / TL.duration) * Math.PI * 2), 330, 1.3);
      N.cloudFill.setAttribute('d', smooth(jitter(ring(cloud, 22), 40 + B, 1.5), true));
      N.cloudFill.setAttribute('transform', 'translate(6,6)');
      N.cloudFill.style.opacity = ease.out(prog(t, K.cloud + 0.2, K.cloud + 0.4)) * unwind(t, 14.5, 14.62);
      drawOn(N.cloudInk, smooth(jitter(sketchLoop(cloud, 26, Math.PI), 41 + B, 1.6)), cv);
    }

    // Pituco
    const P = pose(t);
    const tFrozen = Math.min(t, R); // durante o "rebobinar" a pose congela
    const Pf = t > R ? pose(R) : P;
    N.pit.setAttribute('transform', `translate(${PX},${GROUND_Y + Pf.y}) rotate(${Pf.rot}) scale(${Pf.sx * PS},${Pf.sy * PS})`);

    const shadowV = Math.min(prog(t, K.fillIn, K.fillIn + 0.2), unwind(t, 14.6, 14.75));
    show(N.shadow, shadowV > 0.01);
    N.shadow.setAttribute('cx', PX); N.shadow.setAttribute('cy', GROUND_Y + 6);
    N.shadow.setAttribute('rx', 115 * PS * (1 + Pf.y / 500)); N.shadow.setAttribute('ry', 16 * (1 + Pf.y / 500));
    N.shadow.setAttribute('opacity', 0.12 * shadowV);

    // corpo: contorno desenhado + preenchimento "fora de registro"
    drawOn(N.bodyInk, smooth(jitter(sketchLoop(bean, 30, -Math.PI / 2 - 0.5, 0.12), 60 + B, 1.8)),
      Math.min(ease.inOut(prog(t, K.bodyStart, K.bodyEnd)), unwind(t, 14.55, 14.8)));
    const fillV = Math.min(ease.out(prog(t, K.fillIn, K.fillIn + 0.25)), unwind(t, 14.55, 14.7));
    if (show(N.bodyFillG, fillV > 0.01)) {
      N.bodyFill.setAttribute('d', smooth(jitter(ring(bean, 26), 61 + B, 1.5), true));
      N.bodyFillG.setAttribute('transform', `translate(7,6) translate(0,-150) scale(${0.8 + 0.2 * fillV}) translate(0,150)`);
      N.bodyFillG.style.opacity = fillV;
    }
    const shineV = Math.min(prog(t, K.fillIn + 0.15, K.fillIn + 0.35), unwind(t, 14.5, 14.6));
    drawOn(N.shine, smooth(jitter(Array.from({ length: 5 }, (_, i) => { const a = 3.55 + i * 0.12; return [86 * Math.cos(a), -150 + 100 * Math.sin(a)]; }), 62 + B, 1)), shineV);

    // pés
    N.feet.forEach((g, i) => {
      const s = pop(t, K.feet + i * 0.06) * unwind(t, 14.6, 14.7);
      if (show(g, s > 0.01)) setT(g, (i ? 1 : -1) * 52, -6, s);
    });

    // bochechas
    N.cheeks.forEach((e, i) => {
      const s = pop(t, K.cheeks + i * 0.05) * unwind(t, 14.45, 14.58);
      if (show(e, s > 0.01)) setT(e, (i ? 1 : -1) * 82, -140, s);
    });

    // olhos
    const [lx, ly] = kf(tFrozen, LOOK);
    const big = kf(tFrozen, EYE_BIG)[0];
    const happy = t >= K.reelEnd + 0.02 && t < K.giggle - 0.1;
    let blink = 1;
    for (const tb of BLINKS) blink = Math.min(blink, 1 - 0.9 * Math.sin(Math.PI * prog(t, tb, tb + 0.14)));
    N.eyes.forEach((E, i) => {
      const s = pop(t, K.eyes + i * 0.05, 0.3) * unwind(t, 14.48, 14.62);
      if (!show(E.g, s > 0.01)) return;
      E.g.setAttribute('transform', `translate(${(i ? 1 : -1) * 44},-190) scale(${s * big},${s * big * (happy ? 1 : blink)})`);
      show(E.open, !happy);
      show(E.happy, happy);
      if (!happy) {
        const eye = (th) => [30 * Math.cos(th), 38 * Math.sin(th)];
        E.white.setAttribute('d', smooth(jitter(ring(eye, 14), 70 + i + B, 1), true));
        drawOn(E.ink, smooth(jitter(sketchLoop(eye, 16, -Math.PI / 2, 0.1), 72 + i + B, 1.1)), 1);
        E.pupil.setAttribute('cx', lx); E.pupil.setAttribute('cy', ly + 4);
        E.hl.setAttribute('cx', lx + 6); E.hl.setAttribute('cy', ly - 3);
      }
    });

    // boca
    const mood = step(tFrozen, MOUTH);
    const mV = t < K.mouth + 0.2 ? prog(t, K.mouth, K.mouth + 0.15) : unwind(t, 14.45, 14.58);
    if (show(N.mouthG, mV > 0.002)) {
      N.mouthG.setAttribute('transform', 'translate(0,-128)');
      const isFill = mood === 'o' || mood === 'oSmall' || mood === 'grin';
      show(N.mouthFill, isFill); show(N.tongue, mood === 'grin'); show(N.mouthLine, !isFill);
      if (mood === 'o') N.mouthFill.setAttribute('d', smooth(ring((a) => [13 * Math.cos(a), 4 + 16 * Math.sin(a)], 10), true));
      if (mood === 'oSmall') N.mouthFill.setAttribute('d', smooth(ring((a) => [9 * Math.cos(a), 2 + 10 * Math.sin(a)], 10), true));
      if (mood === 'grin') N.mouthFill.setAttribute('d', 'M-38,-6 Q0,-12 38,-6 Q30,40 0,40 Q-30,40 -38,-6 Z');
      if (mood === 'smile') drawOn(N.mouthLine, 'M-24,-4 Q0,22 24,-4', mV);
      if (mood === 'sad') drawOn(N.mouthLine, 'M-20,12 Q0,-6 20,12', mV);
      N.mouthG.style.opacity = isFill ? mV : 1;
    }

    // braços (atrás do corpo; só as mãos aparecem)
    const H = kf(tFrozen, HANDS);
    const wig = (t > K.reach && t < K.sad) || (t > K.reelEnd && t < K.giggle) ? 8 * Math.sin(t * 22) : 0;
    const armV = Math.min(ease.out(prog(t, K.arms, K.arms + 0.22)), unwind(t, 14.42, 14.58));
    [0, 1].forEach((i) => {
      const sgn = i ? 1 : -1;
      const sh = [sgn * 92, -150];
      const hd = [H[i * 2], H[i * 2 + 1] + (i ? -wig : wig)];
      const mid = [(sh[0] + hd[0]) / 2 + sgn * 16, (sh[1] + hd[1]) / 2 + 10];
      const d = `M${sh[0]},${sh[1]} Q${mid[0]},${mid[1]} ${hd[0]},${hd[1]}`;
      drawOn(N.armInk[i], d, armV);
      drawOn(N.armCol[i], d, armV);
    });

    // Caule / brotinho — base no topo da cabeça
    const base = [PX + Math.sin((Pf.rot * Math.PI) / 180) * 290 * PS, GROUND_Y + Pf.y - 284 * Pf.sy * PS];
    const Lfull = base[1] - (STAR0[1] + STAR_UP + CURL_R * 0.83);
    const len = stalkLen(tFrozen, Lfull);
    const S = stalkPts(tFrozen, base, len, Lfull);
    const sproutV = Math.min(ease.inOut(prog(t, K.sprout, K.sproutEnd)), unwind(t, 14.5, 14.68));
    const sd = smooth(jitter(S.pts, 80 + B, 1.2));
    drawOn(N.stalkInk, sd, sproutV);
    drawOn(N.stalkCol, sd, sproutV);
    const leafSpec = [[62, -1, K.sproutEnd - 0.05, 1], [62, 1, K.sproutEnd + 0.03, 1],
      [LEAF_D[0], -1, K.count1 + 0.12, 1.3], [LEAF_D[1], 1, K.count2 + 0.12, 1.3], [LEAF_D[2], -1, K.count3 + 0.18, 1.3]];
    N.leaves.forEach((g, i) => {
      const [d, side, t0, size] = leafSpec[i];
      const s = size * pop(t, t0) * clamp((len - d) / 30) * unwind(t, 14.5, 14.62);
      if (!show(g, s > 0.01)) return;
      const a = along(S.pts, S.stemCount, d, len);
      const ang = (a.ang * 180) / Math.PI + side * 50 + 3 * Math.sin(t * 4 + i);
      g.setAttribute('transform', `translate(${a.p[0].toFixed(1)},${a.p[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${s.toFixed(3)},${(s * side).toFixed(3)})`);
    });

    // Estrelinha
    const bob = 7 * Math.sin((t / (BEAT * 4)) * Math.PI * 2);
    let sp = [STAR0[0], STAR0[1] + bob], sRot = 6 * Math.sin((t / (BEAT * 8)) * Math.PI * 2), sSc = 1 + 0.04 * Math.sin((t / (BEAT * 2)) * Math.PI * 2);
    const riding = t >= K.reachStar && t < K.starHop;
    if (riding) {
      const k = prog(t, K.reachStar, K.reachStar + 0.25);
      sp = [lerp(STAR0[0], S.top[0], k), lerp(STAR0[1] + bob, S.top[1] - STAR_UP, k)];
      sRot = lerp(sRot, 0, k) + 8 * spring(t, K.reelEnd, 1, 18, 6);
      sSc = 1 + spring(t, K.reachStar, 0.14, 26, 7) + spring(t, K.reelEnd, 0.18, 26, 7);
    } else if (t >= K.starHop && t < K.starHopEnd + 0.4) {
      const p = ease.inOut(prog(t, K.starHop, K.starHopEnd));
      const from = [S.top[0], S.top[1] - STAR_UP];
      const to = [STAR0[0], STAR0[1] + bob];
      sp = [lerp(from[0], to[0], p), lerp(from[1], to[1], p) - 120 * Math.sin(Math.PI * p)];
      sRot = lerp(0, 360, p) + sRot * p;
      sSc = 1 + 0.12 * Math.sin(Math.PI * p) + spring(t, K.starHopEnd, 0.12, 24, 8);
    }
    setT(N.starG, sp[0], sp[1], sSc * SS, sRot);
    N.starFill.setAttribute('d', smooth(jitter(starPts(), 90 + B, 1.2), true));
    N.starFill.setAttribute('transform', 'translate(5,5)');
    drawOn(N.starInk, smooth(jitter(starPts().concat([starPt(0, STAR_R * 1.02), starPt(1, STAR_R * 1.03)]), 91 + B, 1.4)), 1);
    const starSurprised = t >= K.count3 && t < K.reachStar + 0.1;
    const winking = t >= K.wink && t < K.wink + 0.4;
    N.starEyes.forEach((e, i) => {
      e.setAttribute('cx', (i ? 1 : -1) * 15); e.setAttribute('cy', -4);
      e.setAttribute('ry', starSurprised ? 10 : 8);
      show(e, !(winking && i === 1));
    });
    show(N.starWink, winking);
    N.starWink.setAttribute('d', 'M8,-3 Q15,-12 22,-3');
    N.starMouth.setAttribute('d', starSurprised ? 'M-5,13 Q0,6 5,13 Q0,20 -5,13' : 'M-11,9 Q0,20 11,9');
    N.starCheeks.forEach((e, i) => { e.setAttribute('cx', (i ? 1 : -1) * 25); e.setAttribute('cy', 10); });

    // Números 1, 2, 3 desenhados ao lado do caule, na altura que ele alcança
    [K.count1, K.count2, K.count3].forEach((tc, i) => {
      const nn = N.nums[i];
      const v = Math.min(ease.out(prog(t, tc, tc + 0.24)), 1 - ease.in(prog(t, K.reelStart - 0.15 + i * 0.06, K.reelStart + 0.1 + i * 0.06)));
      if (!show(nn.g, v > 0.002)) return;
      const [nx, y] = NUM_POS[i];
      const sc = 0.7 * (1 + spring(t, tc, 0.25, 20, 8)) * (t > K.reelStart - 0.15 ? v : 1);
      nn.g.setAttribute('transform', `translate(${nx},${y}) rotate(${-6 + i * 5}) scale(${sc}) translate(-60,-100)`);
      nn.col.setAttribute('stroke', NUM_COLORS[i]);
      drawOn(nn.ink, NUM_GLYPH[i], Math.min(1, v * 1.02));
      drawOn(nn.col, NUM_GLYPH[i], v);
      const rp = prog(t, tc + 0.05, tc + 0.45);
      const ringEl = N.numRings[i];
      if (show(ringEl, rp > 0 && rp < 1)) {
        ringEl.setAttribute('cx', nx); ringEl.setAttribute('cy', y);
        ringEl.setAttribute('r', 70 + 70 * ease.out(rp));
        ringEl.setAttribute('stroke', NUM_COLORS[i]);
        ringEl.setAttribute('opacity', 1 - rp);
      }
    });

    // ---------- Efeitos ----------
    // brilhos curtos ao redor da estrela
    const glintAt = [0, K.twinkle, K.reachStar, K.wink, K.starHopEnd];
    let g0 = -1;
    for (const tg of glintAt) if (t >= tg && t < tg + 0.45) g0 = tg;
    N.glints.forEach((el, i) => {
      if (!show(el, g0 >= 0)) return;
      const p = prog(t, g0, g0 + 0.45);
      const a = -Math.PI / 4 + (i * Math.PI) / 2 + 0.3;
      const r0 = STAR_R * SS + 16 + 34 * ease.out(p), r1 = r0 + 34 * (1 - p);
      el.setAttribute('d', `M${sp[0] + r0 * Math.cos(a)},${sp[1] + r0 * Math.sin(a)} L${sp[0] + r1 * Math.cos(a)},${sp[1] + r1 * Math.sin(a)}`);
      el.setAttribute('opacity', 1 - ease.in(p));
    });
    // anéis de impacto
    [[K.reachStar, C.star], [K.reelEnd, C.pink]].forEach(([tr, col], i) => {
      const p = prog(t, tr, tr + 0.5);
      const el = N.rings[i];
      if (!show(el, p > 0 && p < 1)) return;
      el.setAttribute('cx', sp[0]); el.setAttribute('cy', sp[1]);
      el.setAttribute('r', STAR_R * SS + 150 * ease.out(p));
      el.setAttribute('stroke', col); el.setAttribute('opacity', 1 - p);
    });
    // explosão de estrelinhas quando a estrela chega
    const bp = prog(t, K.reelEnd, K.reelEnd + 0.9);
    const palette = [C.pink, C.blue, C.star, C.green];
    N.parts.forEach((el, i) => {
      if (!show(el, bp > 0 && bp < 1)) return;
      const a = (i / N.parts.length) * Math.PI * 2 + 0.2 * noise(5, i);
      const dist = (200 + 130 * (noise(6, i) * 0.5 + 0.5)) * ease.out(bp);
      const x = sp[0] + dist * Math.cos(a), y = sp[1] + dist * Math.sin(a) + 120 * bp * bp;
      const r = (i % 2 ? 12 : 24) * (1 - bp * 0.6);
      const d = i % 2
        ? `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`
        : smooth(Array.from({ length: 8 }, (_, k) => { const aa = (k * Math.PI) / 4 + bp * 4; const rr = k % 2 ? r * 0.4 : r; return [x + rr * Math.cos(aa), y + rr * Math.sin(aa)]; }), true);
      el.setAttribute('d', d);
      el.setAttribute('fill', palette[i % 4]);
      el.setAttribute('opacity', 1 - ease.in(bp));
    });
    // linhas de movimento: pulos e estrela descendo
    N.lines.forEach((el, i) => {
      let d = null, o = 0;
      for (const [j0, dur] of [[K.jump1, 0.48], [K.jump2, 0.55]]) {
        const p = prog(t, j0, j0 + dur * 0.6);
        if (p > 0 && p < 1) {
          const x = PX - 80 + i * 80, y = GROUND_Y + P.y + 34;
          d = `M${x},${y} L${x},${y + 50 - 30 * p}`; o = 1 - p;
        }
      }
      const rp = prog(t, K.reelStart + 0.1, K.reelEnd);
      if (rp > 0 && rp < 1) {
        const x = sp[0] - 80 + i * 80, y = sp[1] - 80 - i * 15;
        d = `M${x},${y} L${x},${y - 70}`; o = Math.sin(Math.PI * rp);
      }
      if (show(el, !!d)) { el.setAttribute('d', d); el.setAttribute('opacity', o); }
    });
  }

  window.Scene = { build, render };
})();
