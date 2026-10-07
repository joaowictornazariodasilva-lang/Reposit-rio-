"""EP-001 — monta o episódio final a partir de ep001/clipe_01..08.mp4.

    python3 ep001/montar.py

- Corta cada clipe na duração-alvo (8/7/8/7/8/7/8/7 = 60 s).
- Reencoda para 1080x1920, 30 fps, H.264 + AAC 48 kHz.
- Transição de áudio de 0,15 s em cada emenda (0,075 s de fade-out + 0,075 s de fade-in),
  sem sobrepor clipes — assim a fala continua sincronizada com a boca e o total fica exato.
- loudnorm em duas passadas (alvo -14 LUFS, pico -1,5 dBTP).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CFG = json.loads((HERE / "prompts.json").read_text(encoding="utf8"))
OUT = HERE / CFG["output"]
FADE = 0.075


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def has_audio(p):
    return "audio" in run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type", "-of", "csv=p=0", str(p)]).stdout


def main():
    clips = CFG["clips"]
    missing = [c["n"] for c in clips if not (HERE / f"clipe_{c['n']:02d}.mp4").exists()]
    if missing:
        sys.exit(f"faltam os clipes {missing} — rode ep001/gerar.py")
    inputs, filters, labels = [], [], []
    for i, c in enumerate(clips):
        src = HERE / f"clipe_{c['n']:02d}.mp4"
        t = c["target"]
        inputs += ["-t", str(t), "-i", str(src)]
        filters.append(f"[{i}:v]trim=0:{t},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=decrease,"
                       f"pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v{i}]")
        if has_audio(src):
            a = f"[{i}:a]atrim=0:{t},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={t}"
        else:
            a = f"anullsrc=r=48000:cl=stereo,atrim=0:{t}"
        if i > 0:
            a += f",afade=t=in:st=0:d={FADE}"
        if i < len(clips) - 1:
            a += f",afade=t=out:st={t - FADE}:d={FADE}"
        filters.append(a + f"[a{i}]")
        labels.append(f"[v{i}][a{i}]")
    graph = ";".join(filters) + ";" + "".join(labels) + f"concat=n={len(clips)}:v=1:a=1[v][a]"

    joined = HERE / "_montagem_sem_loudnorm.mp4"
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "pcm_s16le", str(joined.with_suffix(".mov"))])
    joined = joined.with_suffix(".mov")

    # loudnorm, passada 1 (medição) e passada 2 (aplicação linear)
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(joined), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                           "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", meas, re.S).group(0))
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(joined), "-c:v", "copy", "-af", ln + ",aresample=48000",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(OUT)])
    joined.unlink()

    info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,r_frame_rate",
                           "-of", "json", str(OUT)]).stdout)
    dur = float(info["format"]["duration"])
    lufs = re.search(r"I:\s+(-?[\d.]+) LUFS", subprocess.run(["ffmpeg", "-hide_banner", "-i", str(OUT), "-af", "ebur128", "-f", "null", "-"],
                                                         capture_output=True, text=True).stderr.split("Summary:")[-1]).group(1)
    print(f"{OUT.name}: {dur:.2f} s | streams {[s.get('codec_name') for s in info['streams']]} | {lufs} LUFS")
    if not 59 <= dur <= 61:
        sys.exit(f"duração fora do alvo: {dur:.2f} s")


if __name__ == "__main__":
    main()
