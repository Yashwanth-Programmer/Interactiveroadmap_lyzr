import { z } from "zod";

/** Validates the shape of a Discovery answers payload coming into the API.
 * Every field defaults to "" so a partial or malformed client request never
 * crashes the route — it just gets treated as an incomplete answer, which
 * the scoring engine already handles gracefully. */
export const discoveryAnswersSchema = z
  .object({
    process: z.string().default(""),
    problem: z.string().default(""),
    costImpact: z.string().default(""),
    owner: z.string().default(""),
    budget: z.string().default(""),
    systems: z.string().default(""),
    idealState: z.string().default(""),
    frequency: z.string().default(""),
    constraints: z.string().default(""),
  })
  .partial()
  .transform((v) => ({
    process: v.process ?? "",
    problem: v.problem ?? "",
    costImpact: v.costImpact ?? "",
    owner: v.owner ?? "",
    budget: v.budget ?? "",
    systems: v.systems ?? "",
    idealState: v.idealState ?? "",
    frequency: v.frequency ?? "",
    constraints: v.constraints ?? "",
  }));

/** Validates the JSON an LLM (Groq) returns for /api/analyze. This is the
 * production-safety net: an LLM can hallucinate a wrong type, a missing
 * field, or an out-of-range score. Every field here is checked and clamped
 * so a bad LLM response can never crash rendering or produce a nonsense
 * number (e.g. a score of 40/25, or a string where a number is expected). */
export const scoreBreakdownSchema = z.object({
  measurableCost: z.number().min(0).max(5),
  dataAccessibility: z.number().min(0).max(5),
  agentCoverage: z.number().min(0).max(5),
  lowGovernanceRisk: z.number().min(0).max(5),
  championCommitment: z.number().min(0).max(5),
});

export const agentDesignSchema = z.object({
  goal: z.string().min(1),
  trigger: z.string().min(1),
  inputs: z.string().min(1),
  actions: z.string().min(1),
  tools: z.string().min(1),
  memory: z.string().min(1),
  handoff: z.string().min(1),
  slo: z.string().min(1),
  failureModes: z.string().min(1),
});

export const businessCaseSchema = z.object({
  monthlyCostBaseline: z.number().min(0),
  automationCoveragePct: z.number().min(0).max(100),
  grossMonthlySavings: z.number().min(0),
  runningCostLow: z.number().min(0),
  runningCostHigh: z.number().min(0),
  estimatedMonthlySavings: z.number().min(0),
  payoffUnclear: z.boolean(),
  implementationCostLow: z.number().min(0),
  implementationCostHigh: z.number().min(0),
  breakEvenMonthsLow: z.number().min(0),
  breakEvenMonthsHigh: z.number().min(0),
  note: z.string().min(1),
});

export const llmAnalysisSchema = z.object({
  recommendedAgent: z.string().min(1),
  problemSummary: z.string().min(1),
  currentState: z.string().min(1),
  idealState: z.string().min(1),
  automationPotential: z.number().min(0).max(100),
  impactScore: z.number().min(1).max(5),
  complexityScore: z.number().min(1).max(5),
  governanceRisk: z.enum(["Low", "Medium", "High"]),
  readiness: z.enum(["Low", "Medium", "High"]),
  scores: scoreBreakdownSchema,
  totalScore: z.number().min(0).max(25),
  rationale: z.string().min(1),
  recommendedFirstStep: z.string().min(1),
  tools: z.array(z.string()).min(1),
  memory: z.string().min(1),
  handoff: z.string().min(1),
  slo: z.string().min(1),
  governance: z.string().min(1),
  budgetNote: z.string().min(1).optional(),
  businessCase: businessCaseSchema.optional(),
  agentDesign: agentDesignSchema,
  roadmap30Day: z
    .array(z.object({ week: z.string(), focus: z.string(), deliverable: z.string() }))
    .min(1),
});

export type ValidatedLlmAnalysis = z.infer<typeof llmAnalysisSchema>;
