#!/usr/bin/env python3
"""Build config/photos.json from public/photos/_meta.json + config/photo_plan.json.

Validates that every cue word is spoken in its paragraph and trims photos so two never overlap
(0.4 s gap). Run after tts.py (needs word timings in segments.json).
"""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
plan = json.loads((ROOT / "config" / "photo_plan.json").read_text())
meta = json.loads((ROOT / "public" / "photos" / "_meta.json").read_text())
imgs = {}
LIC = {"Public domain": "public domain", "CC0": "CC0"}
for k, m in meta.items():
    art = m.get("artist") or "Unknown"
    if m.get("license") == "GODL-India":
        credit = f"Photo: {art}, Government of India (GODL-India)"
    elif m.get("license") in LIC:
        credit = f"Photo: {art} ({LIC[m['license']]})"
    else:
        credit = f"Photo: {art} / Wikimedia Commons, {m.get('license')}"
    imgs[k] = {"file": m["file"], "credit": m.get("credit", credit), "source": m["source"]}
segs = {s["id"]: s for s in json.loads((ROOT / "segments.json").read_text())["segments"]}
norm = lambda t: re.sub(r"[^a-z0-9-]", "", t.lower())


def spoken(s, word, p):
    start = s["paragraph_starts"][p]
    t = norm(word)
    return next((w["startMs"] for w in s["words"] if w["startMs"] >= start and any(norm(x).startswith(t) for x in w["text"].split())), None)


def aspect(rel):
    """width/height of a downloaded photo (macOS sips); None if unreadable."""
    try:
        o = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(ROOT / "public" / rel)], capture_output=True, text=True).stdout
        w, h = (int(x.split(":")[1]) for x in o.strip().splitlines()[-2:])
        return w / h
    except Exception:
        return None


out, bad = [], []
for pl in plan["placements"]:
    s = segs[pl["segment"]]
    bad += [f"missing image {k}" for k in pl["images"] if k not in imgs]
    ms = spoken(s, pl["at_word"], pl["paragraph"])
    if ms is None:
        bad.append(f"{pl['segment']} p{pl['paragraph']} word '{pl['at_word']}' not spoken")
        continue
    # portrait-shaped stills are letterboxed over a blurred copy instead of cropped to a face
    if len(pl["images"]) == 1 and "fit" not in pl and "person" not in pl and "quote" not in pl:
        a = aspect(imgs[pl["images"][0]]["file"]) if pl["images"][0] in imgs else None
        if a is not None and a < 1.25:
            pl = {**pl, "fit": "contain"}
    out.append({**pl, "_ms": ms})
by = {}
for pl in out:
    by.setdefault(pl["segment"], []).append(pl)
for lst in by.values():
    lst.sort(key=lambda x: x["_ms"])
    for a, b in zip(lst, lst[1:]):
        room = (b["_ms"] - a["_ms"]) / 1000 - 0.4
        if a["seconds"] > room:
            print(f"  trim {a['segment']} '{a['at_word']}' {a['seconds']}s -> {max(room, 0):.1f}s")
            a["seconds"] = round(max(room, 2.5), 1)
            if room < 2.5:
                bad.append(f"{a['segment']} '{a['at_word']}' only {room:.1f}s before next photo")
used = {k for pl in out for k in pl["images"]}
res = {"_note": plan["_note"], "images": {k: v for k, v in imgs.items() if k in used},
       "placements": [{k: v for k, v in pl.items() if k != "_ms"} for pl in sorted(out, key=lambda x: (x["segment"], x["_ms"]))]}
(ROOT / "config" / "photos.json").write_text(json.dumps(res, indent=2, ensure_ascii=False))
tot = sum(s["duration_seconds"] for s in segs.values())
print(f"{len(res['placements'])} photo moments over {tot / 60:.1f} min (one per {tot / max(1, len(res['placements'])):.0f}s)")
for b in bad:
    print("  PROBLEM:", b)
