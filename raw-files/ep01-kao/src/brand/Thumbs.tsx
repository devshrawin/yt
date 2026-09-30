// RAW Files Ep 1 thumbnails (1280x720). Two variants for YouTube's thumbnail A/B test.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { body, display } from "../theme";
import { Monogram } from "./Brand";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>RAW FILES · EPISODE 01</div>
  </div>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);

/** A — "The man nobody photographed": silhouette dossier + Indira Gandhi. */
export const Thumb01A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#06080c", overflow: "hidden" }}>
    <Img src={staticFile("photos/indira.jpg")} style={{ position: "absolute", right: -40, top: -30, width: 520, height: 780, objectFit: "cover", filter: "grayscale(1) contrast(1.2) brightness(0.55)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #06080c 45%, rgba(6,8,12,0.6) 70%, rgba(6,8,12,0.2) 100%)" }} />
    <div style={{ position: "absolute", left: 610, top: 90, width: 330, height: 420, border: "4px solid #e8e8e8", overflow: "hidden", boxShadow: "0 20px 60px #000", transform: "rotate(3deg)" }}>
      <Img src={staticFile("silhouette.svg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ position: "absolute", left: 640, top: 470, transform: "rotate(-5deg)", border: `5px solid ${RED}`, color: RED, fontFamily: display, fontWeight: 700, fontSize: 40, padding: "0 12px", background: "rgba(0,0,0,0.7)", letterSpacing: 3 }}>
      NO PHOTO EXISTS
    </div>
    <div style={{ position: "absolute", left: 44, top: 70 }}>
      <div style={{ display: "inline-block", background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 36, padding: "2px 14px", letterSpacing: 3 }}>FOUNDER OF RAW</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 124, lineHeight: 0.95, color: "#fff", marginTop: 16, textShadow: "0 6px 24px #000" }}>
        THE<br /><span style={{ color: YELLOW }}>SPY-</span><br /><span style={{ color: YELLOW }}>MASTER</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 560, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>R.N. KAO · 1918–2002</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Warren K. Leffler, U.S. News & World Report (public domain)" />
  </AbsoluteFill>
);

/** B — "The plane meant for Zhou": Air India Constellation + 1955. */
export const Thumb01B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04070c", overflow: "hidden" }}>
    <Img src={staticFile("photos/constellation.jpg")} style={{ position: "absolute", left: 280, top: 40, width: 1040, height: 680, objectFit: "cover", filter: "sepia(0.4) contrast(1.15) brightness(0.6)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #04070c 30%, rgba(4,7,12,0.7) 52%, rgba(4,7,12,0.1) 85%)" }} />
    <div style={{ position: "absolute", left: 44, top: 70 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: YELLOW }}>11 APRIL 1955 · SOUTH CHINA SEA</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 100, lineHeight: 1.0, color: "#fff", marginTop: 12, textShadow: "0 6px 24px #000" }}>
        THE BOMB<br />MEANT FOR<br /><span style={{ color: RED }}>ZHOU ENLAI</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 560, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>AND THE INDIAN WHO SOLVED IT</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: RuthAS / Wikimedia Commons, CC BY 3.0 (same aircraft type)" />
  </AbsoluteFill>
);
