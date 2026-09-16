import { Persona, PersonaId } from "./types";

export const PERSONAS: Persona[] = [
  {
    id: "ceo",
    label: "CEO / Founder",
    subtitle: "You want proof this moves the business, not a science project.",
    lens: "business outcomes, margin, and speed to proof",
  },
  {
    id: "cto",
    label: "CTO / CIO",
    subtitle: "You want an architecture that won't fall over at scale.",
    lens: "architecture, reliability, and long-term maintainability",
  },
  {
    id: "ops",
    label: "Operations Leader",
    subtitle: "You want the process to run without babysitting it.",
    lens: "process throughput, exceptions, and hand-off clarity",
  },
  {
    id: "sales",
    label: "Sales / GTM Leader",
    subtitle: "You want more qualified pipeline with less manual grind.",
    lens: "pipeline velocity, rep time saved, and revenue impact",
  },
  {
    id: "ai-leader",
    label: "AI / Innovation Leader",
    subtitle: "You want a defensible way to prioritize what to build next.",
    lens: "portfolio prioritization, governance, and repeatability",
  },
  {
    id: "developer",
    label: "Developer / Technical Builder",
    subtitle: "You want to see the actual architecture, not a deck.",
    lens: "tools, memory, orchestration, and failure handling",
  },
];

export function getPersona(id: PersonaId | null): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

/** Persona-specific framing for shared copy. Same roadmap, different lens. */
export const PERSONA_COPY: Record<
  PersonaId,
  { discoveryIntro: string; analysisIntro: string; roadmapIntro: string }
> = {
  ceo: {
    discoveryIntro:
      "Let's find the one process that's quietly costing you the most, in dollars leadership already tracks.",
    analysisIntro:
      "Here's the business case: what it costs today, what it could return, and how fast you'd see it.",
    roadmapIntro:
      "A 30-day path to a proof point you can put in front of the board.",
  },
  cto: {
    discoveryIntro:
      "Let's scope a process with a clean boundary, a real owner, and data you can actually reach.",
    analysisIntro:
      "Here's the architecture case: coverage, integration surface, and where it could break.",
    roadmapIntro:
      "A phased build plan with SLOs and failure handling defined before you write orchestration code.",
  },
  ops: {
    discoveryIntro:
      "Let's map the process as it runs today, exceptions and all, not the version in the training deck.",
    analysisIntro:
      "Here's what changes day-to-day: less manual routing, clearer hand-offs, fewer exceptions falling through.",
    roadmapIntro:
      "A rollout plan that keeps your team in control while the agent takes the repeatable parts.",
  },
  sales: {
    discoveryIntro:
      "Let's find the part of the funnel where reps spend hours that a system could spend for them.",
    analysisIntro:
      "Here's the pipeline case: hours back per rep, faster follow-up, and where deals currently stall.",
    roadmapIntro:
      "A 30-day plan to get this in front of one pod before it touches the whole team.",
  },
  "ai-leader": {
    discoveryIntro:
      "Let's score this candidate the same way you'd score any item in your AI backlog.",
    analysisIntro:
      "Here's the prioritization case: impact, complexity, governance exposure, and champion strength.",
    roadmapIntro:
      "A phased plan you could defend in a steering committee review.",
  },
  developer: {
    discoveryIntro:
      "Let's get specific: systems, data shape, and what 'done' looks like in code.",
    analysisIntro:
      "Here's the technical case: tools, memory, orchestration pattern, and where it hands off to a human.",
    roadmapIntro:
      "A build sequence from a narrow single-agent workflow to a monitored, governed system.",
  },
};
