#!/usr/bin/env python3
"""Wikimedia Commons helper for licence-clean photos.

  commons.py search "query" ["query" ...]        list candidates with licence (✗ = not free)
  commons.py dl '{"key": "File title.jpg", ...}'  download to public/photos/<key>.<ext>, record
                                                  licence/artist/source in public/photos/_meta.json
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public" / "photos"
UA = {"User-Agent": "SisodiaFiles-research/1.0 (shrawin@amnex.com)"}
OK = re.compile(r"public domain|pd|cc0|cc by|godl|gfdl", re.I)


def api(params):
    q = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    return json.loads(urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=60).read().decode(), strict=False)


def clean(v):
    return re.sub(r"\s+", " ", re.sub("<[^>]+>", "", v or "")).strip()


def search(queries):
    for query in queries:
        r = api({"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap", "gsrnamespace": 6,
                 "gsrlimit": 8, "prop": "imageinfo", "iiprop": "size|extmetadata",
                 "iiextmetadatafilter": "LicenseShortName|Artist"})
        pages = sorted(r.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
        print(f"== {query}")
        for p in pages:
            ii = (p.get("imageinfo") or [{}])[0]
            m = ii.get("extmetadata", {})
            lic = clean(m.get("LicenseShortName", {}).get("value", "?"))
            art = clean(m.get("Artist", {}).get("value", ""))[:40]
            print(f"  {'  ' if OK.search(lic) else '✗ '}{p['title'][5:85]:83} {ii.get('width')}x{ii.get('height')} | {lic} | {art}")
        time.sleep(0.4)


def dl(items):
    mp = PHOTOS / "_meta.json"
    meta = json.loads(mp.read_text()) if mp.exists() else {}
    for key, title in items.items():
        d = api({"action": "query", "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 2400, "titles": "File:" + title})
        pg = list(d["query"]["pages"].values())[0]
        if "imageinfo" not in pg:
            print("MISSING", key, title)
            continue
        ii = pg["imageinfo"][0]
        m = ii["extmetadata"]
        url = ii.get("thumburl") or ii["url"]
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        ext = ".png" if data[:4] == b"\x89PNG" else ".jpg"
        (PHOTOS / f"{key}{ext}").write_bytes(data)
        lic = clean(m.get("LicenseShortName", {}).get("value", ""))
        art = clean(m.get("Artist", {}).get("value", ""))[:70]
        meta[key] = {"file": f"photos/{key}{ext}", "license": lic, "artist": art,
                     "source": "https://commons.wikimedia.org/wiki/File:" + title.replace(" ", "_")}
        print(f"{key:18} {lic:14} {art}")
        time.sleep(1)
    mp.write_text(json.dumps(meta, indent=1))


if __name__ == "__main__":
    {"search": lambda a: search(a), "dl": lambda a: dl(json.loads(a[0]))}[sys.argv[1]](sys.argv[2:])
