"use client";

import { useEffect, useRef, useState } from "react";
import { useJourney } from "@/lib/store";
import { PERSONA_COPY, getPersona } from "@/lib/personas";
import { Ava } from "../Ava";
import { Button, Pill, Divider } from "../ui/Primitives";
import { AnalysisResult } from "@/lib/types";
import { BUDGET_LABELS } from "@/lib/content";

const SCORE_LABELS: { key: keyof AnalysisResult["scores"]; label: string }[] = [
  { key: "measurableCost", label: "Measurable cost" },
  { key: "dataAccessibility", label: "Data accessibility" },
  { key: "agentCoverage", label: "Agent coverage" },
  { key: "lowGovernanceRisk", label: "Low governance risk" },
  { key: "championCommitment", label: "Champion commitment" },
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-paper-300">{label}</span>
        <span className="font-mono text-xs text-paper-500">{value}/5</span>
      </div>
      <div className="h-1.5 bg-ink-800 border border-line-500">
        <div
          className="h-full bg-signal-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function OpportunityAnalysis() {
  const { state, dispatch } = useJourney();
  const [loading, setLoading] = useState(!state.analysis);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);
  const persona = getPersona(state.persona);
  const copy = PERSONA_COPY[persona.id];

  useEffect(() => {
    if (state.analysis || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: state.discovery }),
    })
      .then((r) => r.json())
      .then((data: AnalysisResult) => {
        dispatch({ type: "SET_ANALYSIS", analysis: data });
      })
      .catch(() => setError("Analysis failed to load. Try again."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-24 flex-1 flex flex-col justify-center gap-6">
        <Ava>Scoring your process against five dimensions Lyzr uses to prioritize agent builds…</Ava>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-signal-500 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !state.analysis) {
    return (
      <div className="mx-auto max-w-2xl w-full px-6 py-24 flex-1 flex flex-col justify-center gap-6">
        <p className="text-paper-300">{error ?? "Something went wrong."}</p>
        <Button
          onClick={() => {
            fetched.current = false;
            setError(null);
            setLoading(true);
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const a = state.analysis;
  const readinessTone = a.readiness === "High" ? "positive" : a.readiness === "Medium" ? "signal" : "risk";
  const riskTone = a.governanceRisk === "Low" ? "positive" : a.governanceRisk === "Medium" ? "signal" : "risk";

  return (
    <div className="mx-auto max-w-4xl w-full px-6 py-16 flex-1 flex flex-col gap-10">
      <Ava>{copy.analysisIntro}</Ava>

      <div className="border border-line-500 bg-ink-800">
        <div className="p-6 md:p-8 border-b border-line-500 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-signal-500 mb-2 flex items-center gap-2">
              Recommended agent
              {a.source === "llm" ? (
                <span className="text-positive-500">✦ AI-analyzed</span>
              ) : (
                <span className="text-paper-500">rule-based analysis</span>
              )}
            </div>
            <h2 className="font-display text-3xl text-paper-100">{a.recommendedAgent}</h2>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-paper-500 mb-1">Opportunity score</div>
            <div className="font-display text-3xl text-signal-500">{a.totalScore}<span className="text-lg text-paper-500">/25</span></div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono text-paper-500 mb-1">Current state</div>
              <p className="text-paper-100 leading-relaxed">{a.currentState}</p>
            </div>
            <div>
              <div className="text-xs font-mono text-paper-500 mb-1">Ideal state</div>
              <p className="text-paper-100 leading-relaxed">{a.idealState}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Pill tone={readinessTone as "positive" | "signal" | "risk"}>Readiness: {a.readiness}</Pill>
              <Pill tone={riskTone as "positive" | "signal" | "risk"}>Risk if something goes wrong: {a.governanceRisk}</Pill>
              <Pill>How much can be automated: {a.automationPotential}%</Pill>
              <Pill tone={a.readiness !== "Low" && (state.discovery.budget === "in-budget" || state.discovery.budget === "can-approve") ? "positive" : "neutral"}>
                Budget: {BUDGET_LABELS[state.discovery.budget] ?? "Not confirmed"}
              </Pill>
            </div>
          </div>

          <div className="space-y-4">
            {SCORE_LABELS.map((s) => (
              <ScoreBar key={s.key} label={s.label} value={a.scores[s.key]} />
            ))}
          </div>
        </div>

        <Divider />

        <div className="p-6 md:p-8">
          <div className="text-xs font-mono text-paper-500 mb-2">Why this scored the way it did</div>
          <p className="text-paper-100 leading-relaxed mb-4">{a.rationale}</p>
          <div className="text-xs font-mono text-paper-500 mb-2">Budget check</div>
          <p className="text-paper-100 leading-relaxed mb-4">{a.budgetNote}</p>
          <div className="text-xs font-mono text-paper-500 mb-2">Recommended first step</div>
          <p className="text-paper-100 leading-relaxed">{a.recommendedFirstStep}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => dispatch({ type: "GO_TO_STEP", step: 2 })}>
          Back
        </Button>
        <Button
          onClick={() => {
            dispatch({ type: "VALIDATE_USE_CASE" });
            dispatch({ type: "GO_TO_STEP", step: 4 });
          }}
        >
          See the opportunity matrix
        </Button>
      </div>
    </div>
  );
}
