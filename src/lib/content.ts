import { Badge, DiscoveryAnswers, PhaseDef } from "./types";

export interface DiscoveryOption {
  label: string; // shown on the card
  value: string; // stored as the answer (feeds the scoring engine)
}

export interface DiscoveryQuestion {
  field: keyof DiscoveryAnswers;
  ava: string; // what the guide says
  helper: string;
  options: DiscoveryOption[];
  multiSelect?: boolean; // if true, selections are joined with ", "
}

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    field: "process",
    ava: "Let's start with the process itself. What are you trying to improve?",
    helper: "Pick the closest match — you can add detail on the next few screens.",
    options: [
      { label: "Qualifying or researching inbound leads", value: "Qualifying and researching inbound sales leads before outreach" },
      { label: "Customer support ticket triage", value: "Triaging and responding to customer support tickets" },
      { label: "Screening job applicants", value: "Screening resumes and shortlisting job applicants" },
      { label: "Reconciling invoices or expenses", value: "Reconciling invoices and expenses against purchase orders" },
      { label: "Reviewing contracts", value: "Reviewing and redlining vendor contracts" },
      { label: "Onboarding new employees", value: "Coordinating new employee onboarding" },
    ],
  },
  {
    field: "problem",
    ava: "What's actually broken about it today?",
    helper: "The sharper the problem, the sharper the agent.",
    options: [
      { label: "It's too slow — takes hours or days", value: "It takes far too long — hours or days for something that should be quick" },
      { label: "It's too manual — lots of copy-pasting", value: "It requires a lot of manual copy-pasting between systems" },
      { label: "It's inconsistent — quality varies by person", value: "Quality and output vary a lot depending on who does it" },
      { label: "It's error-prone — mistakes slip through", value: "Mistakes regularly slip through and cause rework" },
    ],
  },
  {
    field: "costImpact",
    ava: "Now put a number on it. How much time or money does this cost you?",
    helper: "A rough number beats no number. This is what makes the case later.",
    options: [
      { label: "A few hours a week (~$5K/quarter)", value: "About 3-4 hours per week, roughly $5,000 per quarter" },
      { label: "About a day a week (~$20K/quarter)", value: "Roughly a full day per week, about $20,000 per quarter" },
      { label: "Multiple people, most of their time (~$50K+/quarter)", value: "Multiple people spend most of their time on it, $50,000+ per quarter" },
      { label: "Not sure, but it's noticeable", value: "No exact number yet, but the cost is clearly noticeable" },
    ],
  },
  {
    field: "owner",
    ava: "Who owns this problem today? Every agent needs a champion.",
    helper: "Someone has to care whether this gets fixed.",
    options: [
      { label: "Me — I'm the leader or founder", value: "The founder / CEO directly owns this" },
      { label: "A department head or manager", value: "A department head owns this and tracks it closely" },
      { label: "A dedicated team lead", value: "A dedicated team lead owns this process" },
      { label: "No one specific yet", value: "not sure" },
    ],
  },
  {
    field: "budget",
    ava: "Is there budget for this, or would it need approval first?",
    helper: "Lyzr calls this Champion, Budget, Scope — a real project needs all three, not just a good idea.",
    options: [
      { label: "Already budgeted this year", value: "in-budget" },
      { label: "Needs approval, and I can approve it myself", value: "can-approve" },
      { label: "Needs approval above me", value: "needs-approval-above" },
      { label: "Not sure yet", value: "unsure" },
    ],
  },
  {
    field: "systems",
    ava: "What systems or data does this process touch? Pick as many as apply.",
    helper: "This tells us how reachable the data actually is.",
    multiSelect: true,
    options: [
      { label: "CRM (Salesforce / HubSpot)", value: "Salesforce CRM" },
      { label: "Spreadsheets (Excel / Google Sheets)", value: "spreadsheet" },
      { label: "Support tool (Zendesk / Intercom)", value: "Zendesk" },
      { label: "Email or Slack", value: "email and Slack" },
      { label: "Internal database or ERP", value: "internal database / ERP" },
    ],
  },
  {
    field: "idealState",
    ava: "If this worked perfectly, what would that look like?",
    helper: "Describe the outcome, not the tool.",
    options: [
      { label: "It happens automatically, no manual work", value: "It happens automatically with no manual work required" },
      { label: "It's faster, with a quick human check", value: "It's dramatically faster, with a lightweight human check before anything final" },
      { label: "It's more consistent and accurate", value: "The output is consistent and accurate every time" },
      { label: "My team is freed up for higher-value work", value: "My team spends their time on judgment calls, not repetitive work" },
    ],
  },
  {
    field: "frequency",
    ava: "How often does this happen?",
    helper: "Frequency drives how much value compounds over time.",
    options: [
      { label: "Multiple times a day", value: "Multiple times every day" },
      { label: "Daily", value: "Every day" },
      { label: "Weekly", value: "Every week" },
      { label: "Per deal or case, a few dozen a month", value: "Per case, roughly 30-40 times per month" },
    ],
  },
  {
    field: "constraints",
    ava: "Last one. Any constraints we should design around?",
    helper: "Naming the guardrail now means the agent won't get blocked later.",
    options: [
      { label: "Compliance or regulatory requirements", value: "Subject to compliance and regulatory requirements" },
      { label: "Can't send external comms without approval", value: "Cannot auto-send external communication without human review" },
      { label: "Sensitive customer data (PII) involved", value: "Handles sensitive PII that requires careful data governance" },
      { label: "No major constraints", value: "" },
    ],
  },
];


export const COST_IMPACT_MONTHLY: Record<string, number> = {
  "About 3-4 hours per week, roughly $5,000 per quarter": 1700,
  "Roughly a full day per week, about $20,000 per quarter": 6700,
  "Multiple people spend most of their time on it, $50,000+ per quarter": 17000,
  "No exact number yet, but the cost is clearly noticeable": 3000,
};

export const BUDGET_LABELS: Record<string, string> = {
  "in-budget": "Already budgeted",
  "can-approve": "You can approve it",
  "needs-approval-above": "Needs sign-off above you",
  unsure: "Budget not confirmed",
};

export const PHASES: PhaseDef[] = [
  {
    id: "discovery",
    number: 1,
    name: "Discovery",
    objective: "Turn a vague pain point into a quantified, owned business problem.",
    deliverables: [
      "Named business champion",
      "Quantified current-state cost",
      "Documented ideal-state outcome",
    ],
    completionCriteria: [
      "Problem has a number attached to it",
      "Someone is accountable for the outcome",
    ],
  },
  {
    id: "architecture",
    number: 2,
    name: "Architecture",
    objective: "Design the agent's boundaries before writing any orchestration.",
    deliverables: [
      "Agent Design Canvas",
      "Tool and integration list",
      "Memory and hand-off rules",
    ],
    completionCriteria: [
      "Every input and output is named",
      "A human hand-off condition is defined",
    ],
  },
  {
    id: "build",
    number: 3,
    name: "Build",
    objective: "Ship a narrow Level 1 agent that proves value on one workflow.",
    deliverables: [
      "A version with no tools first — just the prompt, tested on a real example",
      "One tool added at a time, tested in isolation before it joins the agent",
      "The hand-off condition deliberately triggered and confirmed working",
      "50+ real test cases run, including the messiest ones you have",
    ],
    completionCriteria: [
      "Agent completes the workflow end to end",
      "Latency and accuracy are measured, not assumed",
    ],
  },
  {
    id: "deploy-govern",
    number: 4,
    name: "Deploy & Govern",
    objective: "Put the agent in front of real work with guardrails in place — designed now, not bolted on after something breaks.",
    deliverables: [
      "Access control — who's allowed to use it, change it, or override it (RBAC)",
      "Activity log — every action recorded, kept for at least 90 days (audit trail)",
      "Spending limits — a cap on cost per run and per month (cost caps)",
      "Human check before anything risky or irreversible (approval gates)",
      "Live performance tracking — error rate and speed watched from day one (SLO monitoring)",
      "A record of every change to the prompt or model, so you can undo it (prompt versioning)",
    ],
    completionCriteria: [
      "Every failure mode has a defined response",
      "A human can override or pause the agent at any time",
    ],
  },
  {
    id: "scale",
    number: 5,
    name: "Scale",
    objective: "Extend a proven agent into a multi-agent system, deliberately.",
    deliverables: [
      "Second workflow identified using the same scoring model",
      "Shared memory and orchestration layer",
    ],
    completionCriteria: [
      "Value from Level 1 is proven with real metrics",
      "Scaling decision is backed by data, not enthusiasm",
    ],
  },
];

export const BADGES: Omit<Badge, "earned">[] = [
  {
    id: "problem-hunter",
    name: "Problem Hunter",
    description: "Quantified a real business problem worth solving.",
  },
  {
    id: "agent-architect",
    name: "Agent Architect",
    description: "Designed an agent's inputs, tools, and hand-offs.",
  },
  {
    id: "automation-builder",
    name: "Automation Builder",
    description: "Mapped a Level 1 agent ready to build.",
  },
  {
    id: "governance-guardian",
    name: "Governance Guardian",
    description: "Defined failure modes and human hand-off conditions.",
  },
  {
    id: "scale-strategist",
    name: "Scale Strategist",
    description: "Planned the path from one agent to a governed system.",
  },
];

export interface PhaseCharacter {
  phaseId: string;
  name: string;
  glyph: string; // single-letter/short mark shown in their badge
  role: string;
  line: string; // what they say when you reach their phase
}

/** Each phase of the ecosystem has its own specialist guide — distinct from
 * Ava (who runs the overall journey). This is deliberate: the assignment
 * asked for "characters" (plural) who each help explain one part of how
 * the agent-building ecosystem works, not a single mascot for everything. */
export const PHASE_CHARACTERS: PhaseCharacter[] = [
  {
    phaseId: "discovery",
    name: "Dex",
    glyph: "D",
    role: "The Problem Hunter",
    line: "I don't care how exciting the idea is — show me the number it costs you today, or we're not ready.",
  },
  {
    phaseId: "architecture",
    name: "Aria",
    glyph: "A",
    role: "The Agent Architect",
    line: "Every input, every tool, every hand-off — on paper, before a single line of code. That's how you avoid surprises later.",
  },
  {
    phaseId: "build",
    name: "Bolt",
    glyph: "B",
    role: "The Automation Builder",
    line: "One trigger. One flow. One output. Resist the urge to build everything at once — narrow wins first.",
  },
  {
    phaseId: "deploy-govern",
    name: "Gio",
    glyph: "G",
    role: "The Governance Guardian",
    line: "Who's allowed to use it, what it costs per run, and when a human steps in — decide all of that before it touches real work.",
  },
  {
    phaseId: "scale",
    name: "Sable",
    glyph: "S",
    role: "The Scale Strategist",
    line: "Don't scale because you're excited. Scale because the data from Level 1 told you to.",
  },
];
