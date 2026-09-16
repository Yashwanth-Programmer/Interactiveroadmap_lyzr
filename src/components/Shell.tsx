"use client";

import { useJourney } from "@/lib/store";
import { BADGES } from "@/lib/content";

const STEP_LABELS = [
  "Start",
  "Role",
  "Discovery",
  "Analysis",
  "Matrix",
  "Design",
  "Roadmap",
  "Opportunity",
  "Summary",
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { state } = useJourney();
  const { step, xp, badges } = state;
  const showChrome = step > 0;

  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      {showChrome && (
        <header className="sticky top-0 z-40 border-b border-line-500 bg-ink-900/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
            <span className="font-display text-lg tracking-tight shrink-0">
              Agent<span className="text-signal-500">OS</span>
            </span>

            <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
              {STEP_LABELS.map((label, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={label} className="flex items-center gap-1 shrink-0">
                    <span
                      className={`font-mono text-[11px] px-2 py-1 whitespace-nowrap ${
                        active
                          ? "text-signal-500"
                          : done
                          ? "text-paper-300"
                          : "text-paper-500/50"
                      }`}
                    >
                      {String(i).padStart(2, "0")} {label}
                    </span>
                    {i < STEP_LABELS.length - 1 && (
                      <span className="text-line-500 text-xs">/</span>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-4 shrink-0 ml-auto">
              {badges.length > 0 && (
                <div className="hidden sm:flex items-center gap-1" title="Badges earned">
                  {badges.map((id) => {
                    const badge = BADGES.find((b) => b.id === id);
                    if (!badge) return null;
                    return (
                      <span
                        key={id}
                        title={`${badge.name} — ${badge.description}`}
                        className="w-2 h-2 rounded-full bg-positive-500"
                      />
                    );
                  })}
                </div>
              )}
              <div className="font-mono text-xs text-signal-500 border border-signal-500/40 px-2.5 py-1">
                {xp} XP
              </div>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
