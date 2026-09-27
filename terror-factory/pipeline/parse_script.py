#!/usr/bin/env python3
"""Stage 1: parse script.md -> segments.json (single source of truth for Remotion).

Re-runnable: previously generated audio fields (duration_seconds, paragraph timings,
audio hashes) are carried over from an existing segments.json so unchanged segments
don't need new narration.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "script.md"
CONFIG = ROOT / "config" / "video.json"
OUT = ROOT / "segments.json"

# Place names the map component knows how to pin (keep in sync with src/locations.ts).
KNOWN_PLACES = [
    "Muridke", "Lahore", "Muzaffarabad", "Mansehra", "Abbottabad",
    "Bahawalpur", "Kotli", "Bhimber", "Sialkot",
]
MAP_WORDS = re.compile(r"\bmap\b|\bpins?\b|op sindoor|nine sites", re.I)
CUE_RE = re.compile(r"^\*{0,2}\[(VISUAL|LOWER THIRD|CITATION CARD|TITLE CARD|END CARD):\s*(.*?)\]\*{0,2}\s*$", re.I)


# Required naming (published in India): any variant below is rewritten to config "pok_term"
# in narration, captions and on-screen text. script.md itself is left as written.
POK_RE = re.compile(r"Pakistan[- ]administered Kashmir|Pakistan[- ]occupied Kashmir|Azad Kashmir|\bAJK\b", re.I)


def apply_naming(text: str, term: str) -> str:
    return POK_RE.sub(term, text)


def clean_inline(s: str) -> str:
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"\*(.+?)\*", r"\1", s)
    return s.strip()


def bold_terms(s: str):
    return [clean_inline(m) for m in re.findall(r"\*\*(.+?)\*\*", s)]


def split_title(header: str):
    """'SEGMENT 3 — PHASE ONE: X (6:00–9:30)' -> ('SEGMENT 3', 'PHASE ONE: X')"""
    h = re.sub(r"\s*\([\d:–\-]+\)\s*$", "", header).strip()
    if " — " in h:
        label, name = h.split(" — ", 1)
    else:
        label, name = "", h
    return label.strip(), name.strip()


def first_sentence(s: str, limit=150):
    """Card text: a complete statement from the paragraph, never cut mid-phrase.
    Prefer the first sentence; else the first 25+ char sentence that fits; else shorten
    the first sentence by dropping dash asides / trailing clauses."""
    sents = [x.strip() for x in re.findall(r"[^.!?]+[.!?]+[\"'”]?", s)] or [s.strip()]
    if len(sents[0]) <= limit:
        return sents[0]
    for sent in sents[1:]:
        if 25 <= len(sent) <= limit:
            return sent
    # drop paired dash asides ("Separately — …aside… — LeT runs" -> "Separately, LeT runs")
    first = re.sub(r" — [^—]+? — ", lambda m: ", " if " " not in sents[0][:m.start()] else " ", sents[0])
    if len(first) <= limit:
        return first
    for cut in (r",? (?:which|where|who|according to|because|based on)\b", r" — ", r"; ", r": ", r", "):
        head = re.split(cut, first, maxsplit=1)[0].strip()
        if 30 <= len(head) <= limit:
            return head.rstrip(",;:") + ("" if head.endswith((".", "?", "!")) else ".")
    return first[:limit].rsplit(" ", 1)[0].rstrip(",;:—") + "."


def parse(text: str):
    lines = text.splitlines()
    meta = {"title": "", "subtitle": ""}
    for ln in lines:
        if ln.startswith("# ") and not meta["title"]:
            full = ln[2:].strip()
            if ":" in full:
                meta["title"], meta["subtitle"] = [x.strip() for x in full.split(":", 1)]
            else:
                meta["title"] = full
            break

    # split into ## sections
    sections, cur = [], None
    for ln in lines:
        if ln.startswith("## "):
            cur = {"header": ln[3:].strip(), "body": []}
            sections.append(cur)
        elif cur is not None:
            cur["body"].append(ln)

    segments, sources = [], []
    for sec in sections:
        if sec["header"].upper().startswith("SOURCES"):
            for ln in sec["body"]:
                m = re.match(r"^\s*\d+\.\s+(.*)$", ln)
                if m:
                    sources.append(clean_inline(m.group(1)))
            continue

        label, name = split_title(sec["header"])
        seg = {
            "id": f"seg_{len(segments):02d}",
            "index": len(segments),
            "header": sec["header"],
            "label": label or name,
            "title": name,
            "visual_cue_raw": "",
            "lower_third_text": "",
            "lower_third_after_paragraph": None,
            "citation_card_text": "",
            "citation_after_paragraph": None,
            "title_card": False,
            "end_card": False,
            "paragraphs": [],
        }
        visual_cues = []
        # paragraphs = blank-line separated blocks; bullets are one paragraph each
        block = []

        def flush():
            if not block:
                return
            raw = " ".join(block).strip()
            block.clear()
            if not raw:
                return
            seg["paragraphs"].append({
                "text": clean_inline(raw),
                "bold": bold_terms(raw),
                "bullet": False,
            })

        for ln in sec["body"]:
            s = ln.strip()
            if s == "---":
                continue
            m = CUE_RE.match(s)
            if m:
                flush()
                kind, val = m.group(1).upper(), clean_inline(m.group(2).strip().strip('"'))
                n_par = len(seg["paragraphs"])
                if kind == "VISUAL":
                    visual_cues.append(val)
                elif kind == "LOWER THIRD":
                    seg["lower_third_text"] = val
                    seg["lower_third_after_paragraph"] = max(n_par - 1, 0)
                elif kind == "CITATION CARD":
                    seg["citation_card_text"] = val
                    seg["citation_after_paragraph"] = max(n_par - 1, 0)
                elif kind == "TITLE CARD":
                    seg["title_card"] = True
                elif kind == "END CARD":
                    seg["end_card"] = True
                continue
            if re.match(r"^\*{0,2}NARRATOR", s, re.I):
                flush()
                continue
            if not s:
                flush()
                continue
            if s.startswith("- "):
                flush()
                block.append(s[2:])
                flush()
                seg["paragraphs"][-1]["bullet"] = True
                continue
            block.append(s)
        flush()

        seg["visual_cue_raw"] = " | ".join(visual_cues)
        seg["narration_text"] = "\n\n".join(p["text"] for p in seg["paragraphs"])

        # headline-card beats (only used by non-map visuals, but always emitted)
        for p in seg["paragraphs"]:
            p["headline"] = p["bold"][0] if p["bold"] else ""
            p["subline"] = first_sentence(p["text"])

        # locations in order of first mention (cue text first, then narration)
        hay = seg["visual_cue_raw"] + " " + seg["narration_text"]
        found = []
        for m in re.finditer("|".join(KNOWN_PLACES), hay):
            if m.group(0) not in found:
                found.append(m.group(0))
        seg["locations"] = found

        cue = seg["visual_cue_raw"]
        if MAP_WORDS.search(cue) or re.search("operation sindoor", seg["narration_text"], re.I) and found:
            seg["visual_type"] = "map"
        else:
            seg["visual_type"] = "headline"
        seg["disputed"] = bool(re.search(r"disputed", cue, re.I))
        seg["dark_grade"] = bool(re.search(r"darker", cue, re.I))
        seg["map_zoom_out"] = bool(re.search(r"pull-out", cue, re.I))

        # Strike-site pins for bullet lists like "Name camp, Place — ..."
        pins = []
        for p in seg["paragraphs"]:
            if not p["bullet"] or not p["bold"]:
                continue
            for term in p["bold"]:
                place = next((pl for pl in KNOWN_PLACES if pl in term), None)
                if place is None:
                    tail = p["text"]
                    place = next((pl for pl in KNOWN_PLACES if pl in tail), None)
                site = term.split(",")[0].strip()
                pins.append({"label": site, "place": place, "trigger": site.split()[0]})
        seg["site_pins"] = pins
        segments.append(seg)

    return {"meta": meta, "sources": sources, "segments": segments}


def carry_over(new, old):
    """Keep audio-generation results for segments whose narration didn't change."""
    old_by_id = {s["id"]: s for s in old.get("segments", [])}
    keep = ["duration_seconds", "audio_hash", "paragraph_starts", "audio_file", "words", "caption_lines"]
    for s in new["segments"]:
        o = old_by_id.get(s["id"])
        if o and o.get("narration_text") == s["narration_text"]:
            for k in keep:
                if k in o:
                    s[k] = o[k]


def main():
    term = json.loads(CONFIG.read_text()).get("pok_term", "")
    raw = SCRIPT.read_text(encoding="utf-8")
    data = parse(apply_naming(raw, term) if term else raw)
    if OUT.exists():
        carry_over(data, json.loads(OUT.read_text()))
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"{len(data['segments'])} segments, {len(data['sources'])} sources -> {OUT.name}")
    print(f"{'id':7} {'visual':9} {'paras':>5} {'words':>6}  flags / locations / title")
    for s in data["segments"]:
        flags = [f for f in ("title_card", "end_card", "disputed", "dark_grade", "map_zoom_out") if s[f]]
        if s["lower_third_text"]:
            flags.append("LT")
        if s["citation_card_text"]:
            flags.append("CITE")
        if s["site_pins"]:
            flags.append(f"{len(s['site_pins'])}pins")
        print(f"{s['id']:7} {s['visual_type']:9} {len(s['paragraphs']):>5} {len(s['narration_text'].split()):>6}  "
              f"{','.join(flags)} {s['locations']} {s['title'][:40]}")


if __name__ == "__main__":
    sys.exit(main())
