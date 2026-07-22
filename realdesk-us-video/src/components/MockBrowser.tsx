import React from "react";
import { B } from "./brand";

const NAV = [
  { key: "Dashboard",  icon: "📊" },
  { key: "Owners",     icon: "👥" },
  { key: "Properties", icon: "🏠" },
  { key: "Tenants",    icon: "👤" },
  { key: "Contracts",  icon: "📄" },
  { key: "Calendar",   icon: "📅" },
  { key: "Leads",      icon: "🎯" },
  { key: "Deals",      icon: "🤝" },
  { key: "Reminders",  icon: "🔔" },
  { key: "Finance",    icon: "💰" },
];

export const MockBrowser: React.FC<{
  active: string;
  children: React.ReactNode;
}> = ({ active, children }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: B.cardBg,
      borderRadius: 16,
      boxShadow: "0 24px 80px rgba(0,0,0,0.14)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Browser chrome */}
    <div
      style={{
        height: 40,
        background: "#f1f5f9",
        borderBottom: `1px solid ${B.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {["#fc5c65","#f7b731","#26de81"].map((c) => (
        <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
      ))}
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 6,
          height: 22,
          marginLeft: 12,
          display: "flex",
          alignItems: "center",
          paddingLeft: 10,
          fontSize: 11,
          color: B.textMuted,
          fontFamily: B.font,
        }}
      >
        app.realdesk.io
      </div>
    </div>

    {/* App shell */}
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 192,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          background: B.sidebarBg,
          borderRight: `1px solid ${B.border}`,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            background: B.sidebarHeader,
            height: 56,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 900,
              color: "#fff",
              fontFamily: B.font,
              marginRight: 8,
            }}
          >
            R
          </div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: B.font }}>
            RealDesk US
          </span>
        </div>

        {/* Nav */}
        <div style={{ padding: "10px 8px", flex: 1 }}>
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 10,
                  marginBottom: 2,
                  background: isActive ? B.primary : "transparent",
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : B.textSecondary,
                    fontFamily: B.font,
                  }}
                >
                  {item.key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: B.appBg, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  </div>
);
