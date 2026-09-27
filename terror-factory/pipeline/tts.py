#!/usr/bin/env python3
"""Stage 2b: narration + captions for every segment.

Per paragraph: the pronunciation guide (config/pronunciations.json) respells tricky names
for the voice only, then edge-tts -> cached mp3 + word timings (audio/cache/<hash>.*), so
editing one paragraph or one respelling only regenerates the paragraphs affected.
Captions map the spoken words back to the original spelling.
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
    """text is the *spoken* text (after the pronunciation guide)."""
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


def load_lexicon():
    """Pronunciation guide -> compiled [(regex, spoken form)], longest keys first.

    config/pronunciations.json holds Latin respellings; when config/video.json has
    pronunciation_mode = "native" (Multilingual voices), config/pronunciations_native.json
    overrides them with native-script forms (Devanagari), which those voices read with
    real Hindi/Urdu phonetics. Anything without a native form (acronyms, French names)
    keeps its Latin respelling."""
    path = ROOT / "config" / "pronunciations.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text())
    terms = dict(data["terms"])
    native = ROOT / "config" / "pronunciations_native.json"
    if load_config().get("pronunciation_mode") == "native" and native.exists():
        terms.update(json.loads(native.read_text())["terms"])
    cs = set(data.get("case_sensitive", []))
    out = []
    for key in sorted(terms, key=len, reverse=True):
        flags = 0 if key in cs else re.I
        out.append((re.compile(r"(?<![\w-])" + re.escape(key) + r"(?![\w-])", flags), terms[key]))
    return out


def respell(text, lexicon):
    """Apply the pronunciation guide. Returns (spoken_text, spans) where each span is
    (spoken_start, spoken_end, orig_start, orig_end) for a replaced term."""
    hits = []
    taken = [False] * len(text)
    for rx, say in lexicon:
        for m in rx.finditer(text):
            if any(taken[m.start():m.end()]):
                continue
            for i in range(m.start(), m.end()):
                taken[i] = True
            hits.append((m.start(), m.end(), say))
    hits.sort()
    spoken, spans, cur = [], [], 0
    for o_s, o_e, say in hits:
        spoken.append(text[cur:o_s])
        s_s = sum(map(len, spoken))
        spoken.append(say)
        spans.append((s_s, s_s + len(say), o_s, o_e))
        cur = o_e
    spoken.append(text[cur:])
    return "".join(spoken), spans


def align_words(words, spoken, orig, spans):
    """Map edge-tts word boundaries (spoken text) back to the original script text:
    respelled terms collapse back to their written form, punctuation and em dashes are
    re-attached, and sentence ends are marked (used for subtitle line breaks)."""
    def to_orig(i):
        return i + sum((o_e - o_s) - (s_e - s_s) for s_s, s_e, o_s, o_e in spans if s_e <= i)

    out, pos, last_span = [], 0, None
    for w in words:
        idx = spoken.find(w["text"], pos)
        if idx < 0:
            continue
        pos = idx + len(w["text"])
        span = next((sp for sp in spans if sp[0] <= idx < sp[1]), None)
        if span is not None and span == last_span:
            cur = out[-1]
            cur["endMs"] = w["endMs"]
            if pos > span[1]:  # e.g. "T's" running past "L E T" -> keep the "'s"
                extra = orig[cur["_end"]:cur["_end"] + (pos - span[1])]
                cur["text"] += extra
                cur["_end"] += len(extra)
            continue
        last_span = span
        if span is not None:
            o_s, o_e = span[2], span[3]
            if pos > span[1]:
                o_e += pos - span[1]
        else:
            o_s = to_orig(idx)
            o_e = o_s + len(w["text"])
        if out and "—" in orig[out[-1]["_end"]:o_s]:
            out[-1]["text"] += " —"
        lead = LEAD.search(orig[max(0, o_s - 2):o_s])
        trail = TRAIL.match(orig, o_e)
        out.append({
            **w,
            "text": (lead.group(0) if lead else "") + orig[o_s:o_e] + (trail.group(0) if trail else ""),
            "_end": trail.end() if trail else o_e,
            "punct_end": False,
        })
    # a respelled name followed by a possessive comes back as two tokens: "Rana'" + "'s"
    merged = []
    for w in out:
        if merged and re.match(r"^['’]s\b", w["text"]) and merged[-1]["text"].endswith(("'", "’")):
            merged[-1]["text"] = merged[-1]["text"][:-1] + w["text"]
            merged[-1]["endMs"] = w["endMs"]
            continue
        merged.append(w)
    out = merged
    for i, w in enumerate(out):
        w["punct_end"] = bool(re.search(r"[.!?][\"'’”)]*$", w["text"]))
        w.pop("_end", None)
    return out


def build_segment(seg, cfg, force=False, srt_path=None):
    gap = seg.get("gap_ms", cfg["paragraph_gap_ms"])
    tail = seg.get("tail_ms", cfg["segment_tail_ms"])
    lexicon = load_lexicon()
    spoken = [respell(p["text"], lexicon) for p in seg["paragraphs"]]
    parts = [paragraph_audio(sp, cfg) for sp, _ in spoken]
    seg_hash = h(*(k for k, _, _ in parts), gap, tail)
    out_mp3 = PUBLIC_AUDIO / f"{seg['id']}.mp3"
    if not force and seg.get("audio_hash") == seg_hash and out_mp3.exists() and seg.get("words"):
        return False

    frames = b""
    words, starts = [], []
    silence = lambda ms: b"\x00\x00" * int(SAMPLE_RATE * ms / 1000)
    for i, ((_, wav, pw), para, (sp_text, spans)) in enumerate(zip(parts, seg["paragraphs"], spoken)):
        if i:
            frames += silence(gap)
        start_ms = len(frames) / 2 / SAMPLE_RATE * 1000
        starts.append(round(start_ms))
        with wave.open(str(wav)) as wf:
            frames += wf.readframes(wf.getnframes())
        pw = align_words(pw, sp_text, para["text"], spans)
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
    (srt_path or SRT_DIR / f"segment_{seg['index']:02d}.srt").write_text(srt)

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
