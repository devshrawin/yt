#!/usr/bin/env python3
"""Script lint — enforces ../SCRIPT_RULES.md on script.md before any voice is generated.

ERRORS (exit 1):
  opening-meta   methodology/disclaimer language in the first ~90 s (225 words)
  catalogue      a sentence naming more than two places / dates / times / list items
  rupture        the final 30% introduces 4+ places never mentioned before
WARNINGS:
  meta           disclaimer / virtue-signalling phrasing anywhere
  monotone       4+ consecutive sentences all 12–18 words
  no-punch       a ~150-word stretch with no short (<=5 word) sentence
  flat-loop      a ~150-word stretch with no tension point (question, contrast, cost)
  syllabus       3+ consecutive sections titled by calendar / ordinal step
  mirror         the ending shares too little with the opening
  no-anchor      a section of 120+ words with no attributed line from the record
  ending         the video closes on sources/credits or a long flat sentence
  no-pause       no [PAUSE] beats anywhere
Usage: script_lint.py [script.md]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from parse_script import parse  # noqa: E402

META = [r"before we go further", r"note on sources", r"(it'?s )?worth noting", r"we'?re not going to",
        r"\bfrankly\b", r"responsible reporting", r"nothing here is", r"\bin this video\b", r"this matters more",
        r"we include both sides", r"\bto be clear\b", r"for the record", r"\bdisclaimer\b",
        r"doesn'?t belong in a public video", r"\bas we'?ll see\b", r"\blet'?s be\b"]
META_RX = re.compile("|".join(META), re.I)
TENSION_RX = re.compile(r"\?|\b(but|yet|except|until|only to|instead|never|no one|nobody|not one|though|"
                        r"although|still|which meant|the problem|the catch|cost|price|failed|wrong|premature|only|didn'?t|not|"
                        r"what .* didn'?t|why)\b", re.I)
TIME_RX = re.compile(r"\b\d{1,2}:\d{2}\s*(AM|PM)?\b")
DATE_RX = re.compile(r"\b(January|February|March|April|May|June|July|August|September|October|November|December)"
                     r"\s+\d{1,2}(st|nd|rd|th)?\b|\bthe \d{1,2}(st|nd|rd|th)\b", re.I)
SYLLABUS_RX = re.compile(r"\b(PHASE|STAGE|STEP|DAY|PART)\s+(ONE|TWO|THREE|FOUR|\d)\b|\b(NOVEMBER|DECEMBER|JANUARY|MAY)\s+\d+", re.I)


def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"“])", text.strip())
    return [p for p in parts if p]


def words(t):
    return re.findall(r"[A-Za-z0-9'’-]+", t)


CANON = {}


def load_places():
    p = ROOT / "config" / "places.json"
    names = []
    if p.exists():
        for name, spec in json.loads(p.read_text())["places"].items():
            for a in spec.get("aliases", [name]):
                names.append(a)
                CANON[a.lower()] = name.lower()
    return sorted(set(names), key=len, reverse=True)


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "script.md"
    data = parse(path.read_text(encoding="utf-8"))
    segs = data["segments"]
    places = load_places()
    place_rx = re.compile("|".join(re.escape(p) for p in places)) if places else None
    errors, warns = [], []

    # flatten into (seg, para, sentence) stream with running word counts
    stream, total = [], 0
    for s in segs:
        for pi, p in enumerate(s["paragraphs"]):
            for sent in sentences(p["text"]):
                n = len(words(sent))
                stream.append((s["id"], pi, sent, n, total))
                total += n
    where = lambda sid, pi: f"{sid} ¶{pi + 1}"

    # opening meta / meta anywhere
    for sid, pi, sent, n, at in stream:
        m = META_RX.search(sent)
        if m:
            (errors if at < 225 else warns).append(
                ("opening-meta" if at < 225 else "meta", where(sid, pi), f'"{m.group(0)}" — {sent[:90]}'))

    # catalogue: places + dates + times + comma lists in one sentence
    for sid, pi, sent, n, at in stream:
        hits = []
        if place_rx:
            hits += [CANON.get(m.group(0).lower(), m.group(0)) for m in place_rx.finditer(sent)]
        hits += [m.group(0) for m in DATE_RX.finditer(sent)] + [m.group(0) for m in TIME_RX.finditer(sent)]
        items = [x for x in re.split(r",|\band\b|;", sent) if 0 < len(words(x)) <= 4]
        uniq = list(dict.fromkeys(h.lower() for h in hits))
        if len(uniq) > 2:
            errors.append(("catalogue", where(sid, pi), f"{len(uniq)} places/dates/times: {', '.join(uniq)} — {sent[:80]}"))
        elif len(items) >= 4 and sent.count(",") >= 3:
            errors.append(("catalogue", where(sid, pi), f"list of {len(items)} items — {sent[:90]}"))

    # monotone runs
    run = []
    for rec in stream:
        run = run + [rec] if 12 <= rec[3] <= 18 else []
        if len(run) == 4:
            warns.append(("monotone", where(run[0][0], run[0][1]), f"4+ sentences of 12–18 words from: {run[0][2][:70]}"))

    # punch + tension per ~150-word window
    win, wcount, start = [], 0, None
    for rec in stream:
        if start is None:
            start = rec
        win.append(rec)
        wcount += rec[3]
        if wcount >= 150:
            text = " ".join(r[2] for r in win)
            if not any(r[3] <= 5 for r in win):
                warns.append(("no-punch", where(start[0], start[1]), "no sentence of 5 words or fewer in ~150 words"))
            if not TENSION_RX.search(text):
                warns.append(("flat-loop", where(start[0], start[1]), "no question / contrast / cost in ~150 words"))
            win, wcount, start = [], 0, None

    # syllabus titles
    streak = 0
    for s in segs:
        streak = streak + 1 if SYLLABUS_RX.search(s["title"]) else 0
        if streak == 3:
            warns.append(("syllabus", s["id"], "3+ consecutive sections titled by calendar/ordinal — frame by objective"))

    # third-act rupture: new places in the last 30%
    if place_rx:
        cut = total * 0.7
        seen, late_new = set(), set()
        for sid, pi, sent, n, at in stream:
            found = {m.group(0) for m in place_rx.finditer(sent)}
            if at < cut:
                seen |= found
            else:
                late_new |= found - seen
        if len(late_new) >= 4:
            errors.append(("rupture", "final 30%", f"{len(late_new)} new places: {', '.join(sorted(late_new))}"))

    # ending mirrors opening
    key = lambda recs: {w.lower() for r in recs for w in words(r[2]) if len(w) > 5 or w[:1].isupper()}
    head = [r for r in stream if r[4] < 160]
    tail = [r for r in stream if r[4] > total - 160]
    shared = key(head) & key(tail) - {"the", "and", "that", "this", "there", "their"}
    if len(shared) < 4:
        warns.append(("mirror", "ending", f"only {len(shared)} key words echo the opening: {', '.join(sorted(shared))}"))

    # human anchor: attributed evidence per section
    ANCHOR_RX = re.compile(r"\b(testif\w+|told|admitted|confess\w*|recalled|said|according to|court|interrogat\w+|"
                           r"records?\b|timeline|recordings?|intercepted|officials?|official count|"
                           r"in (his|her)( own)? words)\b", re.I)
    for s in segs:
        if len(words(s["narration_text"])) >= 120 and not ANCHOR_RX.search(s["narration_text"]):
            warns.append(("no-anchor", s["id"], "120+ words with no attributed line from the record"))
    # ending
    last = sentences(segs[-1]["paragraphs"][-1]["text"])[-1] if segs and segs[-1]["paragraphs"] else ""
    if re.search(r"\bsources?\b|\bcredits?\b", segs[-1]["narration_text"], re.I) or (len(words(last)) > 14 and "?" not in last):
        warns.append(("ending", segs[-1]["id"], f"close on the metaphor or one open question — last line: {last[:80]}"))
    # pauses
    if "[PAUSE]" not in path.read_text(encoding="utf-8"):
        warns.append(("no-pause", "script", "no [PAUSE] beats after key framing lines"))

    mins = total / 150
    print(f"{path.name}: {total} words (~{mins:.1f} min at 150 wpm), {len(segs)} sections")
    for kind, lst in (("ERROR", errors), ("warn ", warns)):
        for code, loc, msg in lst:
            print(f"  {kind} {code:13} {loc:12} {msg}")
    print(f"RESULT: {'FAIL' if errors else 'PASS'} ({len(errors)} errors, {len(warns)} warnings)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
