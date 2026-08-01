import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { B } from "./brand";

export const Pill: React.FC<{
  text: string;
  delay?: number;
  color?: string;
}> = ({ text, delay = 0, color = B.primary }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ fps, frame: frame - delay, config: { damping: 14, stiffness: 110 } });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: color,
        color: "#fff",
        borderRadius: 100,
        padding: "9px 18px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: B.font,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
        boxShadow: `0 4px 16px ${color}55`,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
      {text}
    </div>
  );
};

export const SectionLabel: React.FC<{
  title: string;
  subtitle?: string;
  delay?: number;
}> = ({ title, subtitle, delay = 0 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const y = interpolate(frame - delay, [0, 16], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          color: B.textPrimary,
          fontFamily: B.font,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 17,
            color: B.textMuted,
            fontFamily: B.font,
            marginTop: 10,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
