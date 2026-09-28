import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { config, meta, photoCredits, sources } from "../data";
import { body, C, display } from "../theme";
import { Monogram } from "../brand/Brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const TitleCard: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const words = meta.title.split(" ");
  // "INSIDE THE" / "TERROR FACTORY"; short titles ("60 HOURS") stay on one line
  const pre = words.length > 3 ? words.slice(0, 2).join(" ") : "";
  const main = words.length > 3 ? words.slice(2).join(" ") : words.join(" ");
  const o = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const spacing = interpolate(frame, [0, durationInFrames], [34, 18]);
  const line = interpolate(frame, [15, 50], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        opacity: o,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, #1a0f0e 0%, #000 60%)`,
          opacity: 0.9,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {config.series_label && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 46,
              opacity: interpolate(frame, [5, 30], [0, 1], clamp),
            }}
          >
            <div style={{ width: 60, height: 2, background: C.red }} />
            <div
              style={{
                fontFamily: body,
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: 8,
                color: C.accent,
              }}
            >
              {config.series_label}
              {config.file_number ? `  ·  FILE ${config.file_number}` : ""}
            </div>
            <div style={{ width: 60, height: 2, background: C.red }} />
          </div>
        )}
        <div
          style={{
            fontFamily: body,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: 18,
            color: C.dim,
          }}
        >
          {pre}
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 190,
            letterSpacing: spacing,
            color: C.ink,
            lineHeight: 1.05,
            marginTop: 10,
            textShadow: "0 0 60px rgba(214,69,61,0.25)",
          }}
        >
          {main}
        </div>
        <div
          style={{
            width: 900 * line,
            height: 3,
            background: C.red,
            margin: "34px 0 30px",
          }}
        />
        <div
          style={{
            fontFamily: body,
            fontSize: 34,
            color: C.dim,
            opacity: interpolate(frame, [35, 60], [0, 1], clamp),
          }}
        >
          {meta.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [0, 20, durationInFrames - 25, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  const {
    channel_name: name,
    channel_handle: handle,
    end_card_cta: cta,
  } = config;
  const hasChannel = Boolean(name || handle || cta);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#050608",
        opacity: o,
        padding: "90px 110px",
        flexDirection: "row",
        gap: 90,
      }}
    >
      <div style={{ flex: 1.35, fontFamily: body }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            color: C.accent,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          SOURCES
        </div>
        {sources.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              fontSize: 21,
              lineHeight: 1.35,
              color: C.ink,
              marginBottom: 13,
              opacity: interpolate(
                frame,
                [8 + i * 4, 20 + i * 4],
                [0, 1],
                clamp,
              ),
            }}
          >
            <span style={{ color: C.faint, width: 26, flex: "none" }}>
              {i + 1}.
            </span>
            <span>{s}</span>
          </div>
        ))}
        {photoCredits.length > 0 && (
          <div
            style={{
              fontSize: 17,
              letterSpacing: 4,
              color: C.accent,
              fontWeight: 700,
              margin: "26px 0 10px",
            }}
          >
            IMAGE CREDITS
          </div>
        )}
        {photoCredits.map((c) => (
          <div key={c} style={{ fontSize: 17, lineHeight: 1.4, color: C.dim }}>
            {c}
          </div>
        ))}
      </div>
      {hasChannel && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderLeft: `2px solid #1f2632`,
            paddingLeft: 80,
          }}
        >
          <div style={{ marginBottom: 20, marginLeft: -20 }}>
            <Monogram size={150} />
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 80,
              fontWeight: 700,
              color: C.ink,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: body,
              fontSize: 36,
              color: C.accent,
              marginTop: 14,
            }}
          >
            {handle}
          </div>
          <div
            style={{
              width: 120,
              height: 4,
              background: C.red,
              margin: "36px 0",
            }}
          />
          <div
            style={{
              fontFamily: body,
              fontSize: 38,
              lineHeight: 1.35,
              color: C.ink,
            }}
          >
            {cta}
          </div>
          <div
            style={{
              fontFamily: body,
              fontSize: 22,
              color: C.faint,
              marginTop: 40,
            }}
          >
            Full source list and links in the description.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
