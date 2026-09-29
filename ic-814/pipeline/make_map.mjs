// Build the base-map data used by <MapScene>: Natural Earth 1:10m admin-0 countries,
// INDIA POINT-OF-VIEW edition (public domain). This video is published in India, so
// maps must show the whole of Jammu & Kashmir and Ladakh (incl. PoK, Gilgit-Baltistan,
// Aksai Chin) as part of India. Do not swap this for a default/de-facto worldview.
// Output: public/map/region.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoArea, geoContains } from "d3-geo";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "map", "region.json");
const SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson";
const KEEP = new Set([
  "India", "Pakistan", "China", "Afghanistan", "Iran", "Nepal", "Tajikistan", "Turkmenistan",
  "Uzbekistan", "Bhutan", "Bangladesh", "Oman", "Sri Lanka", "United Arab Emirates", "Saudi Arabia", "Qatar",
]);

const src = await (await fetch(SRC)).json();
const fc = {
  type: "FeatureCollection",
  features: src.features
    .filter((f) => KEEP.has(f.properties.ADMIN))
    .map((f) => ({ type: "Feature", properties: { name: f.properties.ADMIN }, geometry: f.geometry })),
};

// Guard: fail the build if the India boundary doesn't include J&K / Ladakh.
const india = fc.features.find((f) => f.properties.name === "India");
const mustBeIndia = {
  Muzaffarabad: [73.472, 34.358], Kotli: [73.899, 33.505], Bhimber: [74.073, 32.975],
  Gilgit: [74.31, 35.92], Srinagar: [74.8, 34.08], Leh: [77.58, 34.16], "Aksai Chin": [79.3, 35.2],
};
const bad = Object.entries(mustBeIndia).filter(([, p]) => !geoContains(india, p)).map(([n]) => n);
if (bad.length) throw new Error(`India boundary check failed — outside India: ${bad.join(", ")}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(fc));

// World basemap for intercontinental routes: the same 1:10m India point-of-view data
// (the only India-POV edition), simplified for world scale — same India guard.
const world = src;
const q = 0.05; // ~5 km grid: invisible at world scale, ~15x smaller file
const simplifyRing = (ring) => {
  const out = [];
  for (const [x, y] of ring) {
    const p = [Math.round(x / q) * q, Math.round(y / q) * q].map((v) => +v.toFixed(2));
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  if (out.length && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) out.push(out[0]);
  return out.length >= 4 ? out : null;
};
const simplifyGeom = (g) => {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const kept = polys
    .map((poly) => poly.map(simplifyRing))
    .filter((poly) => poly[0])
    .map((poly) => poly.filter(Boolean))
    // rounding can flip a ring: d3-geo reads an exterior ring that covers more than a
    // hemisphere as "the whole globe minus this shape" — reverse those
    .map((poly) => (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map((r) => [...r].reverse()) : poly));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const wfc = {
  type: "FeatureCollection",
  features: world.features
    .filter((f) => f.properties.ADMIN !== "Antarctica")
    .map((f) => ({ type: "Feature", properties: { name: f.properties.ADMIN }, geometry: simplifyGeom(f.geometry) }))
    .filter((f) => f.geometry),
};
const wIndia = wfc.features.find((f) => f.properties.name === "India");
const wBad = Object.entries(mustBeIndia).filter(([, p]) => !geoContains(wIndia, p)).map(([n]) => n);
if (wBad.length) throw new Error(`World map India boundary check failed — outside India: ${wBad.join(", ")}`);
const WORLD_OUT = path.join(ROOT, "public", "map", "world.json");
fs.writeFileSync(WORLD_OUT, JSON.stringify(wfc));
console.log(`${wfc.features.length} shapes (India POV) -> public/map/world.json (${(fs.statSync(WORLD_OUT).size / 1e6).toFixed(1)} MB)`);
console.log(`${fc.features.length} shapes (India POV) -> ${path.relative(ROOT, OUT)} ` +
  `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB); J&K/Ladakh boundary check passed`);
