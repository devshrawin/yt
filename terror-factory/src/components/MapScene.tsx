import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { geoGraticule, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import region from "../../public/map/region.json";
import { findSpoken, msToFrames, paragraphStartMs, Segment } from "../data";
import { findSite, PLACES, REGION_LABELS } from "../locations";
import { body, C, display } from "../theme";
import { MapPin } from "./MapPin";

const W = 1920;
const H = 1080;

// Base projection: South Asia window fitted to the frame. Camera moves are applied as
// a transform on top, so the (heavy) country paths are computed once per bundle.
const projection = geoMercator().fitExtent(
  [
    [0, 0],
    [W, H],
  ],
  {
    type: "MultiPoint",
    coordinates: [
      [58, 18],
      [92, 40],
    ],
  },
);
const pathGen = geoPath(projection);
const COUNTRIES = (region as unknown as FeatureCollection).features.map(
  (f) => ({
    name: (f.properties as { name: string }).name,
    d: pathGen(f) ?? "",
  }),
);
const GRATICULE = pathGen(geoGraticule().step([1, 1])()) ?? "";
const project = (lonLat: [number, number]) =>
  projection(lonLat) as [number, number];

type Camera = { cx: number; cy: number; zoom: number };
const WIDE: Camera = { cx: W / 2, cy: H / 2, zoom: 1 };

const fitCamera = (
  pts: [number, number][],
  fill = 0.6,
  minSpan = 150,
): Camera => {
  if (!pts.length) return WIDE;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const bw = Math.max(minSpan, Math.max(...xs) - Math.min(...xs));
  const bh = Math.max(minSpan * 0.56, Math.max(...ys) - Math.min(...ys));
  return {
    cx: (Math.max(...xs) + Math.min(...xs)) / 2,
    cy: (Math.max(...ys) + Math.min(...ys)) / 2,
    zoom: Math.min(9, (W * fill) / bw, (H * fill) / bh),
  };
};
const lerpCam = (a: Camera, b: Camera, t: number): Camera => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  // interpolate zoom geometrically so zooms feel uniform
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t),
});

// Screen-pixel offsets so sites sharing one coordinate don't stack exactly.
const JITTER: [number, number][] = [
  [0, 0],
  [30, -24],
  [-30, 24],
];

type PinSpec = {
  label: string;
  lonLat: [number, number];
  offset?: [number, number];
  atFrame: number;
  reference: boolean;
  number?: number;
  sublabel?: string;
};

const pinsFor = (seg: Segment, fps: number): PinSpec[] => {
  if (seg.site_pins.length) {
    const perCoord: Record<string, number> = {};
    let from = 0;
    return seg.site_pins.map((p, i) => {
      const base = findSite(p.label) ??
        PLACES[p.place ?? ""]?.lonLat ?? [73.5, 33];
      const k = (perCoord[base.join()] = (perCoord[base.join()] ?? -1) + 1);
      const ms = findSpoken(seg, p.trigger, from);
      if (ms != null) from = ms + 1;
      return {
        label: p.label,
        sublabel: p.place ?? undefined,
        number: i + 1,
        reference: false,
        lonLat: base,
        offset: JITTER[k % JITTER.length],
        atFrame: ms != null ? msToFrames(ms) : fps + i * 20,
      };
    });
  }
  return seg.locations
    .filter((name) => PLACES[name])
    .map((name, i) => {
      const ms = findSpoken(seg, name);
      return {
        label: name,
        lonLat: PLACES[name].lonLat,
        reference: !!PLACES[name].reference,
        atFrame: ms != null ? msToFrames(ms) : Math.round(fps * 0.8) + i * 12,
      };
    });
};

// Put the label on the left when a neighbouring pin sits just to the right (or near the edge).
const sideFor = (
  x: number,
  y: number,
  others: readonly (readonly [number, number])[],
): "left" | "right" =>
  x > W * 0.72 ||
  others.some(([ox, oy]) => ox > x && ox - x < 260 && Math.abs(oy - y) < 45)
    ? "left"
    : "right";

const ALL_PRIMARY = Object.entries(PLACES).filter(([, v]) => !v.reference);

export const MapScene: React.FC<{ seg: Segment; durationInFrames: number }> = ({
  seg,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pins = React.useMemo(() => pinsFor(seg, fps), [seg, fps]);
  const hasPanel = seg.site_pins.length > 0;
  // long explanatory map segments get a per-paragraph fact panel on the right
  const hasBeats =
    !hasPanel && !seg.map_zoom_out && !/slow zoom/i.test(seg.visual_cue_raw);
  const shiftRoute = /shift/i.test(seg.visual_cue_raw);
  const slowZoomIn = /slow zoom/i.test(seg.visual_cue_raw);

  // --- camera -------------------------------------------------------------
  const primaryPts = pins
    .filter((p) => !p.reference)
    .map((p) => project(p.lonLat));
  const target = fitCamera(
    primaryPts.length
      ? primaryPts
      : ALL_PRIMARY.map(([, v]) => project(v.lonLat)),
    hasPanel || hasBeats ? 0.55 : 0.5,
  );
  const progress = frame / durationInFrames;
  let cam: Camera;
  if (seg.map_zoom_out) {
    const start = fitCamera(
      ALL_PRIMARY.map(([, v]) => project(v.lonLat)),
      0.55,
    );
    cam = lerpCam(
      start,
      { ...WIDE, zoom: 0.85 },
      Easing.inOut(Easing.cubic)(progress),
    );
  } else if (slowZoomIn) {
    const close = { ...target, zoom: target.zoom * 0.8 };
    cam = lerpCam(
      { ...WIDE, zoom: 1.05 },
      close,
      Easing.out(Easing.cubic)(Math.min(1, progress * 1.4)),
    );
  } else {
    cam = {
      ...target,
      zoom: target.zoom * interpolate(progress, [0, 1], [1, 1.08]),
    };
  }
  const offsetX = hasPanel || hasBeats ? -W * 0.14 : 0;
  const toScreen = (lonLat: [number, number]) => {
    const [px, py] = project(lonLat);
    return [
      (px - cam.cx) * cam.zoom + W / 2 + offsetX,
      (py - cam.cy) * cam.zoom + H / 2,
    ] as const;
  };

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeToBlack = seg.map_zoom_out
    ? interpolate(
        frame,
        [durationInFrames - fps * 3, durationInFrames - 10],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : 1;

  // the most recently dropped pin is "active"; earlier ones dim if a route is drawn
  const dropped = pins.filter((p) => !p.reference && frame >= p.atFrame);
  const active = dropped[dropped.length - 1];

  return (
    <AbsoluteFill
      style={{ backgroundColor: C.water, opacity: fadeIn * fadeToBlack }}
    >
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="vig" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
        </defs>
        <g
          transform={`translate(${W / 2 + offsetX} ${H / 2}) scale(${cam.zoom}) translate(${-cam.cx} ${-cam.cy})`}
        >
          <path
            d={GRATICULE}
            fill="none"
            stroke="#1a2230"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {COUNTRIES.map((c) => (
            <path
              key={c.name}
              d={c.d}
              fill={c.name === "Pakistan" ? C.landHi : C.land}
              stroke={C.border}
              strokeWidth={
                c.name === "Pakistan" || c.name === "India" ? 1.6 : 1
              }
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        {/* route between consecutive pins (e.g. "pin shifts from Muridke to Muzaffarabad") */}
        {shiftRoute &&
          dropped.length >= 2 &&
          (() => {
            const a = toScreen(dropped[dropped.length - 2].lonLat);
            const b = toScreen(dropped[dropped.length - 1].lonLat);
            const t = interpolate(
              frame,
              [active.atFrame, active.atFrame + 30],
              [0, 1],
              { extrapolateRight: "clamp" },
            );
            const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.25;
            const my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.25;
            const len = 2000;
            return (
              <path
                d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`}
                fill="none"
                stroke={C.accent}
                strokeWidth={3}
                strokeDasharray={`${len}`}
                strokeDashoffset={len * (1 - t)}
                opacity={0.85}
              />
            );
          })()}
        <rect width={W} height={H} fill="url(#vig)" />
      </svg>

      {REGION_LABELS.map((l) => {
        const [x, y] = toScreen(l.lonLat);
        const o =
          l.size < 24
            ? interpolate(cam.zoom, [1.6, 2.6], [0, 0.55], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : interpolate(cam.zoom, [3.5, 5.5], [0.35, 0.12], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        return (
          <div
            key={l.text}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%,-50%)",
              whiteSpace: "pre",
              textAlign: "center",
              fontFamily: display,
              fontSize: l.size,
              letterSpacing: l.size / 3,
              color: C.dim,
              opacity: o,
              lineHeight: 1.2,
            }}
          >
            {l.text}
          </div>
        );
      })}

      {seg.map_zoom_out
        ? ALL_PRIMARY.map(([name, v]) => {
            const [x, y] = toScreen(v.lonLat);
            const others = ALL_PRIMARY.filter(([n]) => n !== name).map(
              ([, o]) => toScreen(o.lonLat),
            );
            return (
              <MapPin
                key={name}
                label={name}
                x={x}
                y={y}
                small
                color={C.red}
                delay={0}
                labelSide={sideFor(x, y, others)}
              />
            );
          })
        : pins.map((p, i) => {
            const [sx, sy] = toScreen(p.lonLat);
            const [x, y] = [
              sx + (p.offset?.[0] ?? 0),
              sy + (p.offset?.[1] ?? 0),
            ];
            const strike = hasPanel;
            return (
              <MapPin
                key={i}
                label={hasPanel ? "" : p.label}
                x={x}
                y={y}
                delay={p.atFrame}
                small={p.reference}
                strike={strike}
                color={strike ? C.red : p.reference ? C.dim : C.accent}
                number={p.number}
                labelSide={sideFor(
                  x,
                  y,
                  pins
                    .filter((o) => o !== p && !o.reference)
                    .map((o) => toScreen(o.lonLat)),
                )}
                dimFrom={
                  shiftRoute && active && p !== active && !p.reference
                    ? active.atFrame
                    : null
                }
              />
            );
          })}

      {hasPanel && <SitePanel pins={pins} />}
      {hasBeats && <BeatPanel seg={seg} durationInFrames={durationInFrames} />}
    </AbsoluteFill>
  );
};

const SitePanel: React.FC<{ pins: PinSpec[] }> = ({ pins }) => {
  const frame = useCurrentFrame();
  const shown = pins.filter((p) => frame >= p.atFrame).length;
  const panelIn = interpolate(
    frame - (pins[0]?.atFrame ?? 0) + 20,
    [0, 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 150,
        width: 540,
        padding: "26px 30px",
        background: C.panel,
        borderLeft: `4px solid ${C.red}`,
        opacity: panelIn,
        transform: `translateX(${(1 - panelIn) * 40}px)`,
        fontFamily: body,
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontSize: 26,
          letterSpacing: 4,
          color: C.red,
        }}
      >
        OPERATION SINDOOR
      </div>
      <div style={{ fontSize: 18, color: C.dim, marginBottom: 16 }}>
        Sites named at India's May 7, 2025 briefing
      </div>
      {pins.map((p, i) => {
        const on = frame >= p.atFrame;
        const o = interpolate(frame, [p.atFrame, p.atFrame + 10], [0.28, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              padding: "6px 0",
              opacity: o,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                flex: "none",
                background: on ? C.red : "transparent",
                border: `2px solid ${on ? C.red : C.faint}`,
                color: "#000",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 25, fontWeight: 600, color: C.ink }}>
              {p.label}
            </div>
            <div style={{ fontSize: 19, color: C.dim, marginLeft: "auto" }}>
              {p.sublabel}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 14, fontSize: 17, color: C.faint }}>
        {shown}/{pins.length} · locations approximate
      </div>
    </div>
  );
};

/** Right-side fact card that changes with each narration paragraph (map segments). */
const BeatPanel: React.FC<{ seg: Segment; durationInFrames: number }> = ({
  seg,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const starts = seg.paragraphs.map((_, i) =>
    msToFrames(paragraphStartMs(seg, i)),
  );
  let i = 0;
  while (i + 1 < starts.length && frame >= starts[i + 1] - 4) i++;
  const p = seg.paragraphs[i];
  const from = i === 0 ? 20 : starts[i] - 4;
  const to = i + 1 < starts.length ? starts[i + 1] - 4 : durationInFrames;
  const t = interpolate(frame, [from, from + 14, to - 10, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const label =
    seg.label !== seg.title
      ? `${seg.label}  ·  ${seg.title.split(":")[0]}`
      : seg.title;
  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 290,
        width: 560,
        padding: "30px 34px",
        background: C.panel,
        borderLeft: `4px solid ${C.accent}`,
        fontFamily: body,
        opacity: t,
        transform: `translateY(${(1 - t) * 16}px)`,
      }}
    >
      <div
        style={{
          fontSize: 17,
          letterSpacing: 4,
          fontWeight: 700,
          color: C.accent,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {p.headline && (
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.05,
            color: C.ink,
            marginTop: 14,
            textTransform: "uppercase",
          }}
        >
          {p.headline}
        </div>
      )}
      <div
        style={{
          fontSize: p.headline ? 27 : 34,
          lineHeight: 1.4,
          color: p.headline ? C.dim : C.ink,
          marginTop: 14,
          fontWeight: p.headline ? 400 : 500,
        }}
      >
        {p.subline}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
        {seg.paragraphs.map((_, k) => (
          <div
            key={k}
            style={{
              width: 26,
              height: 3,
              background: k <= i ? C.accent : C.faint,
              opacity: k <= i ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
};
