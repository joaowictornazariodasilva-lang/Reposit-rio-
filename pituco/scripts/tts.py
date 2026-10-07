"""Gera a narração (pt-BR) com voz neural via edge-tts, uma frase por arquivo.

    python3 scripts/tts.py            # gera só o que mudou (cache por texto+voz)
    python3 scripts/tts.py --force    # regera tudo

Os MP3 ficam em assets/voice/ e são versionados: o render funciona offline depois.
Para trocar por uma locutora humana, grave os mesmos arquivos (mesmos ids) e rode `npm run audio`.
"""
import asyncio
import json
import os
import ssl
import sys
from pathlib import Path

import edge_tts
import edge_tts.communicate as _comm

ROOT = Path(__file__).resolve().parent.parent
VOICE = os.environ.get("PITUCO_VOICE", "pt-BR-FranciscaNeural")
RATE, PITCH = "+0%", "+12Hz"  # alegre e clara, sem acelerar

# Em ambientes com proxy TLS, aponte a cadeia de certificados (não desliga a verificação).
_ca = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if Path("/root/.ccr/ca-bundle.crt").exists() else None)
if _ca:
    _comm._SSL_CTX = ssl.create_default_context(cafile=_ca)


def load_timeline():
    src = (ROOT / "src/timeline.js").read_text(encoding="utf8")
    start = src.index("{", src.index("window.TIMELINE"))
    return json.loads(src[start : src.rindex("}") + 1])


async def main(force):
    out = ROOT / "assets/voice"
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for line in load_timeline()["narration"]:
        key = f"{VOICE}|{RATE}|{PITCH}|{line['text']}"
        target = out / f"{line['id']}.mp3"
        if not force and target.exists() and manifest.get(line["id"]) == key:
            continue
        await edge_tts.Communicate(line["text"], VOICE, rate=RATE, pitch=PITCH).save(str(target))
        manifest[line["id"]] = key
        print(f"voz {line['id']}: {line['text']}")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main("--force" in sys.argv))
