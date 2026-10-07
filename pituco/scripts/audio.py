"""Monta a trilha completa do episódio a partir de src/timeline.js.

- Narração: assets/voice/*.mp3 (gerada por scripts/tts.py), aparada e posicionada no cue.
- Efeitos sonoros e a "voz" do Pituco: sintetizados aqui (100% originais, sem samples).
- Música: tema original em Dó maior, 128 BPM, 8 compassos = exatamente 15 s.
- Mix circular: caudas de reverb/decay que passam de 15 s voltam para o início,
  então o loop do Shorts não tem "clique" nem silêncio na emenda.

Saídas: assets/audio/mix.wav (master), build/audio/{voice,sfx,music}.wav (stems)
e assets/audio/cues.json (onde cada fala começa/termina de fato).
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(7)


def load_timeline():
    src = (ROOT / "src/timeline.js").read_text(encoding="utf8")
    start = src.index("{", src.index("window.TIMELINE"))
    return json.loads(src[start : src.rindex("}") + 1])


TL = load_timeline()
DUR = TL["duration"]
N = int(round(DUR * SR))
BEAT = 60 / TL["bpm"]


# ---------------------------------------------------------------- utilidades
def tvec(d):
    return np.arange(int(d * SR)) / SR


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def phase(freq):
    return 2 * np.pi * np.cumsum(freq) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype="low", fs=SR, output="sos"), x)


def hp(x, lo, order=2):
    return sosfilt(butter(order, lo, btype="high", fs=SR, output="sos"), x)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def place(buf, sig, t, gain=1.0):
    """Soma sig em buf a partir de t, dando a volta no fim (buffer circular)."""
    i = int(round(t * SR)) % len(buf)
    sig = sig * gain
    while len(sig):
        k = min(len(sig), len(buf) - i)
        buf[i : i + k] += sig[:k]
        sig, i = sig[k:], 0


# ---------------------------------------------------------------- efeitos
def bell(f, d=0.9, partials=((1, 1, 1), (2.76, 0.4, 2.2), (5.4, 0.18, 3.5))):
    t = tvec(d)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * 6 * dk) for r, a, dk in partials)
    return x * adsr(len(t), 0.002, 0.05)


def sfx_pop(pitch=1.0, **_):
    t = tvec(0.11)
    f = 260 * pitch + 900 * pitch * np.exp(-t * 45)
    x = np.sin(phase(f)) * np.exp(-t * 32)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.25
    return norm(x + click, 0.9)


def sfx_boing(pitch=1.0, **_):
    t = tvec(0.5)
    base = 150 * pitch * (1 + 1.6 * (1 - np.exp(-t * 9)))
    f = base * (1 + 0.18 * np.sin(2 * np.pi * 17 * t) * np.exp(-t * 4))
    x = np.sin(phase(f)) + 0.3 * np.sin(2 * phase(f))
    return norm(x * np.exp(-t * 5.5) * adsr(len(t), 0.004, 0.08), 0.8)


def sfx_plim(pitch=1.0, **_):
    x = bell(1568 * pitch, 1.0)
    x[: int(0.8 * SR)] += 0.6 * bell(2349 * pitch, 0.8)
    return norm(x, 0.6)


def sfx_twinkle(**_):
    out = np.zeros(int(0.7 * SR))
    for i, m in enumerate([96, 100, 103, 108]):
        place_lin(out, bell(mtof(m), 0.5) * (0.5 - 0.08 * i), 0.06 * i)
    return out * 0.6


def sfx_sparkle(**_):
    out = np.zeros(int(0.9 * SR))
    notes = [96, 99, 103, 106, 108, 111, 103, 108]
    for i, m in enumerate(notes):
        place_lin(out, bell(mtof(m), 0.4) * 0.35, 0.045 * i + 0.01 * rng.random())
    return out


def sfx_pencil(dur=0.5, **_):
    t = tvec(dur)
    n = rng.standard_normal(len(t))
    strokes = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * (7 + 3 * rng.random()) * t + rng.random()))
    grain = bp(n, 2500, 7000) * strokes * (0.7 + 0.3 * lp(rng.standard_normal(len(t)), 30) * 10)
    return norm(grain * adsr(len(t), 0.02, 0.06), 0.35)


def sfx_whoosh(dur=0.6, **_):
    t = tvec(dur)
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / dur) ** 2
    lo = bp(n, 300, 1400)
    hi = bp(n, 1400, 5000)
    sweep = t / dur
    x = lo * (1 - sweep) + hi * sweep
    return norm(x * env, 0.5)


def slide(f0, f1, dur, vib=6.0, depth=0.02):
    t = tvec(dur)
    f = f0 * (f1 / f0) ** (t / dur) * (1 + depth * np.sin(2 * np.pi * vib * t))
    return np.sin(phase(f)) + 0.15 * np.sin(2 * phase(f)), t


def sfx_grow(dur=0.4, pitch=1.0, **_):
    x, t = slide(320 * pitch, 900 * pitch, dur, vib=28, depth=0.04)
    return norm(x * adsr(len(t), 0.01, 0.08), 0.45)


def sfx_slide_down(**_):
    x, t = slide(880, 300, 0.7, vib=7, depth=0.025)
    return norm(x * adsr(len(t), 0.02, 0.2), 0.35)


def sfx_chime(note=72, **_):
    f = mtof(note)
    t = tvec(1.2)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.5 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 14)
    x += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6)
    return norm(x * adsr(len(t), 0.002, 0.05), 0.55)


def sfx_fanfare(**_):
    out = np.zeros(int(1.6 * SR))
    for i, m in enumerate([72, 76, 79, 84]):
        place_lin(out, sfx_chime(m) * (0.55 if i < 3 else 0.7), 0.07 * i)
    place_lin(out, sfx_sparkle() * 0.8, 0.25)
    return out


def sfx_rewind(dur=0.55, **_):
    x, t = slide(1400, 180, dur, vib=38, depth=0.06)
    n = bp(rng.standard_normal(len(t)), 800, 4000) * 0.25 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * t)))
    return norm((x * 0.7 + n) * adsr(len(t), 0.01, 0.06), 0.45)


# ---- "voz" do Pituco: síntese aditiva com formantes (não fala palavras, só sons fofos)
FORMANTS = {"i": [(310, 90, 1), (2400, 200, 0.5), (3100, 300, 0.3)],
            "u": [(330, 90, 1), (850, 120, 0.4), (2300, 300, 0.1)],
            "m": [(260, 80, 1), (1100, 300, 0.05)],
            "e": [(480, 90, 1), (2100, 200, 0.45), (2900, 300, 0.25)]}


def voice(f0, vowels, amp):
    """f0, vowels (peso do 1º vowel 0..1 contra o 2º), amp: arrays por amostra."""
    n = len(f0)
    out = np.zeros(n)
    ph = phase(f0)
    va, vb = vowels
    for k in range(1, 26):
        fk = f0 * k
        gain = np.zeros(n)
        for w, vw in ((va[1], va[0]), (1 - va[1], vb)):
            for F, B, g in FORMANTS[vw]:
                gain += w * g / (1 + ((fk - F) / B) ** 2)
        gain *= fk < 8000
        out += gain * np.sin(k * ph) / k**0.3
    return out * amp


def sfx_voice_hm(**_):
    t = tvec(0.42)
    f0 = 330 * (1 + 0.35 * (t / t[-1]) ** 2) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    return norm(voice(f0, (("m", np.ones_like(t)), "m"), adsr(len(t), 0.03, 0.1)), 0.5)


def sfx_voice_yay(**_):
    t = tvec(0.75)
    u = t / t[-1]
    f0 = 520 + 300 * np.sin(np.pi * np.clip(u * 1.3, 0, 1)) * (1 - 0.3 * u)
    f0 = f0 * (1 + 0.03 * np.sin(2 * np.pi * 7 * t))
    w = np.clip(1 - (u - 0.35) * 2.5, 0, 1)  # "iii" -> "uuu"
    return norm(voice(f0, (("i", w), "u"), adsr(len(t), 0.02, 0.18)), 0.6)


def sfx_voice_giggle(**_):
    out = np.zeros(int(0.6 * SR))
    for i, f in enumerate([640, 700, 660]):
        t = tvec(0.1)
        s = voice(np.full_like(t, f) * (1 + 0.1 * t / t[-1]), (("i", np.ones_like(t) * 0.7), "e"), adsr(len(t), 0.01, 0.04))
        place_lin(out, s, 0.14 * i)
    return norm(out, 0.5)


def place_lin(buf, sig, t):
    i = int(t * SR)
    k = min(len(sig), len(buf) - i)
    if k > 0:
        buf[i : i + k] += sig[:k]


SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}


# ---------------------------------------------------------------- música original
def pluck(f, d=0.9, bright=0.5):
    """Karplus-Strong vetorizado por blocos (som de ukulele/cavaquinho suave)."""
    n = int(d * SR)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 2000 + 6000 * bright, 1)
    out = np.empty(n)
    for start in range(0, n, p):
        k = min(p, n - start)
        out[start : start + k] = buf[:k]
        buf = 0.996 * 0.5 * (buf + np.roll(buf, -1))
    return out * adsr(n, 0.001, 0.05)


def music():
    bed = np.zeros(N)
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62],  # C Am F G
              [60, 64, 67], [53, 57, 60], [55, 59, 62], [60, 64, 67]]  # C F G C
    roots = [48, 45, 41, 43, 48, 41, 43, 48]
    # tema original de glockenspiel (compasso, tempo 1-based, nota)
    melody = [(0, 1, 79), (0, 2, 76), (0, 3, 79), (0, 4, 84),
              (1, 1, 81), (1, 2, 76), (1, 3, 72), (1, 4, 76),
              (2, 1, 77), (2, 2, 81), (2, 3, 84), (2, 4, 81),
              (3, 1, 79), (3, 2, 74), (3, 3, 71), (3, 3.5, 74), (3, 4, 79),
              (6, 1, 79), (6, 1.5, 83), (6, 2, 86), (6, 3, 84), (6, 4, 86),
              (7, 1, 84), (7, 2, 79), (7, 3, 76), (7, 4, 72)]
    bar = 4 * BEAT
    for b in range(8):
        t0 = b * bar
        for beat in (0, 2):
            place(bed, pluck(mtof(roots[b] - 12 + (7 if beat == 2 and b % 2 else 0)), 0.8, 0.2) * 0.55, t0 + beat * BEAT)
        for beat in (1, 3, 3.5):
            for j, m in enumerate(chords[b]):
                place(bed, pluck(mtof(m), 0.7, 0.6) * 0.22, t0 + beat * BEAT + 0.012 * j)
        for e in range(8):  # shaker suave em colcheias
            n = hp(rng.standard_normal(int(0.06 * SR)), 6000) * np.exp(-tvec(0.06) * 60)
            place(bed, n * (0.05 if e % 2 else 0.08), t0 + e * BEAT / 2)
    for b, beat, m in melody:
        place(bed, bell(mtof(m), 0.9, ((1, 1, 1.4), (4, 0.25, 6))) * 0.22, b * bar + (beat - 1) * BEAT)
    # rufo crescente antes do "Três!" e brilho no "Uau!"
    k3 = TL["keys"]["count3"]
    roll_t = tvec(0.5)
    roll = bp(rng.standard_normal(len(roll_t)), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 24 * roll_t)))
    place(bed, roll * (roll_t / roll_t[-1]) ** 2 * 0.12, k3 - 0.5)
    return bed


# ---------------------------------------------------------------- narração
def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def trim(x, thr_db=-38, pad=0.015):
    env = np.convolve(np.abs(x), np.ones(240) / 240, "same")
    idx = np.where(env > np.abs(x).max() * 10 ** (thr_db / 20))[0]
    a, b = max(0, idx[0] - int(pad * SR)), min(len(x), idx[-1] + int(pad * SR))
    y = x[a:b].copy()
    f = int(0.008 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


def narration():
    track = np.zeros(N)
    cues = []
    lines = TL["narration"]
    for i, ln in enumerate(lines):
        clip = trim(decode(ROOT / f"assets/voice/{ln['id']}.mp3"))
        clip = norm(clip, 0.9)
        place(track, clip, ln["t"])
        end = ln["t"] + len(clip) / SR
        nxt = lines[i + 1]["t"] if i + 1 < len(lines) else DUR
        cues.append({"id": ln["id"], "text": ln["text"], "start": round(ln["t"], 3), "end": round(end, 3),
                     "dur": round(len(clip) / SR, 3), "words": len(ln["text"].split())})
        if end > nxt + 0.02:
            print(f"AVISO: {ln['id']} termina em {end:.2f}s, depois do próximo cue ({nxt:.2f}s)", file=sys.stderr)
    return track, cues


# ---------------------------------------------------------------- mix
def write_wav(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    voice_tr, cues = narration()
    sfx_tr = np.zeros(N)
    for c in TL["sfx"]:
        t = TL["keys"][c["k"]] + c.get("o", 0)
        params = {k: v for k, v in c.items() if k not in ("k", "s", "o", "gain")}
        place(sfx_tr, SFX[c["s"]](**params), t, c.get("gain", 1.0) * 0.55)
    mus = music()

    # ducking: a música abaixa ~7 dB quando alguém fala (envelope circular suave)
    act = np.abs(voice_tr) > 0.02
    win = int(0.12 * SR)
    env = np.convolve(np.concatenate([act[-win:], act, act[:win]]).astype(float), np.ones(win) / win, "same")[win:-win]
    duck = 1 - 0.55 * np.clip(env * 3, 0, 1)
    mus = norm(mus, 1.0) * 0.30 * duck

    mix = voice_tr * 0.95 + sfx_tr + mus
    # alvo ~ -14 LUFS (aprox. por RMS) + limitador suave
    rms = np.sqrt(np.mean(mix**2))
    mix *= 10 ** (-15.5 / 20) / rms
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= 0.89 / max(1e-9, np.abs(mix).max()) if np.abs(mix).max() > 0.89 else 1

    write_wav(ROOT / "assets/audio/mix.wav", mix)
    for name, x in (("voice", voice_tr), ("sfx", sfx_tr), ("music", mus)):
        write_wav(ROOT / f"build/audio/{name}.wav", norm(x, 0.9))
    (ROOT / "assets/audio/cues.json").write_text(json.dumps(cues, ensure_ascii=False, indent=2))
    words = sum(c["words"] for c in cues)
    print(f"mix: assets/audio/mix.wav ({DUR:.1f}s, {SR} Hz) | falas: {len(cues)} | palavras: {words}")


if __name__ == "__main__":
    main()
