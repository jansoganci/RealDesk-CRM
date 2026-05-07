import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { B } from "../components/brand";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProg  = spring({ fps, frame,           config: { damping: 15, stiffness: 90 } });
  const line1Prog = spring({ fps, frame: frame - 18, config: { damping: 15, stiffness: 90 } });
  const line2Prog = spring({ fps, frame: frame - 32, config: { damping: 15, stiffness: 90 } });
  const ctaOpacity = interpolate(frame, [50, 68], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const ctaY       = interpolate(frame, [50, 68], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const badgeOpacity = interpolate(frame, [72, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, #eef6ff 0%, #f8fafc 55%, #f0fdf4 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Blobs */}
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${B.primary}0d 0%, transparent 70%)`, top: -200, right: -200 }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${B.secondary}0d 0%, transparent 70%)`, bottom: -150, left: -100 }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40, opacity: logoProg, transform: `scale(${interpolate(logoProg, [0, 1], [0.8, 1])})` }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 14px 44px ${B.primary}55` }}>
          <span style={{ color: "#fff", fontSize: 36, fontWeight: 900, fontFamily: B.font, lineHeight: 1 }}>R</span>
        </div>
        <span style={{ fontSize: 50, fontWeight: 800, color: B.textPrimary, fontFamily: B.font, letterSpacing: "-0.03em" }}>RealDesk</span>
      </div>

      {/* Headlines */}
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: B.textPrimary, fontFamily: B.font, letterSpacing: "-0.02em", lineHeight: 1.15, opacity: line1Prog, transform: `translateY(${interpolate(line1Prog, [0, 1], [22, 0])}px)` }}>
          Your deals. Your pipeline.{" "}
          <span style={{ color: B.secondary }}>Your commission.</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 400, color: B.textMuted, fontFamily: B.font, marginTop: 14, opacity: line2Prog, transform: `translateY(${interpolate(line2Prog, [0, 1], [18, 0])}px)` }}>
          Built for how agents actually work.
        </div>
      </div>

      {/* CTA button */}
      <div style={{ opacity: ctaOpacity, transform: `translateY(${ctaY}px)`, marginBottom: 32 }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
            color: "#fff",
            borderRadius: 14,
            padding: "18px 44px",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: B.font,
            boxShadow: `0 12px 40px ${B.primary}55`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Start free trial
          <span style={{ fontSize: 20 }}>→</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 14, color: B.textMuted, fontFamily: B.font }}>realdesk.io</div>
      </div>

      {/* Trust badge */}
      <div style={{ opacity: badgeOpacity, display: "flex", alignItems: "center", gap: 8, background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 100, padding: "10px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <span style={{ color: B.secondary, fontSize: 16 }}>●</span>
        <span style={{ fontSize: 13, color: B.textSecondary, fontFamily: B.font, fontWeight: 500 }}>Built for US solo agents & small teams · No credit card required</span>
      </div>
    </AbsoluteFill>
  );
};
