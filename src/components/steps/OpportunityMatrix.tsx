"use client";

import { useJourney } from "@/lib/store";
import { Ava } from "../Ava";
import { Button } from "../ui/Primitives";

const QUADRANTS = [
  { id: "build-first", label: "Build first", desc: "Clear value, achievable scope — this is your first agent", x: [2.5, 5], y: [0, 2.5] },
  { id: "plan-phase-2", label: "Plan for phase 2", desc: "High value, too complex for a first build", x: [2.5, 5], y: [2.5, 5] },
  { id: "quick-win", label: "Consider for quick win", desc: "Low complexity, lower returns — only if you need an early demo", x: [0, 2.5], y: [0, 2.5] },
  { id: "skip", label: "Skip", desc: "Not enough value or too much complexity to justify it", x: [0, 2.5], y: [2.5, 5] },
];

export function OpportunityMatrix() {
  const { state, dispatch } = useJourney();
  const a = state.analysis;
  if (!a) return null;

  const quadrant =
    a.impactScore >= 2.5 && a.complexityScore < 2.5
      ? "build-first"
      : a.impactScore >= 2.5
      ? "plan-phase-2"
      : a.complexityScore < 2.5
      ? "quick-win"
      : "skip";

  const dotLeft = (a.complexityScore / 5) * 100;
  const dotBottom = (a.impactScore / 5) * 100;

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-16 flex-1 flex flex-col gap-10">
      <Ava>
        Here&rsquo;s why {a.recommendedAgent} rises to the top of the list — plotted against
        business impact and how hard it is to build.
      </Ava>

      <div className="grid md:grid-cols-[1fr_240px] gap-8 items-start">
        <div className="border border-line-500 bg-ink-800 p-6 md:p-10">
          <div className="relative aspect-square max-w-lg mx-auto">
            {/* axes labels */}
            <span className="absolute -left-2 top-0 -translate-x-full font-mono text-[11px] text-paper-500 rotate-0">High impact</span>
            <span className="absolute -left-2 bottom-0 -translate-x-full font-mono text-[11px] text-paper-500">Low impact</span>
            <span className="absolute left-0 -bottom-6 font-mono text-[11px] text-paper-500">Low complexity</span>
            <span className="absolute right-0 -bottom-6 font-mono text-[11px] text-paper-500">High complexity</span>

            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 border border-line-500">
              {[
                { id: "plan-phase-2" },
                { id: "build-first" },
                { id: "skip" },
                { id: "quick-win" },
              ].map((cell, i) => {
                const q = QUADRANTS.find((qq) => qq.id === cell.id)!;
                const active = quadrant === q.id;
                return (
                  <div
                    key={i}
                    className={`border-line-500 p-3 flex flex-col justify-between ${
                      i % 2 === 0 ? "border-r" : ""
                    } ${i < 2 ? "border-b" : ""} ${active ? "bg-signal-500/10" : ""}`}
                  >
                    <span className={`font-display text-sm ${active ? "text-signal-500" : "text-paper-500"}`}>
                      {q.label}
                    </span>
                    <span className="font-mono text-[10px] text-paper-500">{q.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* plotted point */}
            <div
              className="absolute w-3.5 h-3.5 bg-signal-500 border-2 border-ink-900 -translate-x-1/2 translate-y-1/2 shadow-[0_0_0_3px_rgba(232,163,61,0.3)]"
              style={{ left: `${dotLeft}%`, bottom: `${dotBottom}%` }}
              title={a.recommendedAgent}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="font-mono text-xs text-paper-500 mb-1">Business impact</div>
            <div className="font-display text-2xl text-paper-100">{a.impactScore} / 5</div>
          </div>
          <div>
            <div className="font-mono text-xs text-paper-500 mb-1">Implementation complexity</div>
            <div className="font-display text-2xl text-paper-100">{a.complexityScore} / 5</div>
          </div>
          <div>
            <div className="font-mono text-xs text-paper-500 mb-1">Quadrant</div>
            <div className="font-display text-2xl text-signal-500">
              {QUADRANTS.find((q) => q.id === quadrant)?.label}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => dispatch({ type: "GO_TO_STEP", step: 3 })}>
          Back
        </Button>
        <Button onClick={() => dispatch({ type: "GO_TO_STEP", step: 5 })}>
          Design the agent
        </Button>
      </div>
    </div>
  );
}
