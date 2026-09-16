import { describe, it, expect } from "vitest";
import { runDeterministicAnalysis, budgetCategory, budgetNoteFor, computeBusinessCase } from "../scoring";
import { DiscoveryAnswers } from "../types";

function baseAnswers(overrides: Partial<DiscoveryAnswers> = {}): DiscoveryAnswers {
  return {
    process: "Qualifying and researching inbound sales leads before outreach",
    problem: "It requires a lot of manual copy-pasting between systems",
    costImpact: "Roughly a full day per week, about $20,000 per quarter",
    owner: "A department head owns this and tracks it closely",
    budget: "in-budget",
    systems: "Salesforce CRM, email and Slack",
    idealState: "It happens automatically with no manual work required",
    frequency: "Every week",
    constraints: "",
    ...overrides,
  };
}

describe("agent classification", () => {
  const cases: [string, Partial<DiscoveryAnswers>, string][] = [
    ["Sales", { process: "Qualifying and researching inbound sales leads before outreach" }, "Sales Research Agent"],
    ["Support", { process: "Triaging and responding to customer support tickets" }, "Support Triage Agent"],
    ["Recruiting", { process: "Screening resumes and shortlisting job applicants" }, "Recruiting Screening Agent"],
    ["Finance", { process: "Reconciling invoices and expenses against purchase orders" }, "Finance Reconciliation Agent"],
    ["Legal", { process: "Reviewing and redlining vendor contracts" }, "Contract Review Agent"],
    ["Onboarding", { process: "Coordinating new employee onboarding" }, "Onboarding Agent"],
    ["IT", { process: "Handling internal IT helpdesk password reset requests" }, "IT Helpdesk Agent"],
    ["Scheduling", { process: "Coordinating and scheduling client meetings across time zones" }, "Scheduling Agent"],
    ["Content", { process: "Drafting weekly newsletter and social media content" }, "Content Operations Agent"],
    ["Data", { process: "Compiling the weekly sales performance dashboard report" }, "Data Operations Agent"],
    ["Unmatched falls back to default", { process: "Coordinating the annual holiday party" }, "Process Automation Agent"],
  ];

  it.each(cases)("%s -> %s", (_label, overrides, expected) => {
    const result = runDeterministicAnalysis(baseAnswers(overrides));
    expect(result.recommendedAgent).toBe(expected);
  });

  it("does not misclassify 'copy-pasting' as Content Operations (regression)", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({
        process: "Coordinating new employee onboarding",
        problem: "It requires a lot of manual copy-pasting between systems",
      })
    );
    expect(result.recommendedAgent).toBe("Onboarding Agent");
  });

  it("does not misclassify generic 'It is...' phrasing as IT Helpdesk (regression)", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({
        process: "Coordinating the annual holiday party",
        problem: "It takes far too long — hours or days for something that should be quick",
      })
    );
    expect(result.recommendedAgent).not.toBe("IT Helpdesk Agent");
  });
});

describe("budget gate (Champion-Budget-Scope)", () => {
  it("keeps readiness High when budget is already confirmed", () => {
    const result = runDeterministicAnalysis(baseAnswers({ budget: "in-budget" }));
    expect(result.readiness).toBe("High");
  });

  it("keeps readiness High when the person can approve it themselves", () => {
    const result = runDeterministicAnalysis(baseAnswers({ budget: "can-approve" }));
    expect(result.readiness).toBe("High");
  });

  it("downgrades a High score to Medium when budget needs approval above the person", () => {
    const result = runDeterministicAnalysis(baseAnswers({ budget: "needs-approval-above" }));
    expect(result.readiness).toBe("Medium");
  });

  it("downgrades a High score to Medium when budget is unsure", () => {
    const result = runDeterministicAnalysis(baseAnswers({ budget: "unsure" }));
    expect(result.readiness).toBe("Medium");
  });

  it("downgrades a High score to Medium when the champion is weak, even with budget confirmed", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({ budget: "in-budget", owner: "not sure", frequency: "" })
    );
    expect(result.readiness).toBe("Medium");
  });

  it("stays High when both budget is confirmed AND champion is strong", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({ budget: "in-budget", owner: "A department head owns this and tracks it closely" })
    );
    expect(result.readiness).toBe("High");
  });

  it("never changes the underlying 25-point score based on budget alone", () => {
    const funded = runDeterministicAnalysis(baseAnswers({ budget: "in-budget" }));
    const unsure = runDeterministicAnalysis(baseAnswers({ budget: "unsure" }));
    expect(funded.totalScore).toBe(unsure.totalScore);
  });

  it("treats a blank budget answer as unsure, not a crash", () => {
    expect(() => runDeterministicAnalysis(baseAnswers({ budget: "" }))).not.toThrow();
    expect(budgetCategory(baseAnswers({ budget: "" }))).toBe("unsure");
  });

  it("budgetNoteFor returns a non-empty string for every category", () => {
    for (const cat of ["in-budget", "can-approve", "needs-approval-above", "unsure"] as const) {
      expect(budgetNoteFor(cat).length).toBeGreaterThan(0);
    }
  });
});

describe("opportunity matrix reachability (regression for the scaling bug)", () => {
  it("can reach Build First (high impact, low complexity)", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({
        costImpact: "Multiple people spend most of their time on it, $50,000+ per quarter",
        owner: "The founder / CEO directly owns this",
        systems: "Salesforce CRM, spreadsheet, email and Slack, internal database / ERP",
        constraints: "",
      })
    );
    expect(result.impactScore).toBeGreaterThanOrEqual(2.5);
    expect(result.complexityScore).toBeLessThan(2.5);
  });

  it("can reach Skip (low impact, high complexity)", () => {
    const result = runDeterministicAnalysis(
      baseAnswers({
        process: "Reviewing and redlining vendor contracts",
        problem: "Quality and output vary a lot depending on who does it",
        costImpact: "No exact number yet, but the cost is clearly noticeable",
        owner: "not sure",
        systems: "legacy, no API access to the old contract system",
        constraints: "Subject to compliance and regulatory requirements",
      })
    );
    expect(result.impactScore).toBeLessThan(2.5);
    expect(result.complexityScore).toBeGreaterThanOrEqual(2.5);
  });

  it("impact score can reach the full 1-5 range, not cap at 4", () => {
    const best = runDeterministicAnalysis(
      baseAnswers({
        costImpact: "Multiple people spend most of their time on it, $50,000+ per quarter",
        owner: "The founder / CEO directly owns this",
        frequency: "Multiple times every day",
      })
    );
    expect(best.impactScore).toBe(5);
  });

  it("complexity score can reach the full 1-5 range, not floor at 3", () => {
    const easiest = runDeterministicAnalysis(
      baseAnswers({
        systems: "Salesforce CRM, spreadsheet, email and Slack, internal database / ERP",
        constraints: "",
      })
    );
    expect(easiest.complexityScore).toBeLessThanOrEqual(2);
  });
});

describe("business case math", () => {
  it("the three donut slices always sum to the original monthly cost", () => {
    const result = runDeterministicAnalysis(baseAnswers());
    const bc = result.businessCase;
    const remaining = bc.monthlyCostBaseline - bc.grossMonthlySavings;
    const runningMid = (bc.runningCostLow + bc.runningCostHigh) / 2;
    const sum = remaining + runningMid + bc.estimatedMonthlySavings;
    expect(Math.round(sum)).toBe(bc.monthlyCostBaseline);
  });

  it("flags payoffUnclear instead of producing an absurd break-even (regression)", () => {
    const result = runDeterministicAnalysis(baseAnswers({ costImpact: "" }));
    if (result.businessCase.payoffUnclear) {
      expect(result.businessCase.breakEvenMonthsLow).toBe(0);
      expect(result.businessCase.breakEvenMonthsHigh).toBe(0);
    }
  });

  it("never produces a break-even estimate over 60 months when payoff is clear", () => {
    const result = runDeterministicAnalysis(baseAnswers());
    if (!result.businessCase.payoffUnclear) {
      expect(result.businessCase.breakEvenMonthsHigh).toBeLessThan(60);
    }
  });

  it("computeBusinessCase never returns negative numbers", () => {
    const bc = computeBusinessCase(baseAnswers({ costImpact: "" }), 0);
    expect(bc.monthlyCostBaseline).toBeGreaterThanOrEqual(0);
    expect(bc.estimatedMonthlySavings).toBeGreaterThanOrEqual(0);
    expect(bc.grossMonthlySavings).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  it("handles completely empty answers without throwing", () => {
    const empty: DiscoveryAnswers = {
      process: "",
      problem: "",
      costImpact: "",
      owner: "",
      budget: "",
      systems: "",
      idealState: "",
      frequency: "",
      constraints: "",
    };
    expect(() => runDeterministicAnalysis(empty)).not.toThrow();
    const result = runDeterministicAnalysis(empty);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(25);
  });

  it("handles a very long free-text answer without throwing", () => {
    const longText = "This is a very long description. ".repeat(200);
    expect(() => runDeterministicAnalysis(baseAnswers({ process: longText }))).not.toThrow();
  });

  it("total score is always between 0 and 25", () => {
    const scenarios = [
      baseAnswers(),
      baseAnswers({ budget: "unsure", constraints: "Subject to compliance and regulatory requirements" }),
      baseAnswers({ costImpact: "", owner: "not sure", systems: "" }),
    ];
    for (const s of scenarios) {
      const r = runDeterministicAnalysis(s);
      expect(r.totalScore).toBeGreaterThanOrEqual(0);
      expect(r.totalScore).toBeLessThanOrEqual(25);
    }
  });
});
