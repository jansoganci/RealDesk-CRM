import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function AnimatedTabs({ 
  tabs, 
  defaultTab,
  onChange 
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  // Sync internal state with external defaultTab prop
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={cn(
            "relative rounded-md px-2 py-2 md:px-3 md:py-1.5 text-xs md:text-sm font-medium border transition-colors",
            "text-foreground outline-ring",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            activeTab === tab.id
              ? "border-blue-300"
              : "border-gray-300 hover:text-foreground/60 hover:border-gray-400"
          )}
          style={{
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId="bubble"
              className="absolute inset-0 z-10 bg-blue-600"
              style={{ borderRadius: "0.375rem" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={cn(
            "relative z-20 flex items-center gap-2",
            activeTab === tab.id ? "text-white" : ""
          )}>
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

