"use client";

import { useJourney } from "@/lib/store";
import { Ava } from "../Ava";
import { Button, TextField, Pill } from "../ui/Primitives";

const TEAM_SIZES = ["Just me", "2-10", "11-50", "50+"];
const TIMELINES = ["This quarter", "Next quarter", "Exploring"];

export function LeadCapture() {
  const { state, dispatch } = useJourney();
  const a = state.analysis;
  if (!a) return null;

  const canContinue = state.lead.name.trim() && state.lead.email.trim();

  function setField(field: keyof typeof state.lead, value: string) {
    dispatch({ type: "SET_LEAD_FIELD", field, value });
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-6 py-16 flex-1 flex flex-col gap-10">
      <Ava>You&rsquo;ve built a real agent opportunity. Here&rsquo;s what came out of it.</Ava>

      <div className="border border-signal-500/40 bg-ink-800 p-6 md:p-8">
        <div className="font-mono text-xs text-signal-500 mb-2">Your agent opportunity</div>
        <h2 className="font-display text-2xl text-paper-100 mb-4">{a.recommendedAgent}</h2>
        <p className="text-paper-300 mb-5 leading-relaxed">{a.problemSummary}</p>
        <div className="flex flex-wrap gap-2">
          <Pill tone="positive">Impact: {a.impactScore}/5</Pill>
          <Pill>Complexity: {a.complexityScore}/5</Pill>
          <Pill tone={a.readiness === "High" ? "positive" : "signal"}>Readiness: {a.readiness}</Pill>
          <Pill>First deployment: Level 1 single-agent workflow</Pill>
        </div>
      </div>

      <div className="space-y-5">
        <p className="text-sm text-paper-500 font-mono">A few details so we can send your roadmap over</p>
        <div className="grid sm:grid-cols-2 gap-5">
          <TextField label="Name" value={state.lead.name} onChange={(v) => setField("name", v)} placeholder="Jordan Rivera" />
          <TextField label="Work email" value={state.lead.email} onChange={(v) => setField("email", v)} placeholder="jordan@company.com" />
          <TextField label="Company" value={state.lead.company} onChange={(v) => setField("company", v)} placeholder="Acme Inc." />
        </div>

        <div>
          <span className="block mb-2 text-sm text-paper-300">Team size</span>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setField("teamSize", size)}
                className={`px-3 py-1.5 text-sm border transition-colors ${
                  state.lead.teamSize === size
                    ? "border-signal-500 text-signal-500"
                    : "border-line-500 text-paper-300 hover:border-paper-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block mb-2 text-sm text-paper-300">When would you want this live?</span>
          <div className="flex flex-wrap gap-2">
            {TIMELINES.map((t) => (
              <button
                key={t}
                onClick={() => setField("timeline", t)}
                className={`px-3 py-1.5 text-sm border transition-colors ${
                  state.lead.timeline === t
                    ? "border-signal-500 text-signal-500"
                    : "border-line-500 text-paper-300 hover:border-paper-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
        <Button variant="ghost" onClick={() => dispatch({ type: "GO_TO_STEP", step: 6 })}>
          Back
        </Button>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" disabled={!canContinue} onClick={() => dispatch({ type: "GO_TO_STEP", step: 8 })}>
            Download my agent roadmap
          </Button>
          <Button disabled={!canContinue} onClick={() => dispatch({ type: "GO_TO_STEP", step: 8 })}>
            See how Lyzr can help build this agent
          </Button>
        </div>
      </div>
    </div>
  );
}
