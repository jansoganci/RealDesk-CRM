import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, Sequence } from "remotion";
import { B } from "../components/brand";

const FeaturePill: React.FC<{ icon: string; label: string; delay: number; color: string }> = ({ icon, label, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ fps, frame: frame - delay, config: { damping: 14, stiffness: 100 } });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: B.cardBg,
        border: `1.5px solid ${color}33`,
        borderRadius: 100,
        padding: "11px 20px",
        boxShadow: `0 4px 20px ${color}1a`,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
      }}
    >
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: B.textPrimary, fontFamily: B.font }}>{label}</span>
    </div>
  );
};

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({ fps, frame, config: { damping: 16, stiffness: 90 } });

  const taglineOpacity = interpolate(frame, [22, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const taglineY = interpolate(frame, [22, 40], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const dividerW = interpolate(frame, [38, 58], [0, 480], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });

  const features = [
    { icon: "🏠", label: "Property Management",    delay: 62,  color: B.primary },
    { icon: "🎯", label: "Lead Auto-Matching",      delay: 76,  color: B.secondary },
    { icon: "🤝", label: "Deal Pipeline & Timeline",delay: 90,  color: B.purple },
    { icon: "💰", label: "Commission Calculator",   delay: 104, color: B.warning },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(150deg, #eef6ff 0%, #f8fafc 55%, #f0fdf4 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${B.primary}0d 0%, transparent 70%)`, top: -180, right: -150, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${B.secondary}0d 0%, transparent 70%)`, bottom: -120, left: -100, pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30, opacity: logoProgress, transform: `scale(${interpolate(logoProgress, [0, 1], [0.75, 1])})` }}>
        <div style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 16px 48px ${B.primary}55` }}>
          <span style={{ color: "#fff", fontSize: 40, fontWeight: 900, fontFamily: B.font, lineHeight: 1 }}>R</span>
        </div>
        <div>
          <div style={{ fontSize: 54, fontWeight: 800, color: B.textPrimary, fontFamily: B.font, letterSpacing: "-0.03em", lineHeight: 1 }}>RealDesk</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: B.primary, fontFamily: B.font, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>For US Real Estate Agents</div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: B.textMuted, fontFamily: B.font, lineHeight: 1.45 }}>
          From first showing to closing —{" "}
          <span style={{ color: B.primary, fontWeight: 700 }}>every deal in one place.</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: dividerW, height: 1.5, background: `linear-gradient(90deg, transparent, ${B.primary}44, transparent)`, marginBottom: 36 }} />

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 860 }}>
        {features.map((f) => <FeaturePill key={f.label} {...f} />)}
      </div>
    </AbsoluteFill>
  );
};
