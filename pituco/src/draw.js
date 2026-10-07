// Utilitários de desenho "feito à mão": easing, ruído determinístico,
// curvas suaves, contornos com sobreposição (traço de lápis) e draw-on.
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    linear: (p) => p,
    out: (p) => 1 - Math.pow(1 - p, 3),
    in: (p) => p * p * p,
    inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outBack: (p, s = 1.9) => (p <= 0 ? 0 : 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2)),
  };

  // Hash inteiro -> [0,1). Determinístico: o mesmo t sempre gera o mesmo quadro.
  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  const noise = (seed, i) => hash(seed * 7919 + i * 104729 + 1013) * 2 - 1;

  // "Line boil": o traço treme levemente 8x por segundo, como animação desenhada à mão.
  const boil = (t) => Math.floor(t * 8) % 120;

  function jitter(pts, seed, amp) {
    if (!amp) return pts;
    return pts.map((p, i) => [p[0] + amp * noise(seed, i * 2), p[1] + amp * noise(seed, i * 2 + 1)]);
  }

  const f = (n) => Math.round(n * 10) / 10;
  // Catmull-Rom -> Bézier cúbica (curva passa por todos os pontos).
  function smooth(pts, closed = false) {
    const n = pts.length;
    if (n < 2) return '';
    const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
        `${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
  }

  // Contorno fechado "de lápis": o traço passa um pouco do ponto inicial
  // e termina levemente para fora, como quem desenha de uma vez só.
  function sketchLoop(fn, n, a0 = -Math.PI / 2, overshoot = 0.1) {
    const pts = [];
    const total = Math.round(n * (1 + overshoot));
    for (let i = 0; i <= total; i++) {
      const u = i / n;
      const p = fn(a0 + u * Math.PI * 2);
      const drift = 1 + 0.025 * Math.max(0, u - 1) / overshoot;
      pts.push([p[0] * drift, p[1] * drift]);
    }
    return pts;
  }
  const ring = (fn, n, a0 = 0) => Array.from({ length: n }, (_, i) => fn(a0 + (i / n) * Math.PI * 2));

  function mk(tag, parent, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function show(el, on) {
    el.style.display = on ? '' : 'none';
    return on;
  }
  // Draw-on: revela o traço do início ao fim (p de 0 a 1). p decrescente = "rebobinar".
  function drawOn(el, d, p) {
    if (!show(el, p > 0.002)) return;
    el.setAttribute('d', d);
    if (p >= 0.999) {
      el.removeAttribute('stroke-dasharray');
      el.removeAttribute('stroke-dashoffset');
      return;
    }
    const L = el.getTotalLength() + 2;
    el.setAttribute('stroke-dasharray', `${L} ${L}`);
    el.setAttribute('stroke-dashoffset', L * (1 - p));
  }
  function setT(el, x, y, s = 1, rot = 0, sy) {
    el.setAttribute('transform', `translate(${f(x)},${f(y)}) rotate(${f(rot)}) scale(${s},${sy === undefined ? s : sy})`);
  }

  // Interpola keyframes [[t, v0, v1, ...], ...] com easing entre chaves vizinhas.
  // Para "segurar" um valor, repita-o em duas chaves seguidas.
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b[0]) {
        const p = ease.inOut((t - a[0]) / (b[0] - a[0] || 1));
        return a.slice(1).map((v, j) => lerp(v, b[j + 1], p));
      }
    }
    return keys[keys.length - 1].slice(1);
  }
  // Escolhe o estado discreto ativo em t: [[t, 'estado'], ...]
  function step(t, keys) {
    let s = keys[0][1];
    for (const k of keys) if (t >= k[0]) s = k[1];
    return s;
  }
  // Pulso de mola amortecida a partir de t0 (0 antes de t0).
  const spring = (t, t0, amp = 1, freq = 22, damp = 6) =>
    t < t0 ? 0 : amp * Math.exp(-(t - t0) * damp) * Math.sin((t - t0) * freq);
  // Aparece com "pop" (overshoot) entre a e a+dur.
  const pop = (t, a, dur = 0.28) => ease.outBack(prog(t, a, a + dur));

  window.Draw = { NS, clamp, lerp, prog, ease, hash, noise, boil, jitter, smooth, sketchLoop, ring, mk, show, drawOn, setT, kf, step, spring, pop };
})();
