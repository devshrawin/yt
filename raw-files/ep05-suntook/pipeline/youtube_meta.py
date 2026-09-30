#!/usr/bin/env python3
"""YouTube upload kit -> output/youtube_upload.md

Title, description (hook, chapter timestamps computed from the real render timeline,
sources, image/map/music credits as their licences require, disclaimer), tags, a pinned
comment, and the Instagram caption for the teaser. Run after every render.
"""
import json

from timeline import build
from tts_lib import ROOT, load_config


def ts(sec):
    sec = int(sec)
    return f"{sec // 3600}:{sec // 60 % 60:02d}:{sec % 60:02d}" if sec >= 3600 else f"{sec // 60}:{sec % 60:02d}"


SMALL = {"a", "an", "and", "the", "of", "in", "on", "at", "to", "for", "vs", "or"}
KEEP = {"LeT", "JeM", "ISI", "CTC", "Op", "May", "PM", "AM", "NSG", "CST"}


def title_case(text):
    """Headline case that keeps apostrophes, hyphenated names and acronyms intact."""
    out = []
    for i, w in enumerate(text.split(" ")):
        low = w.lower()
        if w.rstrip(":,") in KEEP:
            out.append(w)
        elif i and low.strip(":,") in SMALL and not out[-1].endswith(":"):
            out.append(low)
        elif "-" in w:  # Daura-e-Sufa, Lashkar-e-Taiba
            parts = low.split("-")
            out.append("-".join(p if p in {"e", "ur"} else p[:1].upper() + p[1:] for p in parts))
        else:
            out.append(low[:1].upper() + low[1:])
    return " ".join(out)


def chapter_name(seg):
    return title_case(seg["title"])


def build_meta():
    """Return every upload text as a dict (used by main() and package_release.py)."""
    cfg = load_config()
    data = json.loads((ROOT / "segments.json").read_text())
    photos = json.loads((ROOT / "config" / "photos.json").read_text())
    blocks, fps = build()
    meta = data["meta"]
    file_no = cfg.get("file_number", "01")
    channel = cfg.get("channel_name", "")
    handle = cfg.get("channel_handle", "")

    chapters = []
    for b in blocks:
        t = b["start"] / fps
        if b["kind"] == "segment":
            name = "Cold Open" if b["segment"]["label"] == "COLD OPEN" else chapter_name(b["segment"])
            chapters.append((t, name))
        elif b["kind"] == "end":
            chapters.append((t, "Sources & Credits"))
    # YouTube: first chapter at 0:00, each >= 10 s
    chapters[0] = (0, chapters[0][1])

    map_credit = "Maps: Natural Earth (public domain), India point-of-view boundaries."
    if (ROOT / "public" / "map" / "mumbai.json").exists():
        map_credit += " City map data © OpenStreetMap contributors (ODbL, openstreetmap.org/copyright)."
    yt = json.loads((ROOT / "config" / "youtube.json").read_text())
    used = {k for p in photos["placements"] for k in p["images"]}
    licence_links = {"CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
                     "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
                     "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
                     "GODL-India": "https://data.gov.in/government-open-data-license-india"}
    credits = []
    for k, v in photos["images"].items():
        if k not in used:
            continue
        lic = next((f" (licence: {url})" for name, url in licence_links.items() if name in v["credit"]), "")
        credits.append(f"{v['credit']} — {v['source']}{lic}")
    thumb = yt.get("thumbnail", {})
    for k, v in photos["images"].items():
        if v["file"] == thumb.get("image") and k not in used:
            lic = next((f" (licence: {url})" for name, url in licence_links.items() if name in v["credit"]), "")
            credits.append(f"Thumbnail — {v['credit']} — {v['source']}{lic}")
    credits = sorted(set(credits))

    subtitle = meta["subtitle"].replace("Pakistan-Based ", "")
    title = f"{title_case(meta['title'])}: {subtitle} | {cfg.get('title_suffix', f'{channel} {file_no}')}"
    if len(title) > 100:
        title = f"{title_case(meta['title'])}: {subtitle}"[:100]
    fill = lambda t: t.replace("{file}", file_no).replace("{channel}", channel).replace("{handle}", handle)
    desc = fill(yt["hook"]) + "\n\n" + fill(yt.get("promise", "")) + """

CHAPTERS
""" + "\n".join(f"{ts(t)} {n}" for t, n in chapters) + """

SOURCES
""" + "\n".join(f"{i}. {s}" for i, s in enumerate(data["sources"], 1)) + """

IMAGE CREDITS
""" + "\n".join(credits) + f"""
""" + map_credit + """ Music: original, generated for this channel.

""" + fill(yt["disclaimer"]) + f"""

{handle} · Subscribe for the next file.
""" + yt["hashtags"]

    tags = list(yt["tags"]) if yt.get("tags") else ["The Sisodia Files", "Inside the Terror Factory", "Lashkar-e-Taiba", "LeT", "Operation Sindoor",
            "26/11", "Mumbai attacks", "Ajmal Kasab", "David Headley", "Muridke", "Markaz Taiba",
            "Muzaffarabad", "terror training camps", "Pakistan terror camps", "India Pakistan", "counter terrorism",
            "documentary", "geopolitics", "Hafiz Saeed", "Daura-e-Khaas", "Pahalgam attack", "Indian Army",
            "West Point CTC", "national security", "explainer"]
    while len(", ".join(tags)) > 480:
        tags.pop()

    pinned = fill(yt["pinned"])
    teaser_cfg = json.loads((ROOT / "config" / "teaser.json").read_text())
    insta = fill(yt["instagram"])

    return {"cfg": cfg, "title": title, "description": desc, "tags": tags, "pinned": pinned,
            "instagram": insta, "chapters": chapters, "teaser_version": teaser_cfg["version"],
            "title_case": title_case(meta["title"])}


def main():
    m = build_meta()
    cfg, title, desc, tags, pinned, insta = m["cfg"], m["title"], m["description"], m["tags"], m["pinned"], m["instagram"]
    teaser_cfg = {"version": m["teaser_version"]}
    meta = {"title": m["title_case"]}
    chapters = m["chapters"]
    out = ROOT / "output" / "youtube_upload.md"
    out.write_text(f"""# YouTube upload kit — {meta['title']} (v{cfg['version']})

## Title ({len(title)}/100)
{title}

## Description ({len(desc)}/5000)
```
{desc}
```

## Tags ({len(', '.join(tags))}/500)
```
{', '.join(tags)}
```

## Thumbnail
`../brand/Thumbnail.png` (1280x720)

## Captions
Upload `output/captions.srt` as English subtitles.

## Pinned comment
{pinned}

## Instagram Reel caption (teaser v{teaser_cfg['version']})
```
{insta}
```
""")
    print(f"-> {out.relative_to(ROOT)}  (title {len(title)} chars, {len(chapters)} chapters, description {len(desc)} chars)")


if __name__ == "__main__":
    main()
