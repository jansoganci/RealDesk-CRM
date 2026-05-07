import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../components/brand";
import { MockBrowser } from "../components/MockBrowser";
import { Pill, SectionLabel } from "../components/Callout";

const LEADS = [
  { name: "Marcus & Priya Chen", src: "Zillow",     budget: "$450K–$550K", need: "3bd Austin",       stage: "Active",  stageColor: B.secondary, avatar: "MC", avatarBg: B.primaryBg,    avatarColor: B.primary },
  { name: "Tom Reeves",          src: "Referral",   budget: "$350K–$420K", need: "Good school dist.", stage: "Showing", stageColor: B.purple,    avatar: "TR", avatarBg: B.purpleBg,    avatarColor: B.purple },
  { name: "Sarah Okafor",        src: "Open House", budget: "$600K+",      need: "4bd lake view",     stage: "Offer",   stageColor: B.warning,   avatar: "SO", avatarBg: B.warningBg,   avatarColor: B.warning },
];

const MATCH_REASONS = ["Lake view ✓", "4 bedrooms ✓", "Within budget ✓"];

const LeadRow: React.FC<{ lead: typeof LEADS[0]; delay: number; highlight: boolean }> = ({ lead, delay, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const prog = spring({ fps, frame: frame - delay, config: { damping: 16, stiffness: 110 } });

  return (
    <div style={{ background: highlight ? B.primaryBg : B.cardBg, border: `${highlight ? 2 : 1}px solid ${highlight ? B.primary : B.border}`, borderRadius: 10, padding: "11px 13px", opacity: prog, transform: `translateX(${interpolate(prog, [0, 1], [-18, 0])}px)`, boxShadow: highlight ? `0 4px 20px ${B.primary}18` : "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: lead.avatarBg, color: lead.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: B.font, flexShrink: 0 }}>{lead.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.textPrimary, fontFamily: B.font }}>{lead.name}</div>
          <div style={{ fontSize: 10, color: B.textMuted, fontFamily: B.font }}>via {lead.src}</div>
        </div>
        <div style={{ background: lead.stageColor + "18", color: lead.stageColor, borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 700, fontFamily: B.font }}>{lead.stage}</div>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        {[`💰 ${lead.budget}`, `🏠 ${lead.need}`].map((t) => (
          <span key={t} style={{ background: "#f1f5f9", borderRadius: 5, padding: "2px 7px", fontSize: 9, color: B.textSecondary, fontFamily: B.font }}>{t}</span>
        ))}
      </div>
    </div>
  );
};

export const SceneLeads: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const matchDelay = 60;
  const matchProg = spring({ fps, frame: frame - matchDelay, config: { damping: 14, stiffness: 90 } });
  const arrowOpacity = interpolate(frame, [matchDelay - 10, matchDelay + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const matchPct = Math.round(interpolate(frame, [matchDelay + 5, matchDelay + 28], [0, 98], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0f7ff 100%)", display: "flex", flexDirection: "row", padding: "52px 60px", gap: 40 }}>
      {/* Left */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
        <SectionLabel title={"Leads matched\nto your listings."} subtitle="Every new inquiry is auto-scored against your active properties." delay={0} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <Pill text="Track source: Zillow, Referral, Open House" delay={18} color={B.primary} />
          <Pill text="Budget + criteria auto-scored"               delay={30} color={B.purple} />
          <Pill text="One click → schedule showing"               delay={42} color={B.secondary} />
        </div>
      </div>

      {/* Lead list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Active Inquiries</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LEADS.map((l, i) => <LeadRow key={l.name} lead={l} delay={8 + i * 12} highlight={i === 2} />)}
        </div>
      </div>

      {/* Arrow */}
      <div style={{ display: "flex", alignItems: "center", opacity: arrowOpacity, fontSize: 26, color: B.primary }}>→</div>

      {/* Match card */}
      <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", opacity: matchProg, transform: `translateX(${interpolate(matchProg, [0, 1], [28, 0])}px)` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: B.textMuted, fontFamily: B.font, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Best Match</div>
        <div style={{ background: B.cardBg, border: `2px solid ${B.secondary}`, borderRadius: 12, padding: 18, boxShadow: `0 8px 32px ${B.secondary}22` }}>
          <div style={{ width: "100%", height: 72, background: `linear-gradient(135deg, ${B.secondaryBg}, ${B.secondary}22)`, borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏡</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: B.textPrimary, fontFamily: B.font, marginBottom: 2 }}>2201 Lake View Dr</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: B.primary, fontFamily: B.font, marginBottom: 12 }}>$620,000</div>
          <div style={{ background: B.secondaryBg, borderRadius: 8, padding: "8px 12px", marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: B.secondary, fontFamily: B.font, lineHeight: 1 }}>{matchPct}%</div>
            <div style={{ fontSize: 10, color: "#065f46", fontFamily: B.font, fontWeight: 600 }}>Match Score</div>
          </div>
          {MATCH_REASONS.map((r) => (
            <div key={r} style={{ fontSize: 11, color: B.secondary, fontFamily: B.font, fontWeight: 600, marginBottom: 3 }}>{r}</div>
          ))}
          <div style={{ background: B.primary, color: "#fff", borderRadius: 7, padding: "8px", textAlign: "center", fontSize: 11, fontWeight: 700, fontFamily: B.font, marginTop: 12 }}>Schedule Showing →</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
