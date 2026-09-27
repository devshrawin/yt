#!/usr/bin/env python3
"""Audit narration text for words the TTS voice may mispronounce.

Flags every word in the narration (after naming rules) that is NOT covered by
config/pronunciations.json and is either:
  - an acronym / mixed-case token (LeT, ISI, JeM), or
  - a capitalised or hyphenated word not in the English dictionary (place and person
    names, Urdu/Hindi/Arabic terms), or
  - any lowercase word not in the dictionary (khidmat, fidayeen…).
Output: a table with occurrence counts and the segment where each first appears.
Run for every new video before voicing. Usage: pronounce_audit.py [--all]
(--all also lists words already in the lexicon)
"""
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DICT = Path("/usr/share/dict/words")
# common English/proper words the voice handles fine (extend per project)
SAFE = {
    "India", "Indian", "Pakistan", "Pakistani", "Mumbai", "Lahore", "Kashmir", "Afghanistan", "Islam",
    "Quran", "American", "Army", "Air", "Force", "West", "Point", "Reuters", "Maxar", "Al", "Jazeera",
    "November", "April", "May", "Segment", "David", "Coleman", "Headley", "Ajmal", "Willy", "Jean-Louis",
    "French", "Western", "Operation", "Foreign", "Secretary", "Vikram", "United", "States", "US",
    "Combating", "Terrorism", "Center", "Counter", "Extremism", "Project", "Line", "Control", "Illegally",
    "Occupied", "Afghan",
}


def is_english(w, english):
    """Dictionary lookup that tolerates inflections and contractions."""
    w = w.replace("’", "'")
    if w in english or not english:
        return True
    if "'" in w:  # isn't, we're, who've, we'll
        base = w[:-3] if w.endswith("n't") else w.split("'")[0]
        return base in english or base + "n" in english or base in {"ca", "wo", "could", "does", "was", "is"}
    for suf, rep in (("ies", "y"), ("es", ""), ("s", ""), ("ied", "y"), ("ed", ""), ("ed", "e"), ("d", ""),
                     ("ing", ""), ("ing", "e"), ("ers", ""), ("er", ""), ("ly", "")):
        if w.endswith(suf) and w[: -len(suf)] + rep in english:
            return True
        if w.endswith(suf) and len(w) > 5 and w[-len(suf) - 1] == w[-len(suf) - 2] and w[: -len(suf) - 1] in english:
            return True  # mapped, scouted -> doubled consonants
    return False


def main():
    lex = json.loads((ROOT / "config" / "pronunciations.json").read_text())
    covered = {k.lower() for k in lex["terms"]}
    english = {w.strip().lower() for w in DICT.read_text().splitlines()} if DICT.exists() else set()
    segs = json.loads((ROOT / "segments.json").read_text())["segments"]

    # remove covered phrases first so their parts aren't re-flagged
    phrase_rx = re.compile(r"(?<![\w-])(?:" + "|".join(re.escape(k) for k in sorted(lex["terms"], key=len, reverse=True))
                           + r")(?![\w-])", re.I)
    found = OrderedDict()
    for s in segs:
        text = phrase_rx.sub(" ", s["narration_text"])
        for tok in re.findall(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*", text):
            w = re.sub(r"['’]s$", "", tok).strip("-'’")
            if not w or w in SAFE or w.lower() in covered:
                continue
            acronym = sum(c.isupper() for c in w) >= 2 or (w[0].islower() and any(c.isupper() for c in w))
            parts = w.lower().split("-")
            unknown = any(p and not is_english(p, english) for p in parts)
            if acronym or unknown:
                e = found.setdefault(w, {"count": 0, "first": s["id"]})
                e["count"] += 1

    print(f"{'word':28} {'count':>5}  first in")
    for w, e in found.items():
        print(f"{w:28} {e['count']:>5}  {e['first']}")
    print(f"\n{len(found)} candidate(s) not in config/pronunciations.json "
          f"({len(lex['terms'])} terms already covered)")
    if "--all" in sys.argv:
        print("\ncovered:", ", ".join(lex["terms"]))


if __name__ == "__main__":
    main()
