// Channel branding for "The Sisodia Files", rendered as stills with the same fonts,
// colours and (India point-of-view) map data as the videos.
//   Banner 2560x1440 (text inside YouTube's 1546x423 safe area), Avatar 800x800,
//   Watermark 150x150 (transparent), Thumbnail 1280x720 (per-video, from config).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { geoGraticule, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import region from "../../public/map/region.json";
import { config } from "../data";
import youtubeCfg from "../../config/youtube.json";
import { PLACES } from "../locations";
import { body, C, display } from "../theme";

const CHANNEL = config.channel_name || "The Sisodia Files";
const HANDLE = config.channel_handle || "@SisodiaFiles";
const [NAME_PRE, NAME_MAIN] = (() => {
  const w = CHANNEL.toUpperCase().split(" ");
  return w.length > 2
    ? [w.slice(0, 1).join(" "), w.slice(1).join(" ")]
    : ["", w.join(" ")];
})();

/** Faint South Asia map (India POV boundaries) with the training / strike sites. */
const BrandMap: React.FC<{
  width: number;
  height: number;
  extent: [[number, number], [number, number]];
  pinScale?: number;
}> = ({ width, height, extent, pinScale = 1 }) => {
  const projection = geoMercator().fitExtent(
    [
      [0, 0],
      [width, height],
    ],
    { type: "MultiPoint", coordinates: extent },
  );
  const path = geoPath(projection);
  const features = (region as unknown as FeatureCollection).features;
  const sites = Object.values(PLACES).filter((p) => !p.reference);
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
    >
      <rect width={width} height={height} fill={C.water} />
      <path
        d={path(geoGraticule().step([1, 1])()) ?? ""}
        fill="none"
        stroke="#141b27"
        strokeWidth={1}
      />
      {features.map((f, i) => (
        <path
          key={i}
          d={path(f) ?? ""}
          fill={
            (f.properties as { name: string }).name === "India"
              ? "#182031"
              : C.land
          }
          stroke={C.border}
          strokeWidth={1.2}
        />
      ))}
      {sites.map((p, i) => {
        const [x, y] = projection(p.lonLat) as [number, number];
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={22 * pinScale}
              fill="none"
              stroke={C.red}
              strokeWidth={2}
              opacity={0.35}
            />
            <circle cx={x} cy={y} r={7 * pinScale} fill={C.red} />
          </g>
        );
      })}
    </svg>
  );
};

/** "SF" monogram: case-file square with a folder tab and a redaction bar. */
export const Monogram: React.FC<{ size: number; transparent?: boolean }> = ({
  size,
  transparent = false,
}) => {
  const s = size / 100;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* folder tab */}
      <div
        style={{
          position: "absolute",
          left: 14 * s,
          top: 12 * s,
          width: 30 * s,
          height: 10 * s,
          background: C.accent,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 14 * s,
          top: 20 * s,
          width: 72 * s,
          height: 66 * s,
          background: transparent ? "rgba(7,9,13,0.85)" : C.bg,
          border: `${3 * s}px solid ${C.ink}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 42 * s,
            color: C.ink,
            letterSpacing: 1 * s,
            marginTop: -16 * s,
          }}
        >
          SF
        </div>
        <div
          style={{
            position: "absolute",
            left: 14 * s,
            right: 14 * s,
            bottom: 9 * s,
            height: 4.5 * s,
            background: C.red,
          }}
        />
      </div>
    </div>
  );
};

export const Banner: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <BrandMap
      width={2560}
      height={1440}
      extent={[
        [60, 20],
        [84, 38],
      ]}
      pinScale={1.3}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(7,9,13,0.92) 0%, rgba(7,9,13,0.75) 45%, rgba(7,9,13,0.2) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.06,
        backgroundImage: `url(${staticFile("fx/grain.png")})`,
      }}
    />
    {/* safe area 1546x423, centred */}
    <div
      style={{
        position: "absolute",
        left: (2560 - 1546) / 2,
        top: (1440 - 423) / 2,
        width: 1546,
        height: 423,
        display: "flex",
        alignItems: "center",
        gap: 60,
      }}
    >
      <Monogram size={300} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 12,
            color: C.accent,
          }}
        >
          INVESTIGATIVE DOCUMENTARIES
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 150,
            lineHeight: 1,
            color: C.ink,
            marginTop: 10,
            whiteSpace: "nowrap",
          }}
        >
          {NAME_PRE && (
            <span style={{ fontWeight: 400, color: C.dim, marginRight: 26 }}>
              {NAME_PRE}
            </span>
          )}
          {NAME_MAIN}
        </div>
        <div
          style={{
            width: 180,
            height: 5,
            background: C.red,
            margin: "26px 0 22px",
          }}
        />
        <div style={{ fontFamily: body, fontSize: 38, color: C.dim }}>
          Terror, security &amp; geopolitics — every claim sourced.
        </div>
        <div
          style={{
            fontFamily: body,
            fontWeight: 700,
            fontSize: 32,
            color: C.accent,
            marginTop: 14,
          }}
        >
          {HANDLE}
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

export const Avatar: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: C.bg,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, #1c2536 0%, ${C.bg} 70%)`,
      }}
    />
    <Monogram size={560} />
  </AbsoluteFill>
);

export const Watermark: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <Monogram size={150} transparent />
  </AbsoluteFill>
);

type ThumbCfg = {
  image: string;
  image_credit: string;
  title_lines: string[];
  accent_line?: number;
  subtitle: string;
  badge?: string;
  pin?: [number, number] | null;
};
const THUMB = (youtubeCfg as unknown as { thumbnail: ThumbCfg }).thumbnail;

/** Per-video YouTube thumbnail, driven by config/youtube.json "thumbnail". */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
    <Img src={staticFile(THUMB.image)} style={{
      position: "absolute", left: -120, top: -40, width: 900, height: 800, objectFit: "cover",
      filter: "grayscale(0.35) contrast(1.15) brightness(0.8)",
    }} />
    <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(7,9,13,0) 25%, ${C.bg} 58%)` }} />
    {THUMB.pin && (
      <div style={{ position: "absolute", left: THUMB.pin[0], top: THUMB.pin[1] }}>
        <div style={{ position: "absolute", left: -70, top: -70, width: 140, height: 140, borderRadius: 70, border: `6px solid ${C.red}` }} />
        <div style={{ position: "absolute", left: -18, top: -18, width: 36, height: 36, borderRadius: 18, background: C.red }} />
      </div>
    )}
    <div style={{ position: "absolute", left: 610, top: 60, right: 50 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ background: C.red, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 34, letterSpacing: 4, padding: "4px 16px" }}>
          {(config as { file_word?: string }).file_word ?? "FILE"} {config.file_number ?? "01"}
        </div>
        {THUMB.badge && (
          <div style={{ border: `2px solid ${C.ink}`, color: C.ink, fontFamily: display, fontWeight: 700, fontSize: 30, letterSpacing: 3, padding: "4px 14px" }}>
            {THUMB.badge}
          </div>
        )}
      </div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: THUMB.title_lines.length <= 2 ? 160 : 116, lineHeight: 0.95, color: C.ink, marginTop: 20, textTransform: "uppercase" }}>
        {THUMB.title_lines.map((l, i) => (
          <div key={i} style={{ color: i === (THUMB.accent_line ?? 1) ? C.accent : C.ink }}>{l}</div>
        ))}
      </div>
      <div style={{ fontFamily: body, fontWeight: 700, fontSize: 38, color: C.ink, marginTop: 22, lineHeight: 1.25 }}
        dangerouslySetInnerHTML={{ __html: THUMB.subtitle }} />
    </div>
    <div style={{ position: "absolute", left: 610, bottom: 40, display: "flex", alignItems: "center", gap: 14 }}>
      <Monogram size={60} />
      <div style={{ fontFamily: body, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: C.dim }}>{CHANNEL.toUpperCase()}</div>
    </div>
    <div style={{ position: "absolute", left: 14, bottom: 10, fontFamily: body, fontSize: 13, color: "#9aa3b2" }}>{THUMB.image_credit}</div>
  </AbsoluteFill>
);
