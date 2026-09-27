#!/usr/bin/env python3
"""Audition the pronunciation guide.

For every term in config/pronunciations.json (or only --terms A,B), renders
audio/pronunciation/NN_<term>.mp3 = the term read as written, a pause, then the respelling
read inside a short carrier sentence — so each fix can be judged by ear before re-voicing.
Also writes audio/pronunciation/_all.mp3 (every fixed term back to back).
"""
import argparse
import json
import re
import subprocess

from tts import load_lexicon, respell
from tts_lib import ROOT, load_config, synth

OUT = ROOT / "audio" / "pronunciation"


def slug(s):
    return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")


def to_wav(mp3, wav):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", "24000", str(wav)], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--terms", default="")
    args = ap.parse_args()
    cfg = load_config()
    # every key from both guides; spoken form resolved exactly as tts.py does (native mode aware)
    keys = list(json.loads((ROOT / "config" / "pronunciations.json").read_text())["terms"])
    native = ROOT / "config" / "pronunciations_native.json"
    if native.exists():
        keys += [k for k in json.loads(native.read_text())["terms"] if k not in keys]
    lexicon = load_lexicon()
    terms = {k: respell(k, lexicon)[0] for k in keys}
    only = [t.strip() for t in args.terms.split(",") if t.strip()]
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / "_tmp"
    tmp.mkdir(exist_ok=True)
    silence = tmp / "gap.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.7",
                    str(silence)], check=True)
    fixed_parts = []
    for n, (term, say) in enumerate(terms.items(), 1):
        if only and term not in only:
            continue
        a, b = tmp / "a.mp3", tmp / f"b{n}.mp3"
        synth(f"{term}.", cfg["voice"], cfg["rate"], cfg["pitch"], a)
        synth(f"{say}. The word is {say}.", cfg["voice"], cfg["rate"], cfg["pitch"], b)  # respelled / native
        to_wav(a, tmp / "a.wav")
        to_wav(b, tmp / f"b{n}.wav")
        fixed_parts.append(tmp / f"b{n}.wav")
        out = OUT / f"{n:02d}_{slug(term)}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "a.wav"), "-i", str(silence),
                        "-i", str(tmp / f"b{n}.wav"), "-filter_complex", "[0][1][2]concat=n=3:v=0:a=1",
                        "-b:a", "128k", str(out)], check=True)
        print(f"{out.name:40} {term!r} -> {say!r}")
    if fixed_parts and not only:
        inputs, labels = [], []
        for i, p in enumerate(fixed_parts):
            inputs += ["-i", str(p), "-i", str(silence)]
            labels += [f"[{2 * i}]", f"[{2 * i + 1}]"]
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                        "".join(labels) + f"concat=n={len(labels)}:v=0:a=1", "-b:a", "128k",
                        str(OUT / "_all.mp3")], check=True)
        print("_all.mp3 (every fixed term, in order)")


if __name__ == "__main__":
    main()
