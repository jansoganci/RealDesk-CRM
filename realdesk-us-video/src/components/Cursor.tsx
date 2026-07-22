import React from "react";
import { useCurrentFrame, Easing, interpolate } from "remotion";
import { B } from "./brand";

export type CursorWaypoint = {
  x: number;   // pixels from left edge of 1920×1080 frame
  y: number;   // pixels from top edge
  frame: number;
};

export type CursorClick = {
  frame: number; // frame at which the click ripple fires
};

const RIPPLE_FRAMES = 22;
const FADE_DURATION = 15;

// Per-segment ease-out so each movement has its own ease-out feel
function easeSegment(
  frame: number,
  waypoints: CursorWaypoint[],
  getValue: (w: CursorWaypoint) => number,
): number {
  if (waypoints.length === 0) return 0;
  if (frame <= waypoints[0].frame) return getValue(waypoints[0]);
  if (frame >= waypoints[waypoints.length - 1].frame)
    return getValue(waypoints[waypoints.length - 1]);

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const duration = b.frame - a.frame;
      if (duration === 0) return getValue(b);
      const t = (frame - a.frame) / duration;
      const eased = Easing.bezier(0.16, 1, 0.3, 1)(t);
      return getValue(a) + eased * (getValue(b) - getValue(a));
    }
  }
  return getValue(waypoints[waypoints.length - 1]);
}

export const Cursor: React.FC<{
  waypoints: CursorWaypoint[];
  clicks?: CursorClick[];
  fadeOutAtFrame?: number; // cursor fades out over 15 frames starting here
}> = ({ waypoints, clicks = [], fadeOutAtFrame }) => {
  const frame = useCurrentFrame();

  if (waypoints.length === 0) return null;

  const x = easeSegment(frame, waypoints, (w) => w.x);
  const y = easeSegment(frame, waypoints, (w) => w.y);

  const globalOpacity =
    fadeOutAtFrame != null
      ? interpolate(frame, [fadeOutAtFrame, fadeOutAtFrame + FADE_DURATION], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
        opacity: globalOpacity,
      }}
    >
      {/* Click ripples */}
      {clicks.map((click, i) => {
        const elapsed = frame - click.frame;
        if (elapsed < 0 || elapsed > RIPPLE_FRAMES) return null;

        const cx = easeSegment(click.frame, waypoints, (w) => w.x);
        const cy = easeSegment(click.frame, waypoints, (w) => w.y);

        const progress = elapsed / RIPPLE_FRAMES;
        const scale = 0.2 + progress * 2.3;
        const opacity = 0.55 * (1 - progress);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - 18,
              top: cy - 18,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `2.5px solid ${B.primary}`,
              opacity,
              transform: `scale(${scale})`,
              transformOrigin: "center",
            }}
          />
        );
      })}

      {/* Cursor arrow */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 28,
          height: 28,
          filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.35))",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 2L3 21L8.5 15.5L12.5 23.5L15 22.5L11 14.5L19.5 14.5L3 2Z"
            fill="white"
            stroke="#1e293b"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
