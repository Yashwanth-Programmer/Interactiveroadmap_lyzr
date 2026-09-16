"use client";

import { useJourney } from "@/lib/store";
import { Button } from "../ui/Primitives";

const VALUE_PROPS = [
  {
    tag: "01",
    title: "A journey shaped to your role",
    body: "CEOs see the business case. Developers see the architecture. Same roadmap, different lens.",
  },
  {
    tag: "02",
    title: "Guided by Ava",
    body: "An AI strategy guide asks the questions Lyzr's own delivery teams ask before they scope any agent.",
  },
  {
    tag: "03",
    title: "Scored, not guessed",
    body: "Every use case is scored on cost, data access, coverage, governance risk, and champion strength.",
  },
  {
    tag: "04",
    title: "Governance from the start",
    body: "Failure modes and human hand-offs are designed before a single line of orchestration is written.",
  },
];

const COMPARISON_ROWS = [
  {
    label: "Time to production",
    normal: "9 months average at large companies — often longer",
    withRoadmap: "~90 days when the process is scored and gated up front",
  },
  {
    label: "Chance it actually pays off",
    normal: "95% of AI pilots show no real business impact (MIT, 2025)",
    withRoadmap: "Nothing gets built below a score of 18/25 with a real budget behind it",
  },
  {
    label: "Budget clarity",
    normal: "Starts with no committed number, costs creep as you go",
    withRoadmap: "A real dollar range ($15K–45K) confirmed before anything is built",
  },
  {
    label: "Rules and safety checks",
    normal: "Added after something breaks or a customer complains",
    withRoadmap: "Designed before a single line of code — who can use it, what it can't do alone",
  },
];

function ComparisonSection() {
  return (
    <section className="border-b border-line-500">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 max-w-xl">
          <div className="font-mono text-xs text-signal-500 mb-3">The usual way vs. this roadmap</div>
          <h2 className="font-display text-2xl md:text-3xl text-paper-100">
            Most AI projects don&rsquo;t fail because of the technology.
          </h2>
        </div>
        <div className="border border-line-500 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-line-500">
                <th className="text-left font-mono text-[11px] text-paper-500 font-normal p-4 w-1/4">&nbsp;</th>
                <th className="text-left font-mono text-[11px] text-paper-500 font-normal p-4">The usual way</th>
                <th className="text-left font-mono text-[11px] text-signal-500 font-normal p-4">With this roadmap</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i < COMPARISON_ROWS.length - 1 ? "border-b border-line-500" : ""}>
                  <td className="p-4 font-display text-paper-100">{row.label}</td>
                  <td className="p-4 text-paper-300 leading-relaxed">{row.normal}</td>
                  <td className="p-4 text-paper-100 leading-relaxed">{row.withRoadmap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-paper-500 font-mono">
          Stats from Lyzr&rsquo;s Agentic AI Roadmap playbook — MIT Project NANDA (2025), S&amp;P Global (2025)
        </p>
      </div>
    </section>
  );
}

export function Landing() {
  const { state, dispatch } = useJourney();
  const isReturning = state.visitCount > 1;

  return (
    <div className="flex-1 flex flex-col">
      <section className="blueprint-grid border-b border-line-500 flex-1 flex items-center">
        <div className="mx-auto max-w-6xl w-full px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            {isReturning && (
              <div className="mb-6 inline-flex items-center gap-2 border border-signal-500/40 bg-ink-800 px-3 py-1.5 font-mono text-xs text-signal-500">
                ✦ Welcome back
                {state.roadmapsCompleted > 0
                  ? ` — you've mapped ${state.roadmapsCompleted} agent ${state.roadmapsCompleted === 1 ? "opportunity" : "opportunities"} here so far`
                  : " — pick up where you left off, or start fresh"}
              </div>
            )}
            <div className="font-mono text-xs text-signal-500 mb-6">
              AgentOS · an interactive roadmap by Lyzr
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight text-paper-100">
              Turn your business problem into an AI agent roadmap.
            </h1>
            <p className="mt-6 text-lg text-paper-300 max-w-xl leading-relaxed">
              Answer a few questions about a process that&rsquo;s costing you time or
              money. Ava will score it, recommend an agent, and lay out exactly
              how to build it — the same method Lyzr uses with its own
              customers.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                onClick={() => dispatch({ type: "GO_TO_STEP", step: 1 })}
              >
                Build my agent roadmap
              </Button>
              <span className="font-mono text-xs text-paper-500">
                ~6 minutes · no account needed
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line-500">
        <div className="mx-auto max-w-6xl px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line-500">
          {VALUE_PROPS.map((v) => (
            <div key={v.tag} className="bg-ink-900 p-6">
              <div className="font-mono text-xs text-signal-500 mb-4">{v.tag}</div>
              <h3 className="font-display text-lg text-paper-100 mb-2">{v.title}</h3>
              <p className="text-sm text-paper-300 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ComparisonSection />

      <footer className="mx-auto max-w-6xl w-full px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-paper-500 font-mono">
        <span>Discovery → Architecture → Build → Deploy &amp; Govern → Scale</span>
        <span>An interactive companion to the Lyzr Agentic AI Roadmap</span>
      </footer>
    </div>
  );
}
