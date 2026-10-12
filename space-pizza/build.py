#!/usr/bin/env python3
"""Gera space-pizza/index.html embutindo fotos (src/fotos/) e fontes (src/fontes/) em base64."""
import base64, json, pathlib

root = pathlib.Path(__file__).parent
fotos = sorted((root / "src" / "fotos").glob("*.jpg"))
imgs = {f.stem: "data:image/jpeg;base64," + base64.b64encode(f.read_bytes()).decode() for f in fotos}
def font(arquivo, familia, pesos):
    b64 = base64.b64encode((root / "src" / "fontes" / arquivo).read_bytes()).decode()
    return (f'@font-face{{font-family:"{familia}";font-style:normal;font-weight:{pesos};font-display:swap;'
            f'src:url(data:font/woff2;base64,{b64}) format("woff2")}}')

fonts = "\n".join([font("fraunces-latin.woff2", "Fraunces", "700 800"),
                    font("dmsans-latin.woff2", "DM Sans", "400 700")])
tpl = (root / "src" / "index.template.html").read_text(encoding="utf-8")
assert "/*IMAGES*/" in tpl and "/*FONTS*/" in tpl
out = tpl.replace("/*FONTS*/", fonts).replace("/*IMAGES*/", json.dumps(imgs, separators=(",", ":")))
(root / "index.html").write_text(out, encoding="utf-8")
print(f"index.html: {len(out.encode()) / 1024:.0f} KB, {len(imgs)} fotos")
