import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { buildTimeline, config } from "./data";
import { EndCard, TitleCard } from "./components/Cards";
import { SegmentScene } from "./components/SegmentScene";

export const Documentary: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const timeline = React.useMemo(() => buildTimeline(), []);

  // frame ranges of title/end cards, where music rises (no narration there)
  const loud: [number, number][] = [];
  let t = 0;
  for (const b of timeline) {
    if (b.kind !== "segment") loud.push([t, t + b.frames]);
    t += b.frames;
  }
  const musicVolume = (f: number) => {
    const bed = config.music_volume;
    const swell = Math.max(
      0,
      ...loud.map(([a, b]) =>
        interpolate(
          f,
          [a - fps, a + fps / 2, b - fps / 2, b + fps],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      ),
    );
    const master = interpolate(
      f,
      [0, fps, durationInFrames - fps * 2, durationInFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return (bed + (0.32 - bed) * swell) * master;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Series>
        {timeline.map((b, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={b.frames}
            name={
              b.kind === "segment"
                ? `${b.segment.id} ${b.segment.label}`
                : b.kind
            }
          >
            {b.kind === "title" && <TitleCard durationInFrames={b.frames} />}
            {b.kind === "end" && <EndCard durationInFrames={b.frames} />}
            {b.kind === "segment" && (
              <SegmentScene seg={b.segment} durationInFrames={b.frames} />
            )}
          </Series.Sequence>
        ))}
      </Series>
      <FilmGrain />
      <Audio src={staticFile("music/music.mp3")} loop volume={musicVolume} />
    </AbsoluteFill>
  );
};

/** Subtle animated film grain over everything (tiled noise, jittered each frame). */
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("fx/grain.png")})`,
        backgroundPosition: `${x}px ${y}px`,
        opacity: 0.055,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};
