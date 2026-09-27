import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { body, C, display } from "../theme";

export type HeadlineCardProps = {
  kicker: string;
  headline: string;
  subline: string;
  chips?: string[];
  durationInFrames: number;
  /** seed for background variation between beats */
  seed?: number;
};

/** Text-forward beat card: big title + supporting line over a slow Ken-Burns gradient. */
export const HeadlineCard: React.FC<HeadlineCardProps> = ({
  kicker,
  headline,
  subline,
  chips = [],
  durationInFrames,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.07]);
  const drift = interpolate(
    frame,
    [0, durationInFrames],
    [0, seed % 2 ? -30 : 30],
  );
  const inT = (d: number) =>
    interpolate(frame, [d, d + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const out = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const quoteMode = !headline;
  const hue = [212, 222, 200, 230][seed % 4];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${zoom}) translateX(${drift}px)` }}
      >
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at ${30 + ((seed * 17) % 40)}% 35%, hsl(${hue} 35% 16%) 0%, ${C.bg} 65%),
                       linear-gradient(160deg, hsl(${hue} 30% 9%) 0%, #050608 100%)`,
          }}
        />
        {/* fine diagonal hatch for texture */}
        <AbsoluteFill
          style={{
            opacity: 0.07,
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -40,
            bottom: -120,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 620,
            color: "#fff",
            opacity: 0.025,
            lineHeight: 1,
          }}
        >
          {String(seed + 1).padStart(2, "0")}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ padding: "0 180px", justifyContent: "center", opacity: out }}
      >
        <div
          style={{
            fontFamily: body,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 6,
            color: C.accent,
            textTransform: "uppercase",
            opacity: inT(0),
            marginBottom: 26,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            width: interpolate(inT(4), [0, 1], [0, 140]),
            height: 4,
            background: C.red,
            marginBottom: 36,
          }}
        />
        {quoteMode ? (
          <div
            style={{
              fontFamily: body,
              fontWeight: 500,
              fontSize: 64,
              lineHeight: 1.25,
              color: C.ink,
              maxWidth: 1450,
              opacity: inT(8),
              transform: `translateY(${(1 - inT(8)) * 20}px)`,
            }}
          >
            {subline}
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: 132,
                lineHeight: 1.02,
                color: C.ink,
                textTransform: "uppercase",
                letterSpacing: 2,
                opacity: inT(8),
                transform: `translateY(${(1 - inT(8)) * 24}px)`,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                fontFamily: body,
                fontSize: 40,
                lineHeight: 1.4,
                color: C.dim,
                marginTop: 30,
                maxWidth: 1350,
                opacity: inT(18),
              }}
            >
              {subline}
            </div>
          </>
        )}
        {chips.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 40,
              flexWrap: "wrap",
            }}
          >
            {chips.map((c, i) => (
              <div
                key={c}
                style={{
                  fontFamily: body,
                  fontWeight: 600,
                  fontSize: 28,
                  color: C.ink,
                  padding: "10px 22px",
                  border: `1.5px solid ${C.faint}`,
                  background: "rgba(255,255,255,0.03)",
                  opacity: inT(26 + i * 8),
                }}
              >
                {c}
              </div>
            ))}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
