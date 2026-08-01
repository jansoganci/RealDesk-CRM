import { Composition } from "remotion";
import { RealDeskDemo } from "./RealDeskDemo";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── RealDesk Full Demo (44.5s) ── */}
      <Composition
        id="RealDeskDemo"
        component={RealDeskDemo}
        durationInFrames={1560}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* ── RealDesk Intro only (15s proof-of-concept) ── */}

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
    </>
  );
};
