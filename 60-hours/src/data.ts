// Typed access to the pipeline outputs. segments.json is the single source of truth;
// nothing about segment content is hardcoded in components.
import segmentsJson from "../segments.json";
import configJson from "../config/video.json";
import photosJson from "../config/photos.json";

export type Word = { text: string; startMs: number; endMs: number; p: number };
export type Paragraph = {
  text: string;
  bold: string[];
  bullet: boolean;
  headline: string;
  subline: string;
};
export type SitePin = { label: string; place: string | null; trigger: string };

export type Segment = {
  id: string;
  index: number;
  label: string;
  title: string;
  visual_cue_raw: string;
  visual_type: "map" | "headline" | "controlroom" | "stats";
  lower_third_text: string;
  lower_third_after_paragraph: number | null;
  citation_card_text: string;
  citation_after_paragraph: number | null;
  title_card: boolean;
  end_card: boolean;
  disputed: boolean;
  dark_grade: boolean;
  map_zoom_out: boolean;
  locations: string[];
  site_pins: SitePin[];
  paragraphs: Paragraph[];
  narration_text: string;
  duration_seconds?: number;
  paragraph_starts?: number[];
  audio_file?: string;
  words?: Word[];
  // per-segment visual overrides (config/visuals.json)
  map?: "city" | "region";
  pins?: string[];
  dim_pins?: string[];
  route?: ([number, number] | string)[];
  route_from_paragraph?: number;
  route_mode?: "shift";
  resolve?: { place: string; paragraph: number; at_word: string }[];
  secure?: { place: string; paragraph: number; at_word: string };
  pulse_fast?: boolean;
  pulse_all?: boolean;
  zoom?: number;
  clock_intro?: boolean;
  clock_start?: string | null;
  clock_events?: { p: number; trigger: string; at: string; has_time: boolean }[];
  stats?: { value: number; suffix?: string; label: string; note?: string; at_word: string }[];
};

export type VideoConfig = {
  fps: number;
  width: number;
  height: number;
  title_card_seconds: number;
  end_card_seconds: number;
  music_volume: number;
  channel_name: string;
  series_label?: string;
  file_number?: string;
  channel_handle: string;
  end_card_cta: string;
  title_card_position?: "after_cold_open" | "start";
};

export const config = configJson as unknown as VideoConfig;
export const meta = segmentsJson.meta as { title: string; subtitle: string };
export const sources = segmentsJson.sources as string[];
export const segments = segmentsJson.segments as unknown as Segment[];

export const FPS = config.fps;
export const msToFrames = (ms: number) => Math.round((ms / 1000) * FPS);
export const segmentFrames = (s: Segment) =>
  Math.max(FPS * 2, Math.ceil((s.duration_seconds ?? 5) * FPS));

// Timeline: ordered blocks the <Series> renders.
export type Block =
  | { kind: "title"; frames: number }
  | { kind: "segment"; frames: number; segment: Segment }
  | { kind: "end"; frames: number };

export const buildTimeline = (): Block[] => {
  const title: Block = {
    kind: "title",
    frames: config.title_card_seconds * FPS,
  };
  const blocks: Block[] = [];
  const titleAfter =
    config.title_card_position !== "start"
      ? segments.findIndex((s) => s.title_card)
      : -1;
  if (titleAfter < 0) blocks.push(title);
  segments.forEach((s, i) => {
    blocks.push({ kind: "segment", frames: segmentFrames(s), segment: s });
    if (i === titleAfter) blocks.push(title);
  });
  blocks.push({ kind: "end", frames: config.end_card_seconds * FPS });
  return blocks;
};

// Training phases (for the progress strip) — matched against segment titles.
export const PHASES = [
  {
    key: "SUFA",
    name: "Daura-e-Sufa",
    span: "~21 days",
    what: "Indoctrination",
  },
  {
    key: "AAM",
    name: "Daura-e-Aam",
    span: "~21 days",
    what: "Basic / physical",
  },
  { key: "KHIDMAT", name: "Khidmat", span: "~2 months", what: "Camp service" },
  { key: "KHAAS", name: "Daura-e-Khaas", span: "~3 months", what: "Advanced" },
  {
    key: "RIBAT",
    name: "Ribat + Leadership",
    span: "select few",
    what: "Final tier",
  },
];
export const phaseIndexFor = (s: Segment): number => {
  // "BEYOND KHAAS: RIBAT AND…" -> look after the colon, so the phase being introduced wins
  const afterColon = s.title.includes(":") ? s.title.split(":")[1] : s.title;
  const head = afterColon.split(",")[0].toUpperCase();
  const hits = PHASES.map((p, i) => [head.lastIndexOf(p.key), i]).filter(
    ([pos]) => pos >= 0,
  );
  if (!hits.length) return -1;
  hits.sort((a, b) => a[0] - b[0]);
  return hits[0][1];
};

// Find when a word/phrase is spoken (first match at or after fromMs). Punctuation-insensitive.
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9-]/g, "");
export const findSpoken = (
  s: Segment,
  phrase: string,
  fromMs = 0,
): number | null => {
  const target = norm(phrase.split(/\s+/)[0]);
  const w = (s.words ?? []).find(
    (x) =>
      x.startMs >= fromMs &&
      x.text.split(/\s+/).some((part) => norm(part).startsWith(target)),
  );
  return w ? w.startMs : null;
};

export const paragraphStartMs = (s: Segment, i: number) =>
  s.paragraph_starts?.[i] ?? 0;

// Licensed photo placements (config/photos.json), resolved to frames within a segment.

type PhotoImage = { file: string; credit: string; source: string };
type Placement = {
  segment: string;
  paragraph: number;
  at_word?: string;
  at_ms?: number;
  seconds: number;
  images: string[];
  labels?: string[];
  caption: string;
  fit?: "cover" | "contain";
};
export const photoImages = photosJson.images as Record<string, PhotoImage>;

export const photosFor = (s: Segment) =>
  (photosJson.placements as Placement[])
    .filter((p) => p.segment === s.id)
    .map((p) => {
      const pStart = paragraphStartMs(s, p.paragraph);
      const spoken = p.at_word ? findSpoken(s, p.at_word, pStart) : null;
      const from = msToFrames(spoken ?? pStart + (p.at_ms ?? 0));
      return {
        from,
        frames: Math.round(p.seconds * FPS),
        caption: p.caption,
        labels: p.labels,
        fit: p.fit,
        images: p.images.map((k) => ({
          src: photoImages[k].file,
          credit: photoImages[k].credit,
        })),
      };
    });

// Unique credit lines for every image actually placed (end card + description).
export const photoCredits = [
  ...new Set(
    (photosJson.placements as Placement[]).flatMap((p) =>
      p.images.map((k) => photoImages[k].credit),
    ),
  ),
];
