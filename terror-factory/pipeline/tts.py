#!/usr/bin/env python3
"""Stage 2b: narration + captions for every segment.

Per paragraph: edge-tts -> cached mp3 + word timings (audio/cache/<hash>.*), so editing
one paragraph in script.md only regenerates that paragraph.
Per segment: paragraphs are joined with a short pause into public/audio/seg_XX.mp3,
per-word timings are written into segments.json, and audio/seg_XX.srt is emitted.

Usage: tts.py [--only seg_03,seg_04] [--force]
"""
import argparse
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path

from tts_lib import ROOT, load_config, synth, probe_duration

SEGMENTS = ROOT / "segments.json"
CACHE = ROOT / "audio" / "cache"
PUBLIC_AUDIO = ROOT / "public" / "audio"
SRT_DIR = ROOT / "audio"
SAMPLE_RATE = 24000  # edge-tts native rate


def h(*parts) -> str:
    return hashlib.sha256("␟".join(map(str, parts)).encode()).hexdigest()[:16]


def paragraph_audio(text, cfg):
    key = h(cfg["voice"], cfg["rate"], cfg["pitch"], text)
    mp3, wav, words_f = CACHE / f"{key}.mp3", CACHE / f"{key}.wav", CACHE / f"{key}.words.json"
    if not (wav.exists() and words_f.exists()):
        words = synth(text, cfg["voice"], cfg["rate"], cfg["pitch"], mp3)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SAMPLE_RATE),
                        "-c:a", "pcm_s16le", str(wav)], check=True)
        words_f.write_text(json.dumps(words))
        print(f"    tts  {key}  {text[:60]!r}")
    return key, wav, json.loads(words_f.read_text())


def srt_time(ms):
    ms = max(0, int(ms))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def caption_lines(words, max_chars=42, max_ms=3500, gap_ms=450):
    """Group words into subtitle lines: break on sentence end, long gap, or length."""
    lines, cur = [], []
    for i, w in enumerate(words):
        if cur:
            text_len = len(" ".join(x["text"] for x in cur)) + 1 + len(w["text"])
            if (text_len > max_chars or w["startMs"] - cur[-1]["endMs"] > gap_ms
                    or w["endMs"] - cur[0]["startMs"] > max_ms):
                lines.append(cur)
                cur = []
        cur.append(w)
        if w.get("punct_end"):
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    return [{"text": " ".join(x["text"] for x in ln), "startMs": ln[0]["startMs"], "endMs": ln[-1]["endMs"]}
            for ln in lines]


TRAIL = re.compile(r"[.,;:!?\"'’”)\]]+")
LEAD = re.compile(r"[\"'“‘(\[]+$")


def attach_punctuation(words, text):
    """edge-tts word boundaries drop punctuation; re-attach it from the source text for
    captions and mark sentence ends (used for subtitle line breaks)."""
    pos, prev = 0, None
    for w in words:
        w["punct_end"] = False
        idx = text.find(w["text"], pos)
        if idx < 0:
            continue
        if prev is not None and "—" in text[pos:idx]:
            prev["text"] += " —"
        prev = w
        lead = LEAD.search(text[max(0, idx - 2):idx])
        end = idx + len(w["text"])
        trail = TRAIL.match(text, end)
        pos = trail.end() if trail else end
        w["text"] = (lead.group(0) if lead else "") + w["text"] + (trail.group(0) if trail else "")
        w["punct_end"] = bool(trail and re.search(r"[.!?]", trail.group(0)))


def build_segment(seg, cfg, force=False):
    gap = cfg["paragraph_gap_ms"]
    tail = cfg["segment_tail_ms"]
    parts = [paragraph_audio(p["text"], cfg) for p in seg["paragraphs"]]
    seg_hash = h(*(k for k, _, _ in parts), gap, tail)
    out_mp3 = PUBLIC_AUDIO / f"{seg['id']}.mp3"
    if not force and seg.get("audio_hash") == seg_hash and out_mp3.exists() and seg.get("words"):
        return False

    frames = b""
    words, starts = [], []
    silence = lambda ms: b"\x00\x00" * int(SAMPLE_RATE * ms / 1000)
    for i, ((_, wav, pw), para) in enumerate(zip(parts, seg["paragraphs"])):
        if i:
            frames += silence(gap)
        start_ms = len(frames) / 2 / SAMPLE_RATE * 1000
        starts.append(round(start_ms))
        with wave.open(str(wav)) as wf:
            frames += wf.readframes(wf.getnframes())
        attach_punctuation(pw, para["text"])
        for w in pw:
            words.append({**w, "startMs": round(w["startMs"] + start_ms), "endMs": round(w["endMs"] + start_ms),
                          "p": i})
    frames += silence(tail)

    PUBLIC_AUDIO.mkdir(parents=True, exist_ok=True)
    tmp_wav = CACHE / f"_{seg['id']}.wav"
    with wave.open(str(tmp_wav), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(frames)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp_wav), "-ar", "48000", "-c:a", "libmp3lame",
                    "-b:a", "160k", str(out_mp3)], check=True)
    tmp_wav.unlink()

    lines = caption_lines(words)
    srt = "".join(f"{n}\n{srt_time(l['startMs'])} --> {srt_time(l['endMs'])}\n{l['text']}\n\n"
                  for n, l in enumerate(lines, 1))
    (SRT_DIR / f"segment_{seg['index']:02d}.srt").write_text(srt)

    seg.update({
        "audio_file": f"audio/{seg['id']}.mp3",
        "audio_hash": seg_hash,
        "duration_seconds": round(probe_duration(out_mp3), 3),
        "paragraph_starts": starts,
        "words": [{k: w[k] for k in ("text", "startMs", "endMs", "p")} for w in words],
        "caption_lines": lines,
    })
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    cfg = load_config()
    if not cfg.get("voice"):
        raise SystemExit("config/video.json: set \"voice\" first (run voice_samples.py and pick one)")
    CACHE.mkdir(parents=True, exist_ok=True)
    data = json.loads(SEGMENTS.read_text())
    only = set(filter(None, args.only.split(",")))
    for seg in data["segments"]:
        if only and seg["id"] not in only:
            continue
        changed = build_segment(seg, cfg, args.force)
        print(f"{seg['id']}  {'built ' if changed else 'cached'}  {seg['duration_seconds']:7.2f}s  {seg['title'][:45]}")
        SEGMENTS.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    total = sum(s.get("duration_seconds", 0) for s in data["segments"])
    print(f"narration total: {total / 60:.1f} min")


if __name__ == "__main__":
    main()
