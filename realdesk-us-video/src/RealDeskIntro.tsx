import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";

// ── Brand tokens ────────────────────────────────────────────────
const PRIMARY = "#2563EB";
const PRIMARY_DARK = "#1d4ed8";
const SECONDARY = "#059669";
const BG = "#f8fafc";
const TEXT_HEADING = "#0f172a";
const TEXT_MUTED = "#64748b";
const FONT = 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

// ── Logo mark ───────────────────────────────────────────────────
const LogoMark: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <div
    style={{
      width: size,
      height: size,
      background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
      borderRadius: size * 0.24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 16px 48px ${PRIMARY}55`,
      flexShrink: 0,
    }}
  >
    <span
      style={{
        color: "#fff",
        fontSize: size * 0.48,
        fontWeight: 900,
        fontFamily: FONT,
        lineHeight: 1,
      }}
    >
      R
    </span>
  </div>
);

// ── Feature pill ────────────────────────────────────────────────
const FeaturePill: React.FC<{ icon: string; label: string; delay: number; color: string }> = ({
  icon,
  label,
  delay,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    fps,
    frame: frame - delay,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        border: `1.5px solid ${color}33`,
        borderRadius: 100,
        padding: "12px 22px",
        boxShadow: `0 4px 20px ${color}18`,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [24, 0])}px)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_HEADING }}>
        {label}
      </span>
    </div>
  );
};

// ── Main composition ─────────────────────────────────────────────
export const RealDeskIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade in
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Logo + wordmark spring in
  const logoProgress = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 90, mass: 0.9 },
  });

  // Tagline fades in after logo settles
  const taglineOpacity = interpolate(frame, [22, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const taglineY = interpolate(frame, [22, 40], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Divider line grows
  const dividerWidth = interpolate(frame, [35, 55], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const features = [
    { icon: "🤝", label: "Deal Pipeline & Timeline", delay: 55, color: PRIMARY },
    { icon: "🏠", label: "Property Management", delay: 70, color: SECONDARY },
    { icon: "💰", label: "Commission Calculator", delay: 85, color: "#7c3aed" },
    { icon: "🎯", label: "Lead Auto-Matching", delay: 100, color: "#d97706" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, #eef6ff 0%, ${BG} 50%, #f0fdf4 100%)`,
        opacity: bgOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Soft background circles */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PRIMARY}0d 0%, transparent 70%)`,
          top: -150,
          right: -150,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${SECONDARY}0d 0%, transparent 70%)`,
          bottom: -100,
          left: -100,
          pointerEvents: "none",
        }}
      />

      {/* Logo row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}
      >
        <LogoMark size={80} />
        <div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: TEXT_HEADING,
              fontFamily: FONT,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            RealDesk
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: PRIMARY,
              fontFamily: FONT,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            For US Real Estate Agents
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            color: TEXT_MUTED,
            fontFamily: FONT,
            lineHeight: 1.4,
          }}
        >
          From first showing to closing —{" "}
          <span style={{ color: PRIMARY, fontWeight: 700 }}>
            every deal in one place.
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 500 * dividerWidth,
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${PRIMARY}44, transparent)`,
          marginBottom: 40,
        }}
      />

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "center",
          maxWidth: 900,
        }}
      >
        {features.map((f) => (
          <FeaturePill key={f.label} {...f} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
