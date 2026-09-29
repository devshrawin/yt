import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PHASES } from "../data";
import { body, C, display } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Slide-in lower third. Text parts separated by " — " render as label + detail chips. */
export const LowerThird: React.FC<{
  text: string;
  durationInFrames: number;
  top?: boolean;
}> = ({ text, durationInFrames, top = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 18 } });
  const out = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    clamp,
  );
  const [head, ...rest] = text.split(/\s+—\s+/);
  return (
    <div
      style={{
        position: "absolute",
        ...(top ? { left: 90, top: 70 } : { left: 90, bottom: 200 }),
        display: "flex",
        alignItems: "stretch",
        opacity: out,
        transform: `translateX(${(1 - inS) * -80}px)`,
        clipPath: `inset(0 ${(1 - inS) * 100}% 0 0)`,
      }}
    >
      <div style={{ width: 8, background: C.accent }} />
      <div style={{ background: C.panel, padding: "18px 30px" }}>
        <div
          style={{
            fontFamily: display,
            fontWeight: 600,
            fontSize: 46,
            color: C.ink,
            letterSpacing: 1,
          }}
        >
          {head}
        </div>
        {rest.length > 0 && (
          <div
            style={{
              fontFamily: body,
              fontSize: 25,
              color: C.dim,
              marginTop: 4,
            }}
          >
            {rest.join("  ·  ")}
          </div>
        )}
      </div>
    </div>
  );
};

/** Corner citation card. */
export const CitationCard: React.FC<{
  sources: string[];
  durationInFrames: number;
}> = ({ sources, durationInFrames }) => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 70,
        maxWidth: 640,
        padding: "20px 26px",
        background: C.panel,
        borderTop: `3px solid ${C.dim}`,
        opacity: o,
        transform: `translateY(${(1 - o) * -12}px)`,
        fontFamily: body,
      }}
    >
      <div
        style={{
          fontSize: 17,
          letterSpacing: 4,
          color: C.accent,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        SOURCES
      </div>
      {sources.map((s) => (
        <div
          key={s}
          style={{
            fontSize: 22,
            lineHeight: 1.4,
            color: C.ink,
            marginBottom: 4,
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
};

/** "Allegation" stamp for contested claims. */
export const DisputedStamp: React.FC<{ line1: string; line2: string }> = ({
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 180 } });
  return (
    <div
      style={{
        position: "absolute",
        right: 150,
        top: 150,
        transform: `rotate(-8deg) scale(${interpolate(s, [0, 1], [1.8, 1])})`,
        opacity: interpolate(s, [0, 0.3], [0, 0.92], clamp),
        border: `6px solid ${C.red}`,
        padding: "14px 30px",
        color: C.red,
        textAlign: "center",
        fontFamily: display,
        mixBlendMode: "screen",
      }}
    >
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: 10,
          lineHeight: 1,
        }}
      >
        {line1}
      </div>
      <div
        style={{
          fontSize: 24,
          letterSpacing: 4,
          marginTop: 6,
          fontFamily: body,
          fontWeight: 700,
        }}
      >
        {line2}
      </div>
    </div>
  );
};

/** Chapter tag shown top-left at the start of each segment. */
export const ChapterTag: React.FC<{ label: string; title: string }> = ({
  label,
  title,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [6, 20, 150, 170], [0, 1, 1, 0.0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 70,
        opacity: o,
        fontFamily: body,
      }}
    >
      <div
        style={{
          fontSize: 20,
          letterSpacing: 6,
          color: C.accent,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      {label !== title && (
        <div
          style={{
            fontFamily: display,
            fontSize: 34,
            color: C.ink,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

/** Five-step training pipeline strip; `current` lights up, earlier steps shown as done. */
export const PhaseStrip: React.FC<{ current: number; allLit?: boolean }> = ({
  current,
  allLit = false,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [10, 30], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 60,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        fontFamily: body,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 0,
          background: C.panel,
          padding: "14px 22px",
        }}
      >
        {PHASES.map((p, i) => {
          const state = allLit
            ? "done"
            : i < current
              ? "done"
              : i === current
                ? "now"
                : "later";
          const lit = allLit
            ? interpolate(frame, [20 + i * 18, 34 + i * 18], [0, 1], clamp)
            : 1;
          const color =
            state === "now" ? C.accent : state === "done" ? C.ink : C.faint;
          return (
            <React.Fragment key={p.key}>
              {i > 0 && (
                <div
                  style={{
                    width: 36,
                    alignSelf: "center",
                    height: 2,
                    background: i <= current || allLit ? C.dim : C.faint,
                    opacity: 0.6,
                  }}
                />
              )}
              <div
                style={{
                  textAlign: "center",
                  minWidth: 190,
                  opacity: state === "later" ? 0.55 : lit,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color }}>
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    color: state === "now" ? C.accent : C.dim,
                  }}
                >
                  {p.span} · {p.what}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** Darker color grade for tone shifts. */
export const DarkGrade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)",
      backdropFilter: "saturate(0.6) brightness(0.8)",
    }}
  />
);
