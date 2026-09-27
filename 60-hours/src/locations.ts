// Map places for this video come from config/places.json (shared with the parser).
import placesJson from "../config/places.json";

export type Place = {
  lonLat: [number, number];
  aliases: string[];
  map: "city" | "region";
  label?: string;
  reference?: boolean;
};
type Label = { text: string; lonLat: [number, number]; size: number };

const cfg = placesJson as unknown as {
  places: Record<string, Place>;
  city_labels: Label[];
  region_labels: Label[];
};

export const PLACES = cfg.places;
export const CITY_LABELS = cfg.city_labels;
export const REGION_LABELS = cfg.region_labels;
export const placeLabel = (name: string) => PLACES[name]?.label ?? name;
