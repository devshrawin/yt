#!/usr/bin/env python3
"""City-scale basemap for South Mumbai from OpenStreetMap (ODbL — credit
"Map data © OpenStreetMap contributors" on screen and in the description).

Fetches coastline, trunk/primary/secondary roads and rail via the Overpass API,
stitches the coastline into land polygons (OSM coastline has land on its left;
the open chain around the peninsula is closed along the northern edge), and writes
public/map/mumbai.json as GeoJSON: land polygons + road/rail lines.
"""
import json
import time
import urllib.parse
import urllib.request

from tts_lib import ROOT

BBOX = (18.88, 72.78, 19.06, 72.90)  # S, W, N, E — South Mumbai up to Worli
OUT = ROOT / "public" / "map" / "mumbai.json"
APIS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"]


def overpass(q):
    """Query Overpass, retrying across public mirrors (they time out under load)."""
    last = None
    for attempt in range(6):
        api = APIS[attempt % len(APIS)]
        try:
            req = urllib.request.Request(api, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "SisodiaFiles-doc/1.0"})
            with urllib.request.urlopen(req, timeout=200) as r:
                return json.load(r)["elements"]
        except Exception as e:  # 429/504 under load
            last = e
            print(f"  overpass {api.split('/')[2]} failed ({e}); retrying")
            time.sleep(5 * (attempt + 1))
    raise SystemExit(f"Overpass unavailable: {last}")


def stitch(ways):
    ways = [w for w in ways if len(w) > 1]
    chains = []
    while ways:
        c = ways.pop(0)
        changed = True
        while changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == c[-1]:
                    c, changed = c + w[1:], True
                elif w[-1] == c[0]:
                    c, changed = w + c[1:], True
                else:
                    continue
                ways.pop(i)
                break
        chains.append(c)
    return chains


def main():
    s, w, n, e = BBOX
    coast = overpass(f'[out:json][timeout:120];way["natural"="coastline"]({s},{w},{n},{e});out geom;')
    lines = overpass(f'[out:json][timeout:180];(way["highway"~"^(trunk|primary|secondary)$"]({s},{w},{n},{e});'
                     f'way["railway"="rail"]({s},{w},{n},{e}););out geom;')
    rnd = lambda p: (round(p["lon"], 5), round(p["lat"], 5))
    chains = stitch([[rnd(p) for p in el["geometry"]] for el in coast])
    features = []
    top = n + 0.05
    # only the main peninsula chain is closed through the north; short open fragments
    # (bits of the far shore clipped by the bbox) would otherwise close over the sea
    longest_open = max((c for c in chains if c[0] != c[-1]), key=len, default=None)
    chains = [c for c in chains if c[0] == c[-1] or c is longest_open]
    for c in chains:
        if c[0] != c[-1]:  # open chain: close it through the (land) north
            c = c + [(c[-1][0], top), (c[0][0], top), c[0]]
        # d3-geo is spherical: an exterior ring must run clockwise (negative planar area in
        # lon/lat), otherwise it is read as "the whole globe minus this polygon".
        area = sum(c[i][0] * c[i + 1][1] - c[i + 1][0] * c[i][1] for i in range(len(c) - 1))
        if area > 0:
            c = c[::-1]
        features.append({"type": "Feature", "properties": {"kind": "land"},
                         "geometry": {"type": "Polygon", "coordinates": [c]}})
    for el in lines:
        tags = el.get("tags", {})
        kind = "rail" if tags.get("railway") == "rail" else tags.get("highway")
        features.append({"type": "Feature", "properties": {"kind": kind},
                         "geometry": {"type": "LineString", "coordinates": [rnd(p) for p in el["geometry"]]}})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
    kinds = {}
    for f in features:
        kinds[f["properties"]["kind"]] = kinds.get(f["properties"]["kind"], 0) + 1
    print(f"-> {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e6:.1f} MB) {kinds}")


if __name__ == "__main__":
    main()
