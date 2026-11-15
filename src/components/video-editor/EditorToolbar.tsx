"use client";

import { memo } from "react";

const tools = [
  { id: "Trim", icon: "✂", label: "Trim" },
  { id: "Tools", icon: "⬒", label: "Transform" },
  { id: "Audio", icon: "♪", label: "Audio" },
  { id: "Filters", icon: "◑", label: "Filters" },
  { id: "Text", icon: "A", label: "Text" },
] as const;

export type ToolId = (typeof tools)[number]["id"];

type EditorToolbarProps = {
  activeTab: ToolId;
  onTabChange: (tab: ToolId) => void;
};

const EditorToolbar = memo(function EditorToolbar({
  activeTab,
  onTabChange,
}: EditorToolbarProps) {
  return (
    <div
      className="flex flex-row gap-1.5 overflow-x-auto pb-1 sm:flex-col sm:gap-1.5 sm:overflow-visible sm:pb-0"
      role="tablist"
      aria-label="Editor tools"
    >
      {tools.map((tool) => {
        const active = activeTab === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tool.id)}
            className={`flex shrink-0 flex-row items-center gap-1.5 border-4 border-[var(--border-main)] px-3 py-2 text-center transition-all sm:w-18 sm:flex-col sm:gap-1 sm:px-1 sm:py-2.5 ${
              active
                ? "bg-[var(--accent)] text-black shadow-[3px_3px_0_0_var(--border-main)]"
                : "bg-[var(--bg-panel)] shadow-[3px_3px_0_0_var(--border-main)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border-main)]"
            }`}
            title={tool.label}
          >
            <span className="text-base leading-none sm:text-lg">{tool.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">
              {tool.label}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default EditorToolbar;
