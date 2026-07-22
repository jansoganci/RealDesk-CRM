import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../components/brand";
import { MockBrowser } from "../components/MockBrowser";
import { Pill, SectionLabel } from "../components/Callout";
import { Cursor } from "../components/Cursor";

const fmt = (n: number) => "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const SceneCommission: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numDelay = 22;
  const salePrice = interpolate(frame, [numDelay, numDelay + 40], [0, 620000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const listingSide = salePrice * 0.028;
  const buyerSide   = salePrice * 0.025;
  const total       = listingSide + buyerSide;
  const brokerCut   = total * 0.15;
  const agentNet    = total - brokerCut;

  const barProgress = interpolate(frame, [numDelay + 10, numDelay + 48], [0, 0.53], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const c1 = spring({ fps, frame: frame - 5,  config: { damping: 16, stiffness: 100 } });
  const c2 = spring({ fps, frame: frame - 14, config: { damping: 16, stiffness: 100 } });
  const c3 = spring({ fps, frame: frame - 23, config: { damping: 16, stiffness: 100 } });

  const card = (prog: number) => ({ opacity: prog, transform: `translateY(${interpolate(prog, [0, 1], [-14, 0])}px)` });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)", display: "flex", flexDirection: "row", padding: "52px 60px", gap: 44 }}>
      {/* Left */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <SectionLabel title={"Know exactly\nwhat you'll earn."} subtitle="Dual-side commission tracking before and after close." delay={0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <Pill text="Listing + buyer-side commission"      delay={18} color={B.secondary} />
          <Pill text="Broker split calculator"              delay={30} color={B.primary} />
          <Pill text="Annual pipeline forecast"             delay={42} color={B.purple} />
        </div>
      </div>

      {/* Browser */}
      <div style={{ flex: 1 }}>
        <MockBrowser active="Finance">
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Sale price */}
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 11, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", ...card(c1) }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>2201 Lake View Dr — Sale Price</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: B.textPrimary, fontFamily: B.font, letterSpacing: "-0.02em" }}>{fmt(salePrice)}</div>
            </div>

            {/* Breakdown */}
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 11, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", ...card(c2) }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Commission Breakdown</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Listing Side (2.8%)", value: listingSide, color: B.primary },
                  { label: "Buyer Side (2.5%)",   value: buyerSide,   color: B.secondary },
                  { label: "Total Commission",     value: total,       color: B.purple },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, background: item.color + "0e", border: `1px solid ${item.color}22`, borderRadius: 9, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: item.color, fontFamily: B.font, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: B.textPrimary, fontFamily: B.font }}>{fmt(item.value)}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ background: "#f1f5f9", borderRadius: 100, height: 7, overflow: "hidden", marginBottom: 5 }}>
                <div style={{ height: "100%", width: `${barProgress * 100}%`, background: `linear-gradient(90deg, ${B.primary}, ${B.purple})`, borderRadius: 100 }} />
              </div>
              <div style={{ fontSize: 10, color: B.textMuted, fontFamily: B.font }}>53% to annual goal ($59,000 / $112,000)</div>
            </div>

            {/* Agent net */}
            <div style={{ background: `linear-gradient(135deg, ${B.secondary}, #047857)`, borderRadius: 11, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 8px 28px ${B.secondary}44`, ...card(c3) }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: B.font, fontWeight: 600, marginBottom: 3 }}>Your Net (after 15% broker split)</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", fontFamily: B.font, letterSpacing: "-0.02em" }}>{fmt(agentNet)}</div>
              </div>
              <div style={{ fontSize: 42, opacity: 0.8 }}>💵</div>
            </div>

          </div>
        </MockBrowser>
      </div>

      {/*
        Cursor journey (1920×1080):
        - Enters from bottom
        - Hovers over sale price number (watches it count up)
        - Moves to commission breakdown columns
        - Settles on agent net card
      */}
      <Cursor
        fadeOutAtFrame={220}
        waypoints={[
          { x: 960,  y: 1100, frame: 0   },  // off-screen bottom
          { x: 830,  y: 154,  frame: 18  },  // sale price card — arrives as number counts
          { x: 830,  y: 154,  frame: 55  },  // watch it count
          { x: 830,  y: 287,  frame: 75  },  // listing side commission col
          { x: 1238, y: 287,  frame: 100 },  // total commission col
          { x: 1238, y: 287,  frame: 120 },  // pause
          { x: 960,  y: 409,  frame: 145 },  // agent net card (green)
          { x: 960,  y: 409,  frame: 240 },  // rest until fade-out
        ]}
        clicks={[
          { frame: 55  },  // click sale price
          { frame: 145 },  // click agent net
        ]}
      />
    </AbsoluteFill>
  );
};
