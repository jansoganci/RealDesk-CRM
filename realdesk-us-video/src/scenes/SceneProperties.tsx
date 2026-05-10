import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../components/brand";
import { MockBrowser } from "../components/MockBrowser";
import { Pill, SectionLabel } from "../components/Callout";
import { Cursor } from "../components/Cursor";

const PROPS = [
  { address: "1842 Maple Ave", city: "Austin, TX 78701", type: "For Sale", typeBg: B.primaryBg, typeColor: B.primary, price: "$485,000", beds: 3, baths: 2, sqft: "1,820", status: "Available", statusColor: B.secondary, mls: "MLS #7823401", emoji: "🏡" },
  { address: "504 Oak St #3B",  city: "Austin, TX 78704", type: "Rental",   typeBg: B.secondaryBg, typeColor: B.secondary, price: "$2,400/mo", beds: 2, baths: 1, sqft: "980", status: "Occupied", statusColor: B.primary, mls: "", emoji: "🏢" },
  { address: "2201 Lake View Dr", city: "Round Rock, TX 78664", type: "For Sale", typeBg: B.primaryBg, typeColor: B.primary, price: "$620,000", beds: 4, baths: 3, sqft: "2,450", status: "Under Offer", statusColor: B.purple, mls: "MLS #7901234", emoji: "🏘️" },
  { address: "88 Congress Ave #12A", city: "Austin, TX 78701", type: "Rental", typeBg: B.secondaryBg, typeColor: B.secondary, price: "$1,850/mo", beds: 1, baths: 1, sqft: "650", status: "Empty", statusColor: B.warning, mls: "", emoji: "🏠" },
];

const PropCard: React.FC<{ p: typeof PROPS[0]; delay: number }> = ({ p, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({ fps, frame: frame - delay, config: { damping: 16, stiffness: 110 } });

  return (
    <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 12, padding: 14, opacity: prog, transform: `translateY(${interpolate(prog, [0, 1], [18, 0])}px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ width: "100%", height: 88, background: `linear-gradient(135deg, ${p.typeBg}, ${p.typeColor}22)`, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{p.emoji}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.textPrimary, fontFamily: B.font }}>{p.address}</div>
          <div style={{ fontSize: 10, color: B.textMuted, fontFamily: B.font, marginTop: 1 }}>{p.city}</div>
        </div>
        <div style={{ background: p.typeBg, color: p.typeColor, borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 700, fontFamily: B.font }}>{p.type}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: B.textPrimary, fontFamily: B.font, marginBottom: 6 }}>{p.price}</div>
      <div style={{ display: "flex", gap: 8, fontSize: 10, color: B.textMuted, fontFamily: B.font, marginBottom: 8 }}>
        <span>🛏 {p.beds}bd</span><span>🛁 {p.baths}ba</span><span>📐 {p.sqft} sqft</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ background: p.statusColor + "18", color: p.statusColor, borderRadius: 100, padding: "2px 9px", fontSize: 9, fontWeight: 700, fontFamily: B.font }}>{p.status}</div>
        {p.mls && <span style={{ fontSize: 9, color: B.textMuted, fontFamily: B.font }}>{p.mls}</span>}
      </div>
    </div>
  );
};

export const SceneProperties: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProg = spring({ fps, frame: frame - 5, config: { damping: 16, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #f0f7ff 0%, #f8fafc 100%)", display: "flex", flexDirection: "row", padding: "52px 60px", gap: 44 }}>
      {/* Left panel */}
      <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <SectionLabel title={"All your listings.\nOne clean view."} subtitle="Rentals and sales, side by side — with status at a glance." delay={0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <Pill text="Rental & sale properties"           delay={20} color={B.primary} />
          <Pill text="MLS ID + US address fields"         delay={32} color={B.secondary} />
          <Pill text="Live status: Available, Under Offer, Sold" delay={44} color={B.purple} />
        </div>
      </div>

      {/* Browser */}
      <div style={{ flex: 1 }}>
        <MockBrowser active="Properties">
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-12, 0])}px)` }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: B.textPrimary, fontFamily: B.font }}>Properties</div>
                <div style={{ fontSize: 12, color: B.textMuted, fontFamily: B.font }}>4 active listings</div>
              </div>
              <div style={{ background: B.primary, color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, fontFamily: B.font }}>+ Add Property</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {PROPS.map((p, i) => <PropCard key={p.address} p={p} delay={12 + i * 9} />)}
            </div>
          </div>
        </MockBrowser>
      </div>

      {/*
        Cursor journey (coordinates are in the full 1920×1080 frame):
        - Starts off-screen bottom-right, enters around frame 30
        - Moves to sidebar "Properties" nav item (~548, 310)
        - Slides to first property card (~850, 480)
        - Clicks, then drifts to second card (~1100, 480)
        - Rests there for the remainder of the scene
      */}
      <Cursor
        fadeOutAtFrame={295}
        waypoints={[
          { x: 1700, y: 900, frame: 0   },  // off-screen start (enters from bottom-right)
          { x: 548,  y: 310, frame: 60  },  // sidebar "Properties" nav item
          { x: 548,  y: 310, frame: 90  },  // pause on nav
          { x: 855,  y: 475, frame: 135 },  // first property card
          { x: 855,  y: 475, frame: 165 },  // pause before click
          { x: 855,  y: 475, frame: 185 },  // hold after click
          { x: 1110, y: 475, frame: 240 },  // drift to second card
          { x: 1110, y: 475, frame: 315 },  // rest until fade-out
        ]}
        clicks={[
          { frame: 165 },  // click first property card
        ]}
      />
    </AbsoluteFill>
  );
};
