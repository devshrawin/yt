// Build the base-map data used by <MapScene>: Natural Earth 1:10m admin-0 countries,
// INDIA POINT-OF-VIEW edition (public domain). This video is published in India, so
// maps must show the whole of Jammu & Kashmir and Ladakh (incl. PoK, Gilgit-Baltistan,
// Aksai Chin) as part of India. Do not swap this for a default/de-facto worldview.
// Output: public/map/region.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoContains } from "d3-geo";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "map", "region.json");
const SRC =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson";
const KEEP = new Set([
  "India", "Pakistan", "China", "Afghanistan", "Iran", "Nepal", "Tajikistan", "Turkmenistan",
  "Uzbekistan", "Bhutan", "Bangladesh", "Oman", "Sri Lanka",
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
console.log(`${fc.features.length} shapes (India POV) -> ${path.relative(ROOT, OUT)} ` +
  `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB); J&K/Ladakh boundary check passed`);
