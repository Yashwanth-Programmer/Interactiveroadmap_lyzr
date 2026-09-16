export type PersonaId =
  | "ceo"
  | "cto"
  | "ops"
  | "sales"
  | "ai-leader"
  | "developer";

export interface Persona {
  id: PersonaId;
  label: string;
  subtitle: string;
  lens: string; // what this persona cares about, used to tint copy
}

export interface DiscoveryAnswers {
  process: string; // the business process
  problem: string; // the measurable problem
  costImpact: string; // time/money cost
  owner: string; // named champion
  budget: string; // in-budget | can-approve | needs-approval-above | unsure
  systems: string; // systems/data involved
  idealState: string; // what "good" looks like
  frequency: string; // how often it happens
  constraints: string; // governance/compliance constraints
}

export const DISCOVERY_FIELDS: (keyof DiscoveryAnswers)[] = [
  "process",
  "problem",
  "costImpact",
  "owner",
  "budget",
  "systems",
  "idealState",
  "frequency",
  "constraints",
];

export interface ScoreBreakdown {
  measurableCost: number; // 0-5
  dataAccessibility: number; // 0-5
  agentCoverage: number; // 0-5
  lowGovernanceRisk: number; // 0-5
  championCommitment: number; // 0-5
}

export interface AgentDesign {
  goal: string;
  trigger: string;
  inputs: string;
  actions: string;
  tools: string;
  memory: string;
  handoff: string;
  slo: string;
  failureModes: string;
}

export interface CanvasSignOff {
  championSigned: boolean;
  projectLeadSigned: boolean;
  date: string;
}

export interface AnalysisResult {
  recommendedAgent: string;
  problemSummary: string;
  currentState: string;
  idealState: string;
  automationPotential: number; // 0-100
  impactScore: number; // 1-5, business impact
  complexityScore: number; // 1-5, implementation complexity
  governanceRisk: "Low" | "Medium" | "High";
  readiness: "Low" | "Medium" | "High";
  scores: ScoreBreakdown;
  totalScore: number; // out of 25
  rationale: string;
  recommendedFirstStep: string;
  tools: string[];
  memory: string;
  handoff: string;
  slo: string;
  governance: string;
  budgetNote: string;
  businessCase: BusinessCase;
  agentDesign: AgentDesign;
  roadmap30Day: { week: string; focus: string; deliverable: string }[];
  source: "llm" | "deterministic";
}

export interface BusinessCase {
  monthlyCostBaseline: number; // what the problem WASTES today, per month, in dollars
  automationCoveragePct: number; // % of that monthly waste the agent can realistically handle
  grossMonthlySavings: number; // savings from automation, BEFORE subtracting running cost
  runningCostLow: number; // low end of monthly cost to keep the agent running (LLM usage, platform fee)
  runningCostHigh: number; // high end
  estimatedMonthlySavings: number; // NET savings after subtracting running cost — the real number
  payoffUnclear: boolean; // true when running cost would eat most/all of the savings at this scale
  implementationCostLow: number; // low end of typical first-agent build cost (one-time)
  implementationCostHigh: number; // high end
  breakEvenMonthsLow: number; // fastest realistic payback, using net savings (0 if payoffUnclear)
  breakEvenMonthsHigh: number; // slowest realistic payback, using net savings (0 if payoffUnclear)
  note: string; // plain-language caveat about the estimate
}

export interface PhaseDef {
  id: string;
  number: number;
  name: string;
  objective: string;
  deliverables: string[];
  completionCriteria: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface JourneyState {
  step: number;
  persona: PersonaId | null;
  discovery: DiscoveryAnswers;
  discoveryStepIndex: number;
  analysis: AnalysisResult | null;
  agentDesign: AgentDesign | null;
  canvasSignOff: CanvasSignOff;
  phaseProgress: Record<string, boolean>; // phase id -> complete
  xp: number;
  badges: string[]; // earned badge ids
  milestones: string[]; // one-time XP events already claimed, to prevent re-farming XP
  visitCount: number; // survives RESET — habituation hook: recognizes returning visitors
  roadmapsCompleted: number; // survives RESET — how many full journeys this browser has finished
  lead: {
    name: string;
    email: string;
    company: string;
    teamSize: string;
    timeline: string;
  };
}

export const XP_EVENTS = {
  DISCOVERY_COMPLETE: 100,
  USE_CASE_VALIDATED: 150,
  AGENT_DESIGNED: 200,
  GOVERNANCE_DEFINED: 250,
} as const;
