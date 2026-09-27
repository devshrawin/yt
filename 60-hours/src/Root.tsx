import "./index.css";
import { CalculateMetadataFunction, Composition } from "remotion";
import { buildTimeline, config } from "./data";
import { Documentary } from "./Documentary";
import { Teaser, teaserFrames } from "./Teaser";
import { Avatar, Banner, Thumbnail, Watermark } from "./brand/Brand";

const calculateMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = () => ({
  durationInFrames: buildTimeline().reduce((n, b) => n + b.frames, 0),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Documentary"
      component={Documentary}
      durationInFrames={config.fps * 60}
      fps={config.fps}
      width={config.width}
      height={config.height}
      defaultProps={{}}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="Teaser"
      component={Teaser}
      durationInFrames={teaserFrames()}
      fps={config.fps}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
    <Composition
      id="Banner"
      component={Banner}
      durationInFrames={1}
      fps={config.fps}
      width={2560}
      height={1440}
    />
    <Composition
      id="Avatar"
      component={Avatar}
      durationInFrames={1}
      fps={config.fps}
      width={800}
      height={800}
    />
    <Composition
      id="Watermark"
      component={Watermark}
      durationInFrames={1}
      fps={config.fps}
      width={150}
      height={150}
    />
    <Composition
      id="Thumbnail"
      component={Thumbnail}
      durationInFrames={1}
      fps={config.fps}
      width={1280}
      height={720}
    />
  </>
);
