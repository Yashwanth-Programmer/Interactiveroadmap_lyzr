"use client";

import { useJourney } from "@/lib/store";
import { PHASES, PHASE_CHARACTERS } from "@/lib/content";
import { Ava } from "../Ava";
import { Button } from "../ui/Primitives";
import { PERSONA_COPY, getPersona } from "@/lib/personas";

export function Roadmap() {
  const { state, dispatch } = useJourney();
  const persona = getPersona(state.persona);
  const copy = PERSONA_COPY[persona.id];
  const completedCount = PHASES.filter((p) => state.phaseProgress[p.id]).length;
  const progressPct = Math.round((completedCount / PHASES.length) * 100);

  function togglePhase(id: string) {
    dispatch({ type: "TOGGLE_PHASE", phaseId: id });
    const willBeComplete = !state.phaseProgress[id];
    if (id === "deploy-govern" && willBeComplete) {
      dispatch({ type: "DEFINE_GOVERNANCE" });
    }
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-16 flex-1 flex flex-col gap-10">
      <Ava>{copy.roadmapIntro}</Ava>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-paper-500">Your agent journey</span>
          <span className="font-mono text-xs text-signal-500">{progressPct}%</span>
        </div>
        <div className="h-2 bg-ink-800 border border-line-500">
          <div className="h-full bg-signal-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col">
        {PHASES.map((phase, i) => {
          const done = !!state.phaseProgress[phase.id];
          return (
            <div key={phase.id} className="flex gap-6">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className={`w-9 h-9 shrink-0 border flex items-center justify-center font-mono text-xs transition-colors ${
                    done
                      ? "bg-positive-500 border-positive-500 text-ink-900"
                      : "border-line-400 text-paper-300 hover:border-signal-500"
                  }`}
                  aria-label={`Mark ${phase.name} ${done ? "incomplete" : "complete"}`}
                >
                  {done ? "✓" : phase.number}
                </button>
                {i < PHASES.length - 1 && <div className="w-px flex-1 bg-line-500 my-1" />}
              </div>
              <div className={`pb-10 flex-1 ${i === PHASES.length - 1 ? "pb-0" : ""}`}>
                <h3 className="font-display text-xl text-paper-100 mb-1.5">{phase.name}</h3>
                <p className="text-sm text-paper-300 mb-3 leading-relaxed">{phase.objective}</p>

                {(() => {
                  const character = PHASE_CHARACTERS.find((c) => c.phaseId === phase.id);
                  if (!character) return null;
                  return (
                    <div className="flex gap-3 items-start border border-line-500 bg-ink-800 p-3 mb-4">
                      <div className="w-7 h-7 shrink-0 border border-signal-500/50 flex items-center justify-center font-display italic text-signal-500 text-sm">
                        {character.glyph}
                      </div>
                      <div>
                        <div className="font-mono text-[10px] text-paper-500 mb-1">
                          {character.name} — {character.role}
                        </div>
                        <p className="text-sm text-paper-100 italic leading-relaxed">&ldquo;{character.line}&rdquo;</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-mono text-[11px] text-paper-500 mb-1.5">Deliverables</div>
                    <ul className="space-y-1 text-paper-300">
                      {phase.deliverables.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-paper-500 mb-1.5">Done means</div>
                    <ul className="space-y-1 text-paper-300">
                      {phase.completionCriteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => dispatch({ type: "GO_TO_STEP", step: 5 })}>
          Back
        </Button>
        <Button onClick={() => dispatch({ type: "GO_TO_STEP", step: 7 })}>
          See my agent opportunity
        </Button>
      </div>
    </div>
  );
}
