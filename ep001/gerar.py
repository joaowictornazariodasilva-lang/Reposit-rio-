"""EP-001 — gera os 8 clipes com o Veo 3.1 (Gemini API) e extrai quadros para conferência.

    export GEMINI_API_KEY=...            # ou GOOGLE_API_KEY
    python3 ep001/gerar.py               # gera todos os clipes que ainda não existem
    python3 ep001/gerar.py --only 3,7    # regera só esses (sobrescreve)
    python3 ep001/gerar.py --frames      # só extrai os quadros de conferência

API (docs: ai.google.dev/gemini-api/docs/veo, consultada em 2026-10):
  POST /v1beta/models/veo-3.1-generate-preview:predictLongRunning
  9:16, 1080p, 8 s, áudio nativo, até 3 imagens de referência (referenceType "asset").
Preço de tabela: US$ 0,40 por segundo gerado (1080p, com áudio).
"""
import base64
import json
import os
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
API = "https://generativelanguage.googleapis.com/v1beta"
MODEL = os.environ.get("VEO_MODEL", "veo-3.1-generate-preview")
PRICE_PER_S = float(os.environ.get("VEO_PRICE_PER_S", "0.40"))
RESOLUTION = os.environ.get("VEO_RESOLUTION", "1080p")
MAX_RETRIES = 2  # tentativas extras por clipe se a geração falhar
POLL_S = 10

CFG = json.loads((HERE / "prompts.json").read_text(encoding="utf8"))
KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
_ca = os.environ.get("SSL_CERT_FILE")
CTX = ssl.create_default_context(cafile=_ca) if _ca and Path(_ca).exists() else ssl.create_default_context()
LOG_PATH = HERE / "generation_log.json"
LOG = json.loads(LOG_PATH.read_text()) if LOG_PATH.exists() else {"clips": {}, "seconds_billed": 0}
send_negative = True  # vira False se a API recusar o campo negativePrompt


def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def http(method, url, body=None, raw=False):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, context=CTX, timeout=300) as r:
        data = r.read()
    return data if raw else json.loads(data)


def find_image(name):
    for ext in ("png", "jpg", "jpeg", "webp"):
        p = ROOT / "personagens" / f"{name}.{ext}"
        if p.exists():
            return p
    return None


def encode(p):
    mime = "image/jpeg" if p.suffix.lower() in (".jpg", ".jpeg") else f"image/{p.suffix[1:].lower()}"
    return {"image": {"inlineData": {"mimeType": mime, "data": base64.b64encode(p.read_bytes()).decode()}}, "referenceType": "asset"}


def ref_images(chars):
    """Até 3 referências (limite da API). Com 4 personagens, os excedentes viram uma
    única folha lado a lado, para que todos tenham referência visual."""
    found = [(n, p) for n in chars if (p := find_image(n))]
    if len(found) > 3:
        sheet = HERE / f"_ref_{'_'.join(n for n, _ in found[2:])}.jpg"
        if not sheet.exists():
            ins = sum([["-i", str(p)] for _, p in found[2:]], [])
            k = len(found) - 2
            chain = ";".join(f"[{i}:v]scale=-2:1024[s{i}]" for i in range(k)) + ";" + "".join(f"[s{i}]" for i in range(k)) + f"hstack=inputs={k}"
            subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", chain, "-q:v", "3", str(sheet)], check=True)
        found = found[:2] + [("+".join(n for n, _ in found[2:]), sheet)]
    return [(n, encode(p)) for n, p in found]


def request_body(clip):
    prompt = clip["prompt"]
    if not send_negative:
        prompt += "\nAvoid: " + CFG["negative_prompt"] + "."
    inst = {"prompt": prompt}
    refs = ref_images(clip["characters"])
    if refs:
        inst["referenceImages"] = [r for _, r in refs]
        inst["prompt"] += "\nKeep the characters exactly as in the reference images (same faces, colors, proportions and clothes)."
    params = {"aspectRatio": "9:16", "durationSeconds": "8", "resolution": RESOLUTION, "numberOfVideos": 1}
    if send_negative:
        params["negativePrompt"] = CFG["negative_prompt"]
    return {"instances": [inst], "parameters": params}, [n for n, _ in refs]


def generate(clip):
    global send_negative
    n = clip["n"]
    out = HERE / f"clipe_{n:02d}.mp4"
    entry = LOG["clips"].setdefault(str(n), {"attempts": 0, "errors": []})
    for attempt in range(MAX_RETRIES + 1):
        entry["attempts"] += 1
        try:
            body, refs = request_body(clip)
            try:
                op = http("POST", f"{API}/models/{MODEL}:predictLongRunning", body)
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors="replace")
                if e.code == 400 and "negativePrompt" in msg and send_negative:
                    log(f"clipe {n}: API não aceita negativePrompt → vai no texto do prompt")
                    send_negative = False
                    body, refs = request_body(clip)
                    op = http("POST", f"{API}/models/{MODEL}:predictLongRunning", body)
                else:
                    raise RuntimeError(f"HTTP {e.code}: {msg[:500]}")
            log(f"clipe {n}: enviado (tentativa {attempt + 1}, refs: {', '.join(refs) or 'nenhuma'}) → {op['name']}")
            while not op.get("done"):
                time.sleep(POLL_S)
                op = http("GET", f"{API}/{op['name']}")
            if "error" in op:
                raise RuntimeError(json.dumps(op["error"])[:500])
            resp = op.get("response", {}).get("generateVideoResponse", {})
            samples = resp.get("generatedSamples") or []
            if not samples:
                raise RuntimeError("sem vídeo na resposta (filtro de segurança?): " + json.dumps(resp)[:500])
            out.write_bytes(http("GET", samples[0]["video"]["uri"], raw=True))
            LOG["seconds_billed"] += 8
            entry["ok"] = True
            log(f"clipe {n}: OK → {out.name}")
            return True
        except Exception as e:  # noqa: BLE001 — registra e tenta de novo
            entry["errors"].append(str(e)[:500])
            log(f"clipe {n}: falhou ({e})")
            time.sleep(15)
    entry["ok"] = False
    return False


def frames():
    """Quadros a 25 %, 50 % e 75 % de cada clipe, lado a lado, para conferência visual."""
    fdir = HERE / "frames"
    fdir.mkdir(exist_ok=True)
    for clip in CFG["clips"]:
        src = HERE / f"clipe_{clip['n']:02d}.mp4"
        if not src.exists():
            continue
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                                 capture_output=True, text=True).stdout or 8)
        parts = []
        for k, f in enumerate((0.25, 0.5, 0.75)):
            p = fdir / f"_c{clip['n']:02d}_{k}.jpg"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d * f:.2f}", "-i", str(src), "-frames:v", "1",
                            "-vf", "scale=540:-2", str(p)], check=True)
            parts.append(p)
        subprocess.run(["ffmpeg", "-v", "error", "-y", *sum([["-i", str(p)] for p in parts], []),
                        "-filter_complex", "hstack=inputs=3", str(fdir / f"clipe_{clip['n']:02d}.jpg")], check=True)
        for p in parts:
            p.unlink()
    log(f"quadros de conferência em {fdir}")


def main():
    args = sys.argv[1:]
    if "--frames" in args:
        return frames()
    if not KEY:
        sys.exit("Falta GEMINI_API_KEY (ou GOOGLE_API_KEY). Crie em https://aistudio.google.com/apikey com faturamento ativo.")
    only = {int(x) for x in args[args.index("--only") + 1].split(",")} if "--only" in args else None
    todo = [c for c in CFG["clips"] if (only and c["n"] in only) or (not only and not (HERE / f"clipe_{c['n']:02d}.mp4").exists())]
    log(f"modelo {MODEL}, {RESOLUTION}, 9:16 — gerando clipes {[c['n'] for c in todo]}")
    with ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(generate, todo))
    LOG["model"] = MODEL
    LOG["estimated_cost_usd"] = round(LOG["seconds_billed"] * PRICE_PER_S, 2)
    LOG_PATH.write_text(json.dumps(LOG, ensure_ascii=False, indent=2))
    frames()
    failed = [c["n"] for c, ok in zip(todo, results) if not ok]
    log(f"segundos gerados (acumulado): {LOG['seconds_billed']} → ~US$ {LOG['estimated_cost_usd']}")
    if failed:
        sys.exit(f"clipes com falha após {MAX_RETRIES + 1} tentativas: {failed}")


if __name__ == "__main__":
    main()
