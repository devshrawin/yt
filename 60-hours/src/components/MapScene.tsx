import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geoGraticule, geoMercator, geoPath, type GeoProjection } from "d3-geo";
import type { FeatureCollection } from "geojson";
import region from "../../public/map/region.json";
import city from "../../public/map/mumbai.json";
import { findSpoken, msToFrames, paragraphStartMs, Segment } from "../data";
import { CITY_LABELS, PLACES, placeLabel, REGION_LABELS } from "../locations";
import { body, C, display } from "../theme";
import { MapPin } from "./MapPin";

const W = 1920;
const H = 1080;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Two basemaps. Paths are projected once per bundle; camera moves are a transform on top.
type Basemap = {
  projection: GeoProjection;
  layers: { d: string; fill: string; stroke: string; width: number; dash?: string }[];
  labels: { text: string; lonLat: [number, number]; size: number }[];
  credit: string;
};

const fit = (a: [number, number], b: [number, number]) =>
  geoMercator().fitExtent([[0, 0], [W, H]], { type: "MultiPoint", coordinates: [a, b] });

// Region: India point-of-view boundaries (Natural Earth, public domain)
const regionProj = fit([58, 14], [84, 31]);
const regionPath = geoPath(regionProj);
const REGION: Basemap = {
  projection: regionProj,
  layers: [
    { d: regionPath(geoGraticule().step([1, 1])()) ?? "", fill: "none", stroke: "#161d29", width: 1 },
    ...(region as unknown as FeatureCollection).features.map((f) => {
      const name = (f.properties as { name: string }).name;
      return { d: regionPath(f) ?? "", fill: name === "India" ? C.landHi : C.land, stroke: C.border, width: name === "India" || name === "Pakistan" ? 1.6 : 1 };
    }),
  ],
  labels: REGION_LABELS,
  credit: "Map: Natural Earth",
};

// City: South Mumbai from OpenStreetMap (ODbL)
const cityProj = fit([72.796, 18.884], [72.872, 18.968]);
const cityPath = geoPath(cityProj);
const cityFeatures = (city as unknown as FeatureCollection).features;
const byKind = (k: string) => cityFeatures.filter((f) => (f.properties as { kind: string }).kind === k);
const joinPaths = (k: string) => byKind(k).map((f) => cityPath(f) ?? "").join(" ");
const CITY: Basemap = {
  projection: cityProj,
  layers: [
    ...byKind("land").map((f) => ({ d: cityPath(f) ?? "", fill: C.land, stroke: C.border, width: 1.4 })),
    { d: joinPaths("secondary"), fill: "none", stroke: "#1f2837", width: 1 },
    { d: joinPaths("primary"), fill: "none", stroke: "#27324a", width: 1.6 },
    { d: joinPaths("trunk"), fill: "none", stroke: "#2f3b56", width: 2.4 },
    { d: joinPaths("rail"), fill: "none", stroke: "#3a2f36", width: 1.4, dash: "5 4" },
  ],
  labels: CITY_LABELS,
  credit: "Map data © OpenStreetMap contributors",
};

type Camera = { cx: number; cy: number; zoom: number };
const WIDE: Camera = { cx: W / 2, cy: H / 2, zoom: 1 };
const fitCamera = (pts: [number, number][], fill: number, minSpan = 220): Camera => {
  if (!pts.length) return WIDE;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bw = Math.max(minSpan, Math.max(...xs) - Math.min(...xs));
  const bh = Math.max(minSpan * 0.56, Math.max(...ys) - Math.min(...ys));
  return {
    cx: (Math.max(...xs) + Math.min(...xs)) / 2,
    cy: (Math.max(...ys) + Math.min(...ys)) / 2,
    zoom: Math.max(0.9, Math.min(5, (W * fill) / bw, (H * fill) / bh)),
  };
};
const lerpCam = (a: Camera, b: Camera, t: number): Camera => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t),
});

const sideFor = (x: number, y: number, others: readonly (readonly [number, number])[]): "left" | "right" => {
  const near = others.filter(([ox, oy]) => Math.abs(ox - x) < 320 && Math.abs(oy - y) < 55);
  if (x > W * 0.62) return "left";
  if (x < 260) return "right";
  if (!near.length) return "right";
  // push the label away from the nearest neighbour; ties go right
  const nearest = near.reduce((a, b) => (Math.hypot(a[0] - x, a[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? a : b));
  return nearest[0] > x ? "left" : "right";
};

/** First time any alias of a place is spoken in the segment (ms), else null. */
const spokenAt = (seg: Segment, name: string): number | null => {
  const times = (PLACES[name]?.aliases ?? [name])
    .map((a) => findSpoken(seg, a.replace(/^the /i, "")))
    .filter((t): t is number => t != null);
  return times.length ? Math.min(...times) : null;
};
const eventFrame = (seg: Segment, ev?: { paragraph: number; at_word: string } | null) => {
  if (!ev) return null;
  const ms = findSpoken(seg, ev.at_word, paragraphStartMs(seg, ev.paragraph));
  return ms == null ? null : msToFrames(ms);
};

export const MapScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pinNames = seg.pins ?? seg.locations.filter((n) => PLACES[n]?.map === (seg.map ?? "region"));
  const base = (seg.map ?? (pinNames.every((n) => PLACES[n]?.map === "city") ? "city" : "region")) === "city" ? CITY : REGION;
  const project = (ll: [number, number]) => base.projection(ll) as [number, number];

  const pins = React.useMemo(
    () =>
      pinNames
        .filter((n) => PLACES[n])
        .map((name, i) => {
          const ms = spokenAt(seg, name);
          return { name, lonLat: PLACES[name].lonLat, atFrame: ms != null ? msToFrames(ms) : Math.round(fps * 0.8) + i * 14 };
        }),
    [seg, fps], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const dim = (seg.dim_pins ?? []).filter((n) => PLACES[n]);
  const resolves = (seg.resolve ?? []).map((r) => ({ place: r.place, at: eventFrame(seg, r) }));
  const secureAt = eventFrame(seg, seg.secure ?? null);

  const route: [number, number][] = (seg.route ?? []).map((w) =>
    typeof w === "string" ? PLACES[w].lonLat : (w as [number, number]),
  );
  const shiftRoute = seg.route_mode === "shift";
  const hasBeats = !seg.map_zoom_out && !seg.clock_intro;

  // ---- camera ------------------------------------------------------------
  const focus = [...pins.map((p) => p.lonLat), ...dim.map((n) => PLACES[n].lonLat), ...route].map(project);
  const target = fitCamera(focus, hasBeats ? 0.5 : 0.6);
  if (seg.zoom) target.zoom *= seg.zoom;
  const progress = frame / durationInFrames;
  let cam: Camera;
  if (seg.map_zoom_out) {
    cam = lerpCam({ ...target, zoom: target.zoom * 1.25 }, { ...WIDE, zoom: 0.95 }, Easing.inOut(Easing.cubic)(progress));
  } else if (seg.clock_intro) {
    cam = lerpCam({ ...WIDE, zoom: 0.95 }, target, Easing.out(Easing.cubic)(Math.min(1, progress * 1.3)));
  } else {
    cam = { ...target, zoom: target.zoom * interpolate(progress, [0, 1], [1, 1.07]) };
  }
  const offsetX = hasBeats ? -W * 0.14 : 0;
  const toScreen = (ll: [number, number]) => {
    const [px, py] = project(ll);
    return [(px - cam.cx) * cam.zoom + W / 2 + offsetX, (py - cam.cy) * cam.zoom + H / 2] as const;
  };

  const fadeIn = interpolate(frame, [seg.clock_intro ? 45 : 0, seg.clock_intro ? 85 : 15], [0, 1], clamp);
  const fadeOut = seg.map_zoom_out ? interpolate(frame, [durationInFrames - fps * 3, durationInFrames - 10], [1, 0], clamp) : 1;

  // ---- voyage route (smooth curve through waypoints, drawn progressively) --
  const routeStart = msToFrames(paragraphStartMs(seg, seg.route_from_paragraph ?? 0));
  const routeT = interpolate(frame, [routeStart, routeStart + (durationInFrames - routeStart) * 0.7], [0, 1], clamp);
  const routePts = route.map(toScreen);
  const routeD = routePts
    .map((p, i) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const prev = routePts[i - 1];
      const mx = (prev[0] + p[0]) / 2;
      const my = (prev[1] + p[1]) / 2;
      return `Q ${prev[0]} ${prev[1]} ${mx} ${my}` + (i === routePts.length - 1 ? ` T ${p[0]} ${p[1]}` : "");
    })
    .join(" ");
  const headIdx = Math.min(routePts.length - 1, routeT * (routePts.length - 1));
  const hi = Math.floor(headIdx);
  const hf = headIdx - hi;
  const head = routePts.length
    ? [
        routePts[hi][0] + ((routePts[Math.min(hi + 1, routePts.length - 1)][0] - routePts[hi][0]) * hf),
        routePts[hi][1] + ((routePts[Math.min(hi + 1, routePts.length - 1)][1] - routePts[hi][1]) * hf),
      ]
    : null;

  const dropped = pins.filter((p) => frame >= p.atFrame);
  const active = dropped[dropped.length - 1];

  return (
    <AbsoluteFill style={{ backgroundColor: C.water, opacity: fadeIn * fadeOut }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="vig" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
        </defs>
        <g transform={`translate(${W / 2 + offsetX} ${H / 2}) scale(${cam.zoom}) translate(${-cam.cx} ${-cam.cy})`}>
          {base.layers.map((l, i) => (
            <path key={i} d={l.d} fill={l.fill} stroke={l.stroke} strokeWidth={l.width} strokeDasharray={l.dash}
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>
        {route.length > 1 && (
          <>
            <path d={routeD} fill="none" stroke={C.red} strokeWidth={3.5} strokeDasharray="10 8" pathLength={1000}
              style={{ strokeDasharray: `${routeT * 1000} 1000` }} opacity={0.9} />
            {head && routeT > 0 && routeT < 1 && (
              <g transform={`translate(${head[0]} ${head[1]})`}>
                <circle r={16} fill={C.red} opacity={0.25} />
                <circle r={7} fill={C.ink} />
              </g>
            )}
          </>
        )}
        {shiftRoute && dropped.length >= 2 &&
          dropped.slice(1).map((p, i) => {
            const a = toScreen(dropped[i].lonLat);
            const b = toScreen(p.lonLat);
            const t = interpolate(frame, [p.atFrame, p.atFrame + 30], [0, 1], clamp);
            const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.25;
            const my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.25;
            return (
              <path key={i} d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={C.accent}
                strokeWidth={3} pathLength={1000} style={{ strokeDasharray: `${t * 1000} 1000` }} opacity={0.85} />
            );
          })}
        <rect width={W} height={H} fill="url(#vig)" />
      </svg>

      {base.labels.map((l) => {
        const [x, y] = toScreen(l.lonLat);
        return (
          <div key={l.text} style={{
            position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", whiteSpace: "pre",
            fontFamily: display, fontSize: l.size * Math.min(1.4, Math.max(0.8, cam.zoom / 1.6)), letterSpacing: l.size / 3,
            color: C.dim, opacity: 0.32,
          }}>{l.text}</div>
        );
      })}

      {dim.map((name) => {
        const [x, y] = toScreen(PLACES[name].lonLat);
        const others = dim.filter((n) => n !== name).map((n) => toScreen(PLACES[n].lonLat));
        return <MapPin key={`d-${name}`} label={placeLabel(name)} x={x} y={y} small color="#5b6475" delay={0} labelSide={sideFor(x, y, others)} />;
      })}

      {pins.map((p) => {
        const [x, y] = toScreen(p.lonLat);
        const r = resolves.find((q) => q.place === p.name);
        const ended = r?.at != null && frame >= r.at;
        const secured = seg.secure?.place === p.name && secureAt != null && frame >= secureAt;
        const others = pins.filter((o) => o !== p).map((o) => toScreen(o.lonLat));
        const stateAt = ended ? r!.at! : secured ? secureAt! : null;
        return (
          <React.Fragment key={p.name}>
            <MapPin
              label={placeLabel(p.name)}
              x={x}
              y={y}
              delay={p.atFrame}
              color={secured ? "#4fbf7a" : ended ? "#6b7383" : shiftRoute && active !== p ? C.accent : C.red}
              strike={!ended && !secured}
              ringSpeed={seg.pulse_fast ? 1.8 : 1}
              labelSide={sideFor(x, y, others)}
              sublabel={secured ? "SECURED" : ended ? "SIEGE OVER" : undefined}
              dimFrom={shiftRoute && active && p !== active ? active.atFrame : null}
            />
            {stateAt != null && (
              <svg width={1} height={1} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
                <circle r={interpolate(frame, [stateAt, stateAt + 25], [10, 90], clamp)} fill="none"
                  stroke={secured ? "#4fbf7a" : C.ink} strokeWidth={3}
                  opacity={interpolate(frame, [stateAt, stateAt + 25], [0.9, 0], clamp)} />
              </svg>
            )}
          </React.Fragment>
        );
      })}

      {hasBeats && <BeatPanel seg={seg} durationInFrames={durationInFrames} />}
      <div style={{ position: "absolute", left: 24, bottom: 16, fontFamily: body, fontSize: 15, color: "#6b7383" }}>
        {base.credit}
      </div>
    </AbsoluteFill>
  );
};

/** Right-side fact card that changes with each narration paragraph (map segments). */
const BeatPanel: React.FC<{ seg: Segment; durationInFrames: number }> = ({ seg, durationInFrames }) => {
  const frame = useCurrentFrame();
  const starts = seg.paragraphs.map((_, i) => msToFrames(paragraphStartMs(seg, i)));
  let i = 0;
  while (i + 1 < starts.length && frame >= starts[i + 1] - 4) i++;
  const p = seg.paragraphs[i];
  const from = i === 0 ? 20 : starts[i] - 4;
  const to = i + 1 < starts.length ? starts[i + 1] - 4 : durationInFrames;
  const t = interpolate(frame, [from, from + 14, to - 10, to], [0, 1, 1, 0], clamp);
  const label = seg.label !== seg.title ? `${seg.label}  ·  ${seg.title.split(/:\s/)[0]}` : seg.title;
  return (
    <div style={{
      position: "absolute", right: 80, top: 330, width: 560, padding: "30px 34px", background: C.panel,
      borderLeft: `4px solid ${C.accent}`, fontFamily: body, opacity: t, transform: `translateY(${(1 - t) * 16}px)`,
    }}>
      <div style={{ fontSize: 17, letterSpacing: 4, fontWeight: 700, color: C.accent, textTransform: "uppercase" }}>{label}</div>
      {p.headline && (
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: C.ink, marginTop: 14, textTransform: "uppercase" }}>
          {p.headline}
        </div>
      )}
      <div style={{ fontSize: p.headline ? 27 : 33, lineHeight: 1.4, color: p.headline ? C.dim : C.ink, marginTop: 14, fontWeight: p.headline ? 400 : 500 }}>
        {p.subline}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
        {seg.paragraphs.map((_, k) => (
          <div key={k} style={{ width: 26, height: 3, background: k <= i ? C.accent : C.faint, opacity: k <= i ? 1 : 0.5 }} />
        ))}
      </div>
    </div>
  );
};
