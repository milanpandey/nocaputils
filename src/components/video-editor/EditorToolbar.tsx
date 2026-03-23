"use client";

const tools = [
  { id: "Trim", icon: "✂", label: "Trim" },
  { id: "Tools", icon: "⬒", label: "Tools" },
  { id: "Audio", icon: "♪", label: "Audio" },
  { id: "Filters", icon: "◑", label: "Filters" },
  { id: "Text", icon: "A", label: "Text" },
] as const;

export type ToolId = (typeof tools)[number]["id"];

type EditorToolbarProps = {
  activeTab: ToolId;
  onTabChange: (tab: ToolId) => void;
};

export default function EditorToolbar({
  activeTab,
  onTabChange,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-1">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onTabChange(tool.id)}
          className={`flex w-16 flex-col items-center gap-1 border-4 border-[var(--border-main)] px-1 py-3 text-center transition-all ${
            activeTab === tool.id
              ? "bg-[var(--accent)] text-black shadow-[3px_3px_0_0_var(--border-main)]"
              : "bg-[var(--bg-panel)] shadow-[3px_3px_0_0_var(--border-main)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border-main)]"
          }`}
          title={tool.label}
        >
          <span className="text-lg leading-none">{tool.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-wider">
            {tool.label}
          </span>
        </button>
      ))}
    </div>
  );
}
