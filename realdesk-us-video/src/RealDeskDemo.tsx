import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SceneIntro }      from "./scenes/SceneIntro";
import { SceneProperties } from "./scenes/SceneProperties";
import { SceneLeads }      from "./scenes/SceneLeads";
import { SceneDeals }      from "./scenes/SceneDeals";
import { SceneCommission } from "./scenes/SceneCommission";
import { SceneOutro }      from "./scenes/SceneOutro";

// Scene durations in frames (30fps)
// Transitions = 15 frames each × 5 = 75 frames shaved off total
// Raw sum: 330+315+270+330+240+150 = 1635  →  1635 - 75 = 1560 frames = 52s
const TRANSITION = linearTiming({ durationInFrames: 15 });

export const RealDeskDemo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={330}>
      <SceneIntro />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={315}>
      <SceneProperties />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={270}>
      <SceneLeads />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={330}>
      <SceneDeals />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={240}>
      <SceneCommission />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={150}>
      <SceneOutro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
