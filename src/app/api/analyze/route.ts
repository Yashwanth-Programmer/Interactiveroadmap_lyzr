import { NextRequest, NextResponse } from "next/server";
import { runDeterministicAnalysis, computeBusinessCase, budgetNoteFor, budgetCategory } from "@/lib/scoring";
import { AnalysisResult } from "@/lib/types";
import { discoveryAnswersSchema, llmAnalysisSchema } from "@/lib/schema";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the analysis engine behind AgentOS, an AI agent roadmap tool.
Given a business leader's answers about a manual process, return ONLY a single JSON object
(no markdown fences, no commentary) matching exactly this shape:

{
  "recommendedAgent": string,
  "problemSummary": string,
  "currentState": string,
  "idealState": string,
  "automationPotential": number (0-100),
  "impactScore": number (1-5),
  "complexityScore": number (1-5),
  "governanceRisk": "Low" | "Medium" | "High",
  "readiness": "Low" | "Medium" | "High",
  "scores": {
    "measurableCost": number (0-5),
    "dataAccessibility": number (0-5),
    "agentCoverage": number (0-5),
    "lowGovernanceRisk": number (0-5),
    "championCommitment": number (0-5)
  },
  "totalScore": number (0-25, sum of the five scores above),
  "rationale": string (2-3 sentences explaining the score),
  "recommendedFirstStep": string,
  "tools": string[] (3-5 concrete tools/integrations),
  "memory": string (what the agent needs to remember between runs),
  "handoff": string (when it hands off to a human),
  "slo": string (a concrete service-level objective),
  "governance": string (how to design around named constraints),
  "budgetNote": string (a plain-language read on whether budget is actually confirmed, based on the leader's budget answer),
  "businessCase": {
    "monthlyCostBaseline": number (what the problem wastes per month today, in dollars),
    "automationCoveragePct": number (0-100, % of that waste the agent can realistically handle),
    "grossMonthlySavings": number (savings from automation BEFORE subtracting running cost),
    "runningCostLow": number (typical low end of monthly cost to run the agent, in dollars),
    "runningCostHigh": number (typical high end),
    "estimatedMonthlySavings": number (NET savings — gross savings minus running cost, never below 0),
    "payoffUnclear": boolean (true if running cost would eat most/all of the savings at this scale),
    "implementationCostLow": number (typical low end to build a first agent, one-time, in dollars),
    "implementationCostHigh": number (typical high end),
    "breakEvenMonthsLow": number (using NET savings),
    "breakEvenMonthsHigh": number (using NET savings),
    "note": string (one caveat about how firm this estimate is, and confirm running cost is subtracted)
  },
  "agentDesign": {
    "goal": string,
    "trigger": string,
    "inputs": string,
    "actions": string,
    "tools": string,
    "memory": string,
    "handoff": string,
    "slo": string,
    "failureModes": string
  },
  "roadmap30Day": [
    { "week": string, "focus": string, "deliverable": string }
  ] (exactly 4 items, one per week)
}

Ground every field in the leader's actual answers. Be specific and concrete, never generic filler.
Follow the Lyzr Agentic AI methodology: quantify the problem, name a champion, confirm budget
(Champion-Budget-Scope), score before building, start with a narrow single-agent (Level 1) workflow,
and design governance and hand-off before scale. Use plain, everyday language — avoid acronyms and
jargon (e.g. say "who's allowed to use it" rather than just "RBAC", "spending limits" rather than
just "cost caps") so a non-technical reader understands every field without help.`;

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body — expected JSON" }, { status: 400 });
  }

  const body = rawBody as { answers?: unknown };
  if (!body || typeof body !== "object" || !("answers" in body)) {
    return NextResponse.json({ error: "Missing 'answers' field" }, { status: 400 });
  }

  // Zod validates and coerces the incoming answers — a malformed or partial
  // payload from a buggy client never reaches the scoring engine unchecked.
  const parsedAnswers = discoveryAnswersSchema.safeParse(body.answers);
  if (!parsedAnswers.success) {
    return NextResponse.json({ error: "Invalid answers format", details: parsedAnswers.error.issues }, { status: 400 });
  }
  const answers = parsedAnswers.data;

  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey) {
    try {
      const result = await callGroq(answers, apiKey);
      return NextResponse.json(result);
    } catch (err) {
      // Any failure here — network, bad JSON, a field the LLM got wrong shape
      // on, a timeout — falls straight through to the deterministic engine.
      // The person using the app never sees an error; they just silently get
      // the rule-based analysis instead of the AI one.
      console.error("LLM analysis failed, falling back to deterministic engine:", err);
    }
  }

  const fallback = runDeterministicAnalysis(answers);
  return NextResponse.json(fallback);
}

async function callGroq(
  answers: ReturnType<typeof discoveryAnswersSchema.parse>,
  apiKey: string
): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  // gpt-oss-120b is Groq's current recommended general-purpose model (Aug 2026);
  // override with GROQ_MODEL if Groq's lineup changes again.
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Discovery answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn only the JSON object.`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Groq API returned ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No content in Groq response");

    const cleaned = text.replace(/```json|```/g, "").trim();
    const rawParsed: unknown = JSON.parse(cleaned);

    // This is the production safety net: validate the LLM's JSON against a
    // strict schema before trusting a single field of it. An LLM can (and
    // eventually will) hallucinate a wrong type, an out-of-range score, or a
    // missing field — if that happens, we reject the whole response and let
    // the caller fall back to the deterministic engine, rather than shipping
    // a broken or misleading number to the screen.
    const validated = llmAnalysisSchema.parse(rawParsed);

    const businessCase = validated.businessCase ?? computeBusinessCase(answers, validated.automationPotential);
    const budgetNote = validated.budgetNote ?? budgetNoteFor(budgetCategory(answers));

    return { ...validated, businessCase, budgetNote, source: "llm" };
  } finally {
    clearTimeout(timeout);
  }
}
