// Place coordinates [lon, lat]. Researched values live in config/locations.json;
// place names must stay in sync with KNOWN_PLACES in pipeline/parse_script.py.
import locations from "../config/locations.json";
import video from "../config/video.json";

// Region label uses the required term (config/video.json "pok_term"), split over two lines.
const pokWords = video.pok_term.toUpperCase().split(" ");
const POK_LABEL = [
  pokWords.slice(0, Math.ceil(pokWords.length / 2)),
  pokWords.slice(Math.ceil(pokWords.length / 2)),
]
  .map((l) => l.join(" "))
  .join("\n");

type Entry = { label: string; lat: number; lng: number };

export const PLACES: Record<
  string,
  { lonLat: [number, number]; reference?: boolean }
> = {
  // context-only dots (not training sites)
  Lahore: { lonLat: [74.34, 31.55], reference: true },
  Abbottabad: { lonLat: [73.22, 34.15], reference: true },
  Islamabad: { lonLat: [73.05, 33.69], reference: true },
};
for (const [key, v] of Object.entries(
  locations.pakistan_training_camps as Record<string, Entry>,
)) {
  PLACES[key[0].toUpperCase() + key.slice(1)] = { lonLat: [v.lng, v.lat] };
}

// Individually-named strike sites (Op Sindoor), matched by label prefix, e.g. "Sawai Nala camp".
const SITES = Object.entries(locations.op_sindoor_nine_camps)
  .filter(([k]) => !k.startsWith("_"))
  .map(([, v]) => v as Entry);
export const findSite = (label: string): [number, number] | null => {
  const s = SITES.find((x) =>
    x.label.toLowerCase().startsWith(label.toLowerCase()),
  );
  return s ? [s.lng, s.lat] : null;
};

// Context labels always drawn faintly on the map.
export const REGION_LABELS: {
  text: string;
  lonLat: [number, number];
  size: number;
}[] = [
  { text: "PAKISTAN", lonLat: [68.6, 29.2], size: 46 },
  { text: "INDIA", lonLat: [77.8, 27.4], size: 46 },
  { text: "AFGHANISTAN", lonLat: [65.8, 33.6], size: 30 },
  { text: "CHINA", lonLat: [80.5, 35.8], size: 30 },
  { text: POK_LABEL, lonLat: [74.4, 35.3], size: 18 },
];
