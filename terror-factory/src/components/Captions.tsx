import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import type { Word } from "../data";
import { body, C } from "../theme";

/** Burned-in captions from edge-tts word timings, current word highlighted. */
export const Captions: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pages = React.useMemo(() => {
    const caps: Caption[] = words.map((w, i) => ({
      // leading space tells createTikTokStyleCaptions where words split
      text: (i === 0 ? "" : " ") + w.text,
      startMs: w.startMs,
      endMs: w.endMs,
      timestampMs: w.startMs,
      confidence: null,
    }));
    return createTikTokStyleCaptions({
      captions: caps,
      combineTokensWithinMilliseconds: 1600,
    }).pages;
  }, [words]);

  const ms = (frame / fps) * 1000;
  const page = pages.find(
    (p) => ms >= p.startMs && ms < p.startMs + p.durationMs + 250,
  );
  if (!page) return null;
  const last = page.tokens[page.tokens.length - 1];
  if (ms > last.toMs + 400) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 70,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "10px 26px",
          background: "rgba(0,0,0,0.62)",
          borderRadius: 6,
          fontFamily: body,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.3,
          textAlign: "center",
          color: C.ink,
        }}
      >
        {page.tokens.map((t, i) => (
          <span
            key={i}
            style={{
              color: ms >= t.fromMs && ms < t.toMs + 80 ? C.accent : C.ink,
              whiteSpace: "pre-wrap",
            }}
          >
            {t.text}
          </span>
        ))}
      </div>
    </div>
  );
};
