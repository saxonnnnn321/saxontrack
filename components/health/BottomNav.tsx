"use client";

// Bottom tab bar from the screenshot. Only "Today" and "Log" are wired in the
// first version; Trends and Me are placeholders for later modules.

const items = [
  { key: "today", label: "Today", glyph: "◼" },
  { key: "trends", label: "Trends", glyph: "◆" },
  { key: "log", label: "Log", glyph: "＋" },
  { key: "me", label: "Me", glyph: "◫" },
] as const;

export default function BottomNav({
  onLog,
}: {
  onLog: () => void;
}) {
  return (
    <nav className="sticky bottom-0 mt-auto border-t border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map((it) => {
          const active = it.key === "today";
          const action = it.key === "log" ? onLog : undefined;
          return (
            <button
              key={it.key}
              onClick={action}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${
                active ? "text-foreground" : "text-muted"
              }`}
            >
              <span className="text-base leading-none">{it.glyph}</span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
