// File 02 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import city from "../../public/map/mumbai.json";
import { body, display } from "../theme";
import { Monogram } from "./Brand";
import { PLACES } from "../locations";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>THE SISODIA FILES · 02</div>
  </div>
);

const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);

/** A — "The Clock": glowing countdown over a fire-graded Taj dome. */
export const Thumb02A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050303", overflow: "hidden" }}>
    <Img src={staticFile("photos/taj_dome_burned.jpg")} style={{
      position: "absolute", right: -140, top: -60, width: 900, height: 860, objectFit: "cover",
      filter: "sepia(0.55) saturate(2.2) hue-rotate(-18deg) contrast(1.25) brightness(0.62)",
    }} />
    {/* firelight + smoke */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 60% at 78% 40%, rgba(255,90,20,0.35) 0%, rgba(0,0,0,0) 60%)", mixBlendMode: "screen" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #050303 30%, rgba(5,3,3,0.85) 48%, rgba(5,3,3,0) 75%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 35%)" }} />
    <div style={{ position: "absolute", left: 50, top: 70 }}>
      <div style={{ display: "inline-block", background: "#fff", color: "#000", fontFamily: display, fontWeight: 700, fontSize: 44, padding: "0 14px", letterSpacing: 2 }}>
        26/11
      </div>
      <div style={{
        fontFamily: display, fontWeight: 700, fontSize: 210, lineHeight: 0.95, color: RED, marginTop: 18, letterSpacing: 4,
        fontVariantNumeric: "tabular-nums", textShadow: `0 0 18px ${RED}, 0 0 60px rgba(255,45,45,0.7), 0 6px 0 #5a0000`,
      }}>60:00</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 92, lineHeight: 1, color: "#fff", letterSpacing: 10, marginTop: 6, textShadow: "0 4px 18px #000" }}>
        HOURS
      </div>
      <div style={{ display: "inline-block", marginTop: 26, background: YELLOW, color: "#000", fontFamily: body, fontWeight: 900, fontSize: 38, padding: "6px 16px", letterSpacing: 1 }}>
        10 MEN · 5 TARGETS
      </div>
    </div>
    <Brand x={50} y={636} />
    <Credit text="Photo: Nichalp / Wikimedia Commons, CC BY-SA 3.0" />
  </AbsoluteFill>
);

// South Mumbai map for variant B
const proj = geoMercator().fitExtent([[560, 20], [1260, 700]], { type: "MultiPoint", coordinates: [[72.80, 18.895], [72.855, 18.965]] });
const path = geoPath(proj);
const LAND = (city as unknown as FeatureCollection).features.filter((f) => (f.properties as { kind: string }).kind === "land").map((f) => path(f) ?? "");
const ROADS = (city as unknown as FeatureCollection).features.filter((f) => ["trunk", "primary"].includes((f.properties as { kind: string }).kind)).map((f) => path(f) ?? "").join(" ");
const TARGETS = ["CST", "Leopold Café", "Taj", "Oberoi-Trident", "Nariman House"].map((n) => proj(PLACES[n].lonLat) as [number, number]);

/** B — "The Voice": five target pins wired to a phone line from off-screen Karachi. */
export const Thumb02B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04070c", overflow: "hidden" }}>
    <svg width={1280} height={720} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="glow"><stop offset="0" stopColor={RED} stopOpacity={0.9} /><stop offset="1" stopColor={RED} stopOpacity={0} /></radialGradient>
      </defs>
      {LAND.map((d, i) => <path key={i} d={d} fill="#18202e" stroke="#34405a" strokeWidth={2} />)}
      <path d={ROADS} fill="none" stroke="#26314a" strokeWidth={1.5} />
      {/* phone line from Karachi (off-screen left) fanning to every target */}
      {TARGETS.map(([x, y], i) => (
        <path key={i} d={`M -20 ${260 + i * 18} C 300 ${200 + i * 30}, ${x - 200} ${y - 120}, ${x} ${y}`} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="10 7" opacity={0.85} />
      ))}
      {TARGETS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={46} fill="url(#glow)" />
          <circle cx={x} cy={y} r={22} fill="none" stroke="#fff" strokeWidth={3} />
          <circle cx={x} cy={y} r={11} fill={RED} />
        </g>
      ))}
    </svg>
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(4,7,12,0.96) 0%, rgba(4,7,12,0.85) 38%, rgba(4,7,12,0) 62%)" }} />
    <div style={{ position: "absolute", left: 50, top: 250, fontFamily: body, fontWeight: 900, fontSize: 28, letterSpacing: 5, color: RED }}>◀ KARACHI · 600 KM</div>
    <div style={{ position: "absolute", left: 46, top: 290 }}>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 176, lineHeight: 0.9, color: "#fff", textShadow: "0 6px 24px #000" }}>60</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 120, lineHeight: 0.95, color: RED, textShadow: "0 6px 24px #000" }}>HOURS</div>
    </div>
    <div style={{ position: "absolute", left: 50, top: 80, display: "inline-block", background: YELLOW, color: "#000", fontFamily: body, fontWeight: 900, fontSize: 40, padding: "6px 16px" }}>
      CONTROLLED BY PHONE
    </div>
    <Brand x={50} y={636} />
    <Credit text="Map data © OpenStreetMap contributors" />
  </AbsoluteFill>
);
