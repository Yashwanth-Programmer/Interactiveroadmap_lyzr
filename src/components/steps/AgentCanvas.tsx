"use client";

import { useJourney } from "@/lib/store";
import { Ava } from "../Ava";
import { Button, TextArea, TextField } from "../ui/Primitives";
import { AgentDesign } from "@/lib/types";

const FIELDS: { key: keyof AgentDesign; label: string }[] = [
  { key: "goal", label: "Goal — what it does, for whom" },
  { key: "trigger", label: "Trigger — what starts it" },
  { key: "inputs", label: "Inputs — what it reads" },
  { key: "actions", label: "Actions — what it actually does" },
  { key: "tools", label: "Tools it needs access to" },
  { key: "memory", label: "What it needs to remember" },
  { key: "handoff", label: "When it hands off to a human" },
  { key: "slo", label: "Success target (SLO)" },
  { key: "failureModes", label: "What could go wrong, and then what" },
];

const ARCHITECTURE_STAGES = ["Input", "Brain / LLM", "Memory", "Tools", "Orchestration", "Output / Human hand-off"];

export function AgentCanvas() {
  const { state, dispatch } = useJourney();
  const design = state.agentDesign;
  if (!design) return null;

  function update(key: keyof AgentDesign, value: string) {
    dispatch({ type: "SET_AGENT_DESIGN", design: { ...design!, [key]: value } });
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-16 flex-1 flex flex-col gap-10">
      <Ava>
        This is the Agent Design Canvas — the blueprint before anything gets built. Edit
        anything that doesn&rsquo;t match how you&rsquo;d actually run this.
      </Ava>

      <div className="border border-line-500 bg-ink-800 p-6 md:p-8">
        <div className="font-mono text-xs text-paper-500 mb-4">Architecture</div>
        <div className="flex flex-wrap items-center gap-2">
          {ARCHITECTURE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              <div className="border border-line-400 px-3 py-2 text-sm text-paper-100 whitespace-nowrap">
                {stage}
              </div>
              {i < ARCHITECTURE_STAGES.length - 1 && (
                <span className="text-signal-500 text-lg">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-line-500 border border-line-500">
        {FIELDS.map((f) => (
          <div key={f.key} className="bg-ink-900 p-5">
            <div className="font-mono text-xs text-paper-500 mb-2">{f.label}</div>
            <TextArea value={design[f.key]} onChange={(v) => update(f.key, v)} rows={3} />
          </div>
        ))}
      </div>

      <div className="border border-line-500 bg-ink-800 p-6">
        <div className="font-mono text-xs text-paper-500 mb-4">Sign-off — nothing here is final until both boxes are checked</div>
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <label className="flex items-center gap-2.5 text-sm text-paper-100 cursor-pointer">
            <input
              type="checkbox"
              checked={state.canvasSignOff.championSigned}
              onChange={(e) => dispatch({ type: "SET_SIGNOFF", signOff: { championSigned: e.target.checked } })}
              className="w-4 h-4 accent-signal-500"
            />
            Champion sign-off
          </label>
          <label className="flex items-center gap-2.5 text-sm text-paper-100 cursor-pointer">
            <input
              type="checkbox"
              checked={state.canvasSignOff.projectLeadSigned}
              onChange={(e) => dispatch({ type: "SET_SIGNOFF", signOff: { projectLeadSigned: e.target.checked } })}
              className="w-4 h-4 accent-signal-500"
            />
            Project lead sign-off
          </label>
          <TextField
            label="Date"
            value={state.canvasSignOff.date}
            onChange={(v) => dispatch({ type: "SET_SIGNOFF", signOff: { date: v } })}
            placeholder="e.g. 15 Sep 2026"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => dispatch({ type: "GO_TO_STEP", step: 4 })}>
          Back
        </Button>
        <Button
          onClick={() => {
            dispatch({ type: "CONFIRM_AGENT_DESIGN" });
            dispatch({ type: "GO_TO_STEP", step: 6 });
          }}
        >
          Lock in the design
        </Button>
      </div>
    </div>
  );
}
