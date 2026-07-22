import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../components/brand";
import { MockBrowser } from "../components/MockBrowser";
import { Pill, SectionLabel } from "../components/Callout";
import { Cursor } from "../components/Cursor";

const MILESTONES = [
  { label: "Mutual Acceptance",     date: "Apr 2",    done: true,  active: false },
  { label: "Inspection Period",     date: "Apr 5–12", done: true,  active: false },
  { label: "Financing Contingency", date: "Apr 18",   done: true,  active: false },
  { label: "Title & Escrow",        date: "Apr 22",   done: false, active: true  },
  { label: "Final Walk-Through",    date: "Apr 28",   done: false, active: false },
  { label: "Closing Day 🎉",        date: "Apr 30",   done: false, active: false },
];

const PARTIES = [
  { role: "Buyer",    name: "Sarah Okafor",        icon: "👤" },
  { role: "Lender",   name: "Chase Home Lending",  icon: "🏦" },
  { role: "Title Co.","name": "Austin Title Group", icon: "📋" },
];

export const SceneDeals: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProg = spring({ fps, frame: frame - 5, config: { damping: 16, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f8fafc 100%)", display: "flex", flexDirection: "row", padding: "52px 60px", gap: 44 }}>
      {/* Left */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <SectionLabel title={"Never miss a\ndeadline."} subtitle="Transaction timelines auto-generate the moment an offer is accepted." delay={0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <Pill text="Milestones auto-set from closing date" delay={18} color={B.purple} />
          <Pill text="All parties in one place"              delay={30} color={B.primary} />
          <Pill text="Doc uploads per milestone"             delay={42} color={B.secondary} />
        </div>
      </div>

      {/* Browser */}
      <div style={{ flex: 1 }}>
        <MockBrowser active="Deals">
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>

            {/* Deal header */}
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 11, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-12, 0])}px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: B.textPrimary, fontFamily: B.font }}>2201 Lake View Dr — Purchase</div>
                <div style={{ fontSize: 11, color: B.textMuted, fontFamily: B.font, marginTop: 2 }}>Closing: Apr 30 · Offer: $620,000</div>
              </div>
              <div style={{ background: B.purpleBg, color: B.purple, borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: B.font }}>Under Contract</div>
            </div>

            <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
              {/* Milestones */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Transaction Timeline</div>
                {MILESTONES.map((m, i) => {
                  const prog = spring({ fps, frame: frame - (12 + i * 8), config: { damping: 16, stiffness: 120 } });
                  return (
                    <div key={m.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, opacity: prog, transform: `translateX(${interpolate(prog, [0, 1], [-14, 0])}px)` }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.done ? B.secondary : m.active ? B.primary : B.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: m.done || m.active ? "#fff" : B.textMuted, fontWeight: 700, fontFamily: B.font, boxShadow: m.active ? `0 0 0 3px ${B.primary}33` : "none" }}>
                          {m.done ? "✓" : i + 1}
                        </div>
                        {i < MILESTONES.length - 1 && <div style={{ width: 2, height: 14, background: m.done ? B.secondary : B.border, marginTop: 2 }} />}
                      </div>
                      <div style={{ flex: 1, paddingTop: 3 }}>
                        <div style={{ fontSize: 12, fontWeight: m.active ? 700 : 600, color: m.done ? B.textMuted : m.active ? B.textPrimary : "#9ca3af", fontFamily: B.font, textDecoration: m.done ? "line-through" : "none" }}>{m.label}</div>
                      </div>
                      <div style={{ fontSize: 10, color: m.active ? B.primary : B.textMuted, fontFamily: B.font, fontWeight: m.active ? 700 : 400, paddingTop: 4, flexShrink: 0 }}>{m.date}</div>
                    </div>
                  );
                })}
              </div>

              {/* Parties */}
              <div style={{ width: 170, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Deal Parties</div>
                {PARTIES.map((p, i) => {
                  const prog = spring({ fps, frame: frame - (30 + i * 9), config: { damping: 16, stiffness: 110 } });
                  return (
                    <div key={p.role} style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 9, padding: "9px 11px", marginBottom: 8, opacity: prog, transform: `translateX(${interpolate(prog, [0, 1], [14, 0])}px)` }}>
                      <div style={{ fontSize: 9, color: B.textMuted, fontFamily: B.font, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{p.icon} {p.role}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: B.textPrimary, fontFamily: B.font }}>{p.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </MockBrowser>
      </div>

      {/*
        Cursor journey (1920×1080):
        - Enters from right edge
        - Clicks "Deals" sidebar nav
        - Scans down the milestone timeline (3 active items)
        - Moves to Deal Parties on the right
      */}
      <Cursor
        fadeOutAtFrame={310}
        waypoints={[
          { x: 1900, y: 540, frame: 0   },  // off-screen right
          { x: 520,  y: 350, frame: 25  },  // "Deals" sidebar nav item
          { x: 520,  y: 350, frame: 45  },  // pause on nav
          { x: 750,  y: 362, frame: 65  },  // Title & Escrow (active milestone)
          { x: 750,  y: 362, frame: 90  },  // hover
          { x: 750,  y: 410, frame: 110 },  // Final Walk-Through
          { x: 750,  y: 458, frame: 130 },  // Closing Day 🎉
          { x: 750,  y: 458, frame: 155 },  // pause
          { x: 1757, y: 232, frame: 185 },  // Buyer (Sarah Okafor) party card
          { x: 1757, y: 295, frame: 210 },  // Lender card
          { x: 1757, y: 295, frame: 330 },  // rest until fade-out
        ]}
        clicks={[
          { frame: 45  },  // click Deals nav
          { frame: 90  },  // click active milestone
        ]}
      />
    </AbsoluteFill>
  );
};
