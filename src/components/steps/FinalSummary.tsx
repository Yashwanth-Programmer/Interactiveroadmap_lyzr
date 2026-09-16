"use client";

import { useEffect } from "react";
import { useJourney } from "@/lib/store";
import { getPersona } from "@/lib/personas";
import { Button, Pill, Divider } from "../ui/Primitives";
import { MoneyDonut } from "../ui/MoneyDonut";

export function FinalSummary() {
  const { state, dispatch } = useJourney();
  const a = state.analysis;
  const design = state.agentDesign;
  const persona = getPersona(state.persona);

  useEffect(() => {
    dispatch({ type: "AWARD_BADGE", badgeId: "scale-strategist" });
    dispatch({ type: "COMPLETE_ROADMAP" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!a || !design) return null;

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16 flex-1 flex flex-col gap-10 print:py-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-signal-500 mb-2 flex items-center gap-2">
            Your agent roadmap
            {a.source === "llm" ? (
              <span className="text-positive-500">✦ Analyzed by AI</span>
            ) : (
              <span className="text-paper-500">Rule-based analysis</span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-paper-100">
            {a.recommendedAgent} for {state.lead.company || "your team"}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
          Print / save as PDF
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill>Persona: {persona.label}</Pill>
        <Pill tone="positive">Impact: {a.impactScore}/5</Pill>
        <Pill>Complexity: {a.complexityScore}/5</Pill>
        <Pill tone={a.governanceRisk === "Low" ? "positive" : "signal"}>Governance risk: {a.governanceRisk}</Pill>
        <Pill tone="signal">Score: {a.totalScore}/25</Pill>
      </div>

      <section>
        <h2 className="font-mono text-xs text-paper-500 mb-3">What this means for you</h2>
        <div className="space-y-2.5 mb-5">
          <p className="text-paper-100 leading-relaxed">
            This costs you <span className="text-risk-500 font-medium">${a.businessCase.monthlyCostBaseline.toLocaleString()} a month</span> right now.
          </p>
          {a.businessCase.payoffUnclear ? (
            <p className="text-paper-100 leading-relaxed">
              Running the agent would cost about ${Math.round((a.businessCase.runningCostLow + a.businessCase.runningCostHigh) / 2).toLocaleString()}/month —
              at this scale, that eats up almost all the savings. Not worth building yet as scoped.
            </p>
          ) : (
            <>
              <p className="text-paper-100 leading-relaxed">
                The agent costs about <span className="font-medium">${Math.round((a.businessCase.runningCostLow + a.businessCase.runningCostHigh) / 2).toLocaleString()} a month</span> to run.
              </p>
              <p className="text-paper-100 leading-relaxed">
                After that, you save <span className="text-positive-500 font-medium">${a.businessCase.estimatedMonthlySavings.toLocaleString()} every month</span>.
              </p>
              <p className="text-paper-100 leading-relaxed">
                It pays for itself in <span className="text-signal-500 font-medium">{a.businessCase.breakEvenMonthsLow}–{a.businessCase.breakEvenMonthsHigh} months</span>.
                After that, it&rsquo;s pure savings.
              </p>
            </>
          )}
        </div>

        <div className="border border-line-500 bg-ink-800 p-5 mb-3">
          <div className="font-mono text-[11px] text-paper-500 mb-4">Where your ${a.businessCase.monthlyCostBaseline.toLocaleString()}/month goes</div>
          <MoneyDonut
            slices={[
              {
                label: "Still done by hand",
                value: Math.max(0, a.businessCase.monthlyCostBaseline - a.businessCase.grossMonthlySavings),
                color: "#8fa6b8",
              },
              {
                label: "Cost to run the AI",
                value: (a.businessCase.runningCostLow + a.businessCase.runningCostHigh) / 2,
                color: "#e8a33d",
              },
              {
                label: a.businessCase.payoffUnclear ? "Left over (barely anything)" : "What you save",
                value: a.businessCase.estimatedMonthlySavings,
                color: a.businessCase.payoffUnclear ? "#c1554b" : "#4fa184",
              },
            ]}
          />
        </div>

        {a.businessCase.payoffUnclear && (
          <div className="border border-risk-500/40 bg-ink-800 p-4 mb-3">
            <p className="text-sm text-paper-100 leading-relaxed">
              ⚠️ Honest flag: at this scale, the cost of running the agent would eat up most or all of what it saves.
              This specific version isn&rsquo;t worth building yet — either the problem needs to be bigger, or the
              running cost needs to come down.
            </p>
          </div>
        )}

        <p className="text-xs text-paper-500 leading-relaxed">{a.businessCase.note}</p>
      </section>

      <Divider />

      <section>
        <h2 className="font-mono text-xs text-paper-500 mb-2">Budget check</h2>
        <p className="text-paper-100 leading-relaxed">{a.budgetNote}</p>
      </section>

      <Divider />

      <section>
        <h2 className="font-mono text-xs text-paper-500 mb-2">Business problem</h2>
        <p className="text-paper-100 leading-relaxed">{a.problemSummary}</p>
      </section>

      <Divider />

      <section className="grid sm:grid-cols-2 gap-8">
        <div>
          <h2 className="font-mono text-xs text-paper-500 mb-2">Architecture</h2>
          <dl className="space-y-3 text-sm">
            {([
              ["Trigger", design.trigger],
              ["Inputs", design.inputs],
              ["Tools", design.tools],
              ["Memory", design.memory],
              ["Hand-off", design.handoff],
              ["SLO", design.slo],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <dt className="text-paper-500 font-mono text-[11px] mb-0.5">{label}</dt>
                <dd className="text-paper-100 leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="font-mono text-xs text-paper-500 mb-2">Governance</h2>
          <p className="text-paper-100 leading-relaxed text-sm mb-4">{a.governance}</p>
          <h2 className="font-mono text-xs text-paper-500 mb-2">Failure modes</h2>
          <p className="text-paper-100 leading-relaxed text-sm">{design.failureModes}</p>
        </div>
      </section>

      <Divider />

      <section>
        <h2 className="font-mono text-xs text-paper-500 mb-4">30-day roadmap</h2>
        <div className="grid sm:grid-cols-4 gap-px bg-line-500 border border-line-500">
          {a.roadmap30Day.map((w) => (
            <div key={w.week} className="bg-ink-900 p-4">
              <div className="font-mono text-[11px] text-signal-500 mb-1">{w.week}</div>
              <div className="text-sm text-paper-100 font-medium mb-1">{w.focus}</div>
              <div className="text-xs text-paper-300 leading-relaxed">{w.deliverable}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      <section>
        <h2 className="font-mono text-xs text-paper-500 mb-2">Recommended next step</h2>
        <p className="text-paper-100 leading-relaxed">{a.recommendedFirstStep}</p>
      </section>

      <div className="border border-signal-500/40 bg-ink-800 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:hidden">
        <div>
          <h3 className="font-display text-xl text-paper-100 mb-1">Ready to build this with Lyzr?</h3>
          <p className="text-sm text-paper-300">
            Lyzr&rsquo;s agent studio takes this exact design from canvas to a governed, running agent.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="secondary" onClick={() => window.print()}>
            Download roadmap
          </Button>
          <a href="https://www.lyzr.ai" target="_blank" rel="noopener noreferrer">
            <Button>Talk to Lyzr</Button>
          </a>
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: "RESET" })}
        className="font-mono text-xs text-paper-500 hover:text-paper-300 self-center print:hidden"
      >
        Start a new roadmap
      </button>
    </div>
  );
}
