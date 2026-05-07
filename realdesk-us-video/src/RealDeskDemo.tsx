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
// Raw sum: 165+510+420+570+465+405 = 2535  →  2535 - 75 = 2460 frames ≈ 82s
const TRANSITION = linearTiming({ durationInFrames: 15 });

export const RealDeskDemo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={165}>
      <SceneIntro />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={510}>
      <SceneProperties />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={420}>
      <SceneLeads />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={570}>
      <SceneDeals />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={465}>
      <SceneCommission />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition presentation={fade()} timing={TRANSITION} />

    <TransitionSeries.Sequence durationInFrames={405}>
      <SceneOutro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
