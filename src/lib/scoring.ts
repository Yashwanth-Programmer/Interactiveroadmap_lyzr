import {
  AgentDesign,
  AnalysisResult,
  BusinessCase,
  DiscoveryAnswers,
  ScoreBreakdown,
} from "./types";
import { COST_IMPACT_MONTHLY } from "./content";

function textOf(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function countMatches(text: string, words: string[]) {
  return words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
}

const NUMBER_RE = /\$[\d,.]+|\d+(\.\d+)?\s*(%|hours?|hrs?|days?|weeks?|minutes?|mins?|k\b)/i;

/** --- Agent template library --- */
interface AgentTemplate {
  name: string;
  keywords: string[];
  tools: string[];
  memory: string;
  handoff: string;
  slo: string;
  actionVerb: string;
}

const AGENT_LIBRARY: AgentTemplate[] = [
  {
    name: "Sales Research Agent",
    keywords: ["lead", "prospect", "sales", "account", "outbound", "pipeline", "research", "crm"],
    tools: ["CRM (Salesforce/HubSpot)", "LinkedIn / firmographic data", "Email or Slack for delivery"],
    memory: "Per-account research history, so it never re-researches the same account twice.",
    handoff: "Hands off to the rep once a lead is scored and briefed — never sends outbound itself.",
    slo: "New lead researched and briefed within 5 minutes of entering the CRM.",
    actionVerb: "research and brief",
  },
  {
    name: "Support Triage Agent",
    keywords: ["support", "ticket", "customer service", "helpdesk", "complaint", "inbox"],
    tools: ["Helpdesk system (Zendesk/Intercom)", "Knowledge base", "CRM for customer context"],
    memory: "Prior ticket history per customer, to avoid repeat questions.",
    handoff: "Escalates to a human agent for anything involving refunds, anger signals, or ambiguity.",
    slo: "Ticket triaged and routed within 60 seconds of arrival.",
    actionVerb: "triage and route",
  },
  {
    name: "Recruiting Screening Agent",
    keywords: ["recruit", "hiring", "candidate", "resume", "applicant", "interview"],
    tools: ["ATS (Greenhouse/Lever)", "Resume parsing", "Calendar for scheduling"],
    memory: "Role requirements and past screening decisions, for consistency across candidates.",
    handoff: "Hands a shortlist to the recruiter for every hiring decision — never rejects a candidate itself.",
    slo: "Application screened within 1 business hour of submission.",
    actionVerb: "screen and shortlist",
  },
  {
    name: "Finance Reconciliation Agent",
    keywords: ["invoice", "reconcil", "expense", "finance", "accounts payable", "billing", "audit"],
    tools: ["ERP / accounting system", "Bank or payment feed", "Spreadsheet export"],
    memory: "Historical vendor and transaction patterns to flag anomalies.",
    handoff: "Flags mismatches above a threshold for finance review before anything is booked.",
    slo: "Transactions reconciled within 24 hours of statement close.",
    actionVerb: "reconcile and flag",
  },
  {
    name: "Content Operations Agent",
    keywords: ["content", "marketing", "campaign", "social media", "brand", "newsletter", "blog"],
    tools: ["CMS", "Brand and style guide", "Analytics dashboard"],
    memory: "Brand voice guidelines and prior approved content.",
    handoff: "Drafts for human approval before anything publishes externally.",
    slo: "First draft ready within 15 minutes of a content request.",
    actionVerb: "draft and format",
  },
  {
    name: "Contract Review Agent",
    keywords: ["contract", "legal", "clause", "agreement", "compliance", "redline"],
    tools: ["Contract management system", "Clause library", "E-signature platform"],
    memory: "Standard clause library and prior negotiated exceptions.",
    handoff: "Escalates any non-standard clause to legal counsel for sign-off.",
    slo: "Standard contract reviewed within 2 hours of submission.",
    actionVerb: "review and redline",
  },
  {
    name: "IT Helpdesk Agent",
    keywords: ["helpdesk", "password", "access request", "onboarding laptop", "software request", "it ticket", "it support"],
    tools: ["ITSM system (Jira/ServiceNow)", "Identity provider", "Internal knowledge base"],
    memory: "Common resolution patterns per issue type.",
    handoff: "Escalates to IT staff for anything requiring elevated system access.",
    slo: "Standard requests resolved or routed within 10 minutes.",
    actionVerb: "resolve and route",
  },
  {
    name: "Onboarding Agent",
    keywords: ["onboard", "new hire", "employee setup", "orientation"],
    tools: ["HRIS", "IT provisioning system", "Calendar"],
    memory: "Role-specific onboarding checklists.",
    handoff: "Hands off any policy exception to HR directly.",
    slo: "Onboarding checklist fully triggered within 1 hour of a signed offer.",
    actionVerb: "coordinate and checklist",
  },
  {
    name: "Scheduling Agent",
    keywords: ["schedul", "calendar", "meeting", "booking", "appointment"],
    tools: ["Calendar system", "Meeting scheduling tool", "Email"],
    memory: "Participant preferences and prior scheduling constraints.",
    handoff: "Confirms with a human before booking anything involving external guests.",
    slo: "Meeting proposed within 2 minutes of a scheduling request.",
    actionVerb: "coordinate and confirm",
  },
  {
    name: "Data Operations Agent",
    keywords: ["report", "dashboard", "data entry", "spreadsheet", "reconciliation of data", "data quality"],
    tools: ["Data warehouse or spreadsheet", "BI dashboard", "Source systems of record"],
    memory: "Prior report structure and known data-quality issues.",
    handoff: "Flags data anomalies for a human to confirm before publishing a report.",
    slo: "Report refreshed and validated within 30 minutes of the data cutoff.",
    actionVerb: "compile and validate",
  },
];

const DEFAULT_TEMPLATE: AgentTemplate = {
  name: "Process Automation Agent",
  keywords: [],
  tools: ["Primary system of record", "Internal knowledge base", "Notification channel (email/Slack)"],
  memory: "Prior runs of this process, to keep outputs consistent over time.",
  handoff: "Hands off to a named owner whenever confidence is low or the case is unusual.",
  slo: "Each case processed within one business day.",
  actionVerb: "process and route",
};

function pickAgentTemplate(answers: DiscoveryAnswers): AgentTemplate {
  // The "process" answer is now a specific multiple-choice pick (or a custom typed
  // description) — it's the strongest, least ambiguous signal. "problem" and
  // "idealState" reuse the same handful of generic phrases across every category
  // (e.g. "It happens automatically..."), so they're weighted lower and only
  // break ties rather than override a clear process match.
  const processText = textOf(answers.process);
  const supportingText = textOf(answers.problem, answers.idealState);

  let best: { t: AgentTemplate; score: number } | null = null;
  for (const t of AGENT_LIBRARY) {
    const score = countMatches(processText, t.keywords) * 3 + countMatches(supportingText, t.keywords);
    if (score > 0 && (!best || score > best.score)) best = { t, score };
  }
  return best?.t ?? DEFAULT_TEMPLATE;
}

/** --- Scoring dimensions, each 0-5 --- */
function scoreMeasurableCost(a: DiscoveryAnswers): number {
  const t = a.costImpact.toLowerCase();
  if (!t.trim()) return 0;
  let score = 1;
  if (NUMBER_RE.test(t)) score += 2;
  if (/\$/.test(t)) score += 1;
  if (t.split(" ").length > 6) score += 1;
  return Math.min(5, score);
}

const ACCESSIBLE_SYSTEMS = [
  "salesforce", "hubspot", "api", "database", "spreadsheet", "excel", "slack",
  "zendesk", "jira", "email", "google sheets", "erp", "crm", "workday", "servicenow",
];
const HARD_SYSTEMS = ["legacy", "no api", "paper", "fax", "manual only", "no integration"];

function scoreDataAccessibility(a: DiscoveryAnswers): number {
  const t = a.systems.toLowerCase();
  if (!t.trim()) return 1;
  let score = 2 + countMatches(t, ACCESSIBLE_SYSTEMS);
  score -= countMatches(t, HARD_SYSTEMS) * 2;
  return Math.max(0, Math.min(5, score));
}

const REPEATABLE_WORDS = [
  "research", "summar", "draft", "route", "triage", "screen", "reconcil",
  "schedul", "compile", "classif", "extract", "respond", "review", "checklist",
];
const JUDGMENT_WORDS = ["negotiat", "strategic decision", "creative direction", "hire/fire", "legal judgment"];

function scoreAgentCoverage(a: DiscoveryAnswers): number {
  const t = textOf(a.process, a.problem, a.idealState);
  let score = 2 + countMatches(t, REPEATABLE_WORDS);
  score -= countMatches(t, JUDGMENT_WORDS) * 2;
  return Math.max(0, Math.min(5, score));
}

const RISK_WORDS = [
  "compliance", "pii", "legal", "regulat", "financial approval", "hipaa",
  "gdpr", "external communication", "auto-send", "contract", "audit",
];

function scoreLowGovernanceRisk(a: DiscoveryAnswers): number {
  const t = a.constraints.toLowerCase();
  if (!t.trim()) return 4; // no stated constraints reads as lower friction, not zero risk
  const hits = countMatches(t, RISK_WORDS);
  return Math.max(0, 5 - hits);
}

function scoreChampionCommitment(a: DiscoveryAnswers): number {
  const owner = a.owner.trim().toLowerCase();
  if (!owner || owner === "not sure" || owner === "no one") return 1;
  let score = 3;
  if (owner.split(" ").length >= 2) score += 1; // named role/person, not one word
  if (a.frequency.toLowerCase().match(/daily|every|weekly|per\s/)) score += 1;
  return Math.min(5, score);
}

function computeScores(a: DiscoveryAnswers): ScoreBreakdown {
  return {
    measurableCost: scoreMeasurableCost(a),
    dataAccessibility: scoreDataAccessibility(a),
    agentCoverage: scoreAgentCoverage(a),
    lowGovernanceRisk: scoreLowGovernanceRisk(a),
    championCommitment: scoreChampionCommitment(a),
  };
}

/** Scales any partial-dimension sum onto a clean 1-5 range, given its own real max —
 * using the 25-point (5-dimension) to5Scale on a 2 or 3-dimension sum silently
 * compresses the range (e.g. impact could never reach 5, complexity could never
 * drop below 3). This fixes that so every point on the 1-5 scale is reachable. */
function scaleTo5(sum: number, maxSum: number) {
  return Math.max(1, Math.min(5, Math.round((sum / maxSum) * 5)));
}

function readinessFromTotal(total: number): "Low" | "Medium" | "High" {
  if (total >= 18) return "High";
  if (total >= 11) return "Medium";
  return "Low";
}

function governanceRiskLabel(score: number): "Low" | "Medium" | "High" {
  if (score >= 4) return "Low";
  if (score >= 2) return "Medium";
  return "High";
}

function buildAgentDesign(a: DiscoveryAnswers, template: AgentTemplate, agentName: string): AgentDesign {
  return {
    goal: `${agentName} should ${template.actionVerb} "${a.process || "the target process"}" so ${a.owner || "the process owner"} spends less time on manual work and more on judgment calls.`,
    trigger: a.frequency
      ? `Fires on: ${a.frequency}.`
      : "Fires whenever a new case enters the primary system of record.",
    inputs: a.systems || "Primary system of record, plus any reference data needed to complete the task.",
    actions: `Gathers context, ${template.actionVerb}s the case, and prepares an output ready for the next step.`,
    tools: template.tools.join(", "),
    memory: template.memory,
    handoff: template.handoff,
    slo: template.slo,
    failureModes: "Low-confidence output, missing data, or a case outside the agent's defined scope — all route to a human rather than guessing.",
  };
}

function buildRoadmap(agentName: string) {
  return [
    {
      week: "Week 1",
      focus: "Discovery lock-in",
      deliverable: `Confirm the champion, quantify the baseline, and freeze scope for ${agentName}.`,
    },
    {
      week: "Week 2",
      focus: "Architecture",
      deliverable: "Finalize the Agent Design Canvas: tools, memory, hand-off rules, and SLO.",
    },
    {
      week: "Week 3",
      focus: "Build",
      deliverable: "Ship a Level 1 single-agent workflow in a test environment against real data.",
    },
    {
      week: "Week 4",
      focus: "Deploy & measure",
      deliverable: `Run ${agentName} on live cases with a human in the loop, and measure against the SLO — governance checkpoints from the canvas stay active the whole time.`,
    },
  ];
}

/** --- Budget gate (Champion-Budget-Scope) --- */
export type BudgetCategory = "in-budget" | "can-approve" | "needs-approval-above" | "unsure";

export function budgetCategory(a: DiscoveryAnswers): BudgetCategory {
  const b = a.budget.trim();
  if (b === "in-budget" || b === "can-approve" || b === "needs-approval-above") return b;
  return "unsure";
}

export function budgetNoteFor(cat: BudgetCategory): string {
  switch (cat) {
    case "in-budget":
      return "Budget is already in place — nothing financial is blocking a start.";
    case "can-approve":
      return "It'll need a sign-off, but you can give that sign-off yourself — that's still a fast path.";
    case "needs-approval-above":
      return "It needs approval above you — build that approval time into your timeline before promising a start date.";
    default:
      return "Budget isn't confirmed yet. Worth nailing down before this becomes a real project instead of just a good idea.";
  }
}

/** --- Business case: what it wastes today, what it costs to build, and what it costs to run --- */
export function computeBusinessCase(answers: DiscoveryAnswers, automationPotential: number): BusinessCase {
  const known = COST_IMPACT_MONTHLY[answers.costImpact];
  const estimated = known === undefined;
  const monthlyCostBaseline = known ?? 3000;

  const coverage = Math.max(0.2, Math.min(1, automationPotential / 100));
  const grossMonthlySavings = Math.max(1, Math.round(monthlyCostBaseline * coverage));

  // Per Lyzr's playbook: platform infrastructure typically runs $500–$3K/month.
  // This is the "electricity bill" people forget to subtract before calling something a saving.
  const runningCostLow = 500;
  const runningCostHigh = 3000;
  const runningCostMid = (runningCostLow + runningCostHigh) / 2;

  // Net savings can't go below zero — if running cost would eat the whole gain,
  // the honest answer is "this isn't worth it yet," not a fake break-even number
  // in the thousands of months.
  const netBeforeFloor = grossMonthlySavings - runningCostMid;
  const payoffUnclear = netBeforeFloor <= 0;
  const estimatedMonthlySavings = Math.max(1, Math.round(netBeforeFloor));

  const implementationCostLow = 15000;
  const implementationCostHigh = 45000;
  const breakEvenMonthsLow = payoffUnclear ? 0 : Math.max(1, Math.round(implementationCostLow / estimatedMonthlySavings));
  const breakEvenMonthsHigh = payoffUnclear ? 0 : Math.max(1, Math.round(implementationCostHigh / estimatedMonthlySavings));

  return {
    monthlyCostBaseline,
    automationCoveragePct: Math.round(coverage * 100),
    grossMonthlySavings,
    runningCostLow,
    runningCostHigh,
    estimatedMonthlySavings,
    payoffUnclear,
    implementationCostLow,
    implementationCostHigh,
    breakEvenMonthsLow,
    breakEvenMonthsHigh,
    note: payoffUnclear
      ? "At this scale, the agent's own running cost would eat most or all of the savings — this isn't worth building as scoped. Try quantifying a bigger slice of the problem, or re-scope to cut the running cost."
      : estimated
      ? "You didn't give an exact number, so this is a conservative placeholder — swap in your real monthly cost for an accurate payback estimate. Running cost is already subtracted from the savings shown."
      : "Based on the cost you gave us, a typical first-agent build cost of $15K–45K, and a typical running cost of $500–$3K/month (both per Lyzr's playbook) — already subtracted from the savings shown.",
  };
}

export function runDeterministicAnalysis(answers: DiscoveryAnswers): AnalysisResult {
  const scores = computeScores(answers);
  const totalScore =
    scores.measurableCost +
    scores.dataAccessibility +
    scores.agentCoverage +
    scores.lowGovernanceRisk +
    scores.championCommitment;

  const template = pickAgentTemplate(answers);
  // measurableCost weighted x2 (max 5*2 + 5 + 5 = 20) — real cost matters most for impact.
  const impactScore = scaleTo5(
    scores.measurableCost * 2 + scores.championCommitment + scores.agentCoverage,
    20
  );
  // dataAccessibility weighted x2 (max 5*2 + 5 = 15) — easy data access lowers complexity most.
  const complexityScore = 6 - scaleTo5(scores.dataAccessibility * 2 + scores.lowGovernanceRisk, 15);
  const automationPotential = Math.round((scores.agentCoverage / 5) * 100);
  const governanceRisk = governanceRiskLabel(scores.lowGovernanceRisk);

  const budgetCat = budgetCategory(answers);
  const scoreReadiness = readinessFromTotal(totalScore);
  // Per Lyzr's Champion-Budget-Scope framework: a high score alone isn't enough —
  // budget has to be real AND the champion has to be genuinely committed, or the
  // project stalls at the first real obstacle. Both are checked as explicit gates
  // on top of the score, not just folded into the 25-point total.
  const budgetBlocks = budgetCat === "unsure" || budgetCat === "needs-approval-above";
  const championWeak = scores.championCommitment < 3;
  const readiness: "Low" | "Medium" | "High" =
    scoreReadiness === "High" && (budgetBlocks || championWeak) ? "Medium" : scoreReadiness;
  const budgetNote = budgetNoteFor(budgetCat);

  const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const strongestLabel: Record<string, string> = {
    measurableCost: "a clearly quantified cost",
    dataAccessibility: "data that's already reachable",
    agentCoverage: "a highly repeatable workflow",
    lowGovernanceRisk: "low governance exposure",
    championCommitment: "a committed owner",
  };

  const gateReason = budgetBlocks && championWeak
    ? "budget isn't locked and the champion isn't clearly committed yet"
    : budgetBlocks
    ? "budget isn't locked yet"
    : "the champion isn't clearly committed yet";

  const rationale = `${template.name} scored ${totalScore}/25, driven mainly by ${strongestLabel[strongest]}. ${
    readiness === "High"
      ? "This is a strong Build First candidate: the value is clear and the path to a working agent is short."
      : readiness === "Medium" && scoreReadiness === "High"
      ? `The scoring alone says Build First — but ${gateReason}, so treat this as ready-to-scope, not ready-to-start.`
      : readiness === "Medium"
      ? "This is workable, but tightening the scope or the data access story would move it up the list faster."
      : "This needs more definition before it's ready to build — start by naming a firmer owner and a harder number."
  }`;

  const governance = answers.constraints.trim()
    ? `Design around the stated constraint: "${answers.constraints.trim()}". Every action gets a human checkpoint until the agent has a track record.`
    : "No hard constraints were named, so default to a conservative rollout: log every action and require human approval for the first two weeks.";

  return {
    recommendedAgent: template.name,
    problemSummary: answers.problem || "A manual process is consuming time that could go toward higher-value work.",
    currentState: answers.problem
      ? `Today: ${answers.problem}${answers.costImpact ? ` — ${answers.costImpact}.` : "."}`
      : "Current state not yet fully defined.",
    idealState: answers.idealState || "A defined ideal state has not yet been set.",
    automationPotential,
    impactScore,
    complexityScore,
    governanceRisk,
    readiness,
    scores,
    totalScore,
    rationale,
    recommendedFirstStep: `Start with a narrow Level 1 ${template.name.toLowerCase()} scoped to a single step in "${answers.process || "this process"}" before touching anything adjacent.`,
    tools: template.tools,
    memory: template.memory,
    handoff: template.handoff,
    slo: template.slo,
    governance,
    budgetNote,
    businessCase: computeBusinessCase(answers, automationPotential),
    agentDesign: buildAgentDesign(answers, template, template.name),
    roadmap30Day: buildRoadmap(template.name),
    source: "deterministic",
  };
}
