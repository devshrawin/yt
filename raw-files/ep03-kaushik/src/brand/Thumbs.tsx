// RAW Files Ep 3 thumbnails (1280x720).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { body, display } from "../theme";
import { Monogram } from "./Brand";

const RED = "#ff2d2d";
const YELLOW = "#ffd23f";

const Brand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12 }}>
    <Monogram size={54} />
    <div style={{ fontFamily: body, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: "#e8e8e8" }}>RAW FILES · EPISODE 03</div>
  </div>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 12, bottom: 8, fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</div>
);

/** A — the silhouette in front of Mianwali: "16 YEARS". */
export const Thumb03A: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#06080c", overflow: "hidden" }}>
    <Img src={staticFile("photos/mianwali.jpg")} style={{ position: "absolute", right: -60, top: -20, width: 700, height: 760, objectFit: "cover", filter: "grayscale(1) contrast(1.25) brightness(0.45)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #06080c 42%, rgba(6,8,12,0.6) 68%, rgba(6,8,12,0.2) 100%)" }} />
    <div style={{ position: "absolute", left: 640, top: 80, width: 330, height: 420, border: "4px solid #e8e8e8", overflow: "hidden", boxShadow: "0 20px 60px #000", transform: "rotate(3deg)" }}>
      <Img src={staticFile("silhouette.svg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ position: "absolute", left: 610, top: 500, transform: "rotate(-5deg)", border: `6px solid ${RED}`, color: RED, fontFamily: display, fontWeight: 700, fontSize: 64, padding: "0 16px", background: "rgba(0,0,0,0.75)", letterSpacing: 4 }}>16 YEARS</div>
    <div style={{ position: "absolute", left: 44, top: 70 }}>
      <div style={{ display: "inline-block", background: RED, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 36, padding: "2px 14px", letterSpacing: 3 }}>INDIA'S SPY IN PAKISTAN</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 124, lineHeight: 0.95, color: "#fff", marginTop: 16, textShadow: "0 6px 24px #000" }}>
        THE BLACK<br /><span style={{ color: YELLOW }}>TIGER</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 470, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>RAVINDRA KAUSHIK</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Fahads1982 / Wikimedia Commons, CC BY-SA 4.0 (Mianwali station)" />
  </AbsoluteFill>
);

/** B — his last letter. */
export const Thumb03B: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#04070c", overflow: "hidden" }}>
    <Img src={staticFile("photos/wagah.jpg")} style={{ position: "absolute", left: 300, top: 40, width: 980, height: 680, objectFit: "cover", filter: "grayscale(0.7) contrast(1.15) brightness(0.45)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, #04070c 34%, rgba(4,7,12,0.75) 56%, rgba(4,7,12,0.15) 90%)" }} />
    <div style={{ position: "absolute", left: 44, top: 60, width: 760 }}>
      <div style={{ fontFamily: body, fontWeight: 800, fontSize: 24, letterSpacing: 5, color: YELLOW }}>THREE DAYS BEFORE HE DIED, HE WROTE HOME:</div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 92, lineHeight: 1.02, color: "#fff", marginTop: 12, textShadow: "0 6px 24px #000" }}>
        “HAD I BEEN AN <span style={{ color: RED }}>AMERICAN</span>…”
      </div>
    </div>
    <div style={{ position: "absolute", left: 44, top: 470, background: "#fff", color: "#000", fontFamily: body, fontWeight: 900, fontSize: 30, padding: "6px 14px" }}>RAVINDRA KAUSHIK · 1952–2001</div>
    <Brand x={44} y={642} />
    <Credit text="Photo: Kamran Ali / Wikimedia Commons, CC BY-SA 3.0 (Wagah border)" />
  </AbsoluteFill>
);
