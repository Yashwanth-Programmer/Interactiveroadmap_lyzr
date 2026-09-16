# AgentOS — an interactive AI agent roadmap

A working prototype built for the Lyzr lead-gen assignment: it turns a business
leader's answers about a manual process into a scored AI agent opportunity, an
editable agent design, a five-phase build roadmap, and a qualified lead.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No environment variables or accounts are required —
the app works fully offline using a deterministic scoring engine.

### Optional: real LLM analysis

If you set `GROQ_API_KEY` (in a `.env.local` file or your shell), the
`/api/analyze` route will call Groq directly for the opportunity analysis,
and fall back automatically to the deterministic engine if the call fails or
times out. The demo never breaks either way.

```bash
echo "GROQ_API_KEY=gsk_..." > .env.local
npm run dev
```

Groq is used because it's fast and cheap for this kind of structured
JSON-generation task — get a free key at [console.groq.com](https://console.groq.com).
The default model is `openai/gpt-oss-120b`; override it with a `GROQ_MODEL`
env var if Groq's lineup changes (they deprecate models every few months —
check [console.groq.com/docs/models](https://console.groq.com/docs/models)
for the current list).

### Production build

```bash
npm run build
npm run start
```

## Project structure

```
src/
  app/
    layout.tsx             Root layout, fonts, metadata
    page.tsx               Journey router — switches on step index
    globals.css            Design tokens (blueprint/schematic palette)
    api/analyze/route.ts   LLM call + deterministic fallback
  components/
    Shell.tsx              Top progress rail, XP counter, badge tray
    Ava.tsx                The AI guide character bubble
    steps/                 One component per journey step
    ui/Primitives.tsx      Button, TextField, TextArea, Pill, Divider
  lib/
    types.ts               Shared domain types
    personas.ts             Persona definitions + persona-specific copy
    content.ts               Discovery questions, roadmap phases, badges
    scoring.ts               Deterministic scoring & agent-recommendation engine
    store.tsx                 React context + reducer, persisted to localStorage
```

## The journey

1. **Landing** — the pitch and CTA.
2. **Role select** — six personas (CEO, CTO, Ops, Sales, AI leader, Developer).
   The same roadmap adapts its framing per persona throughout.
3. **Discovery** — eight conversational questions modeled directly on the
   Lyzr playbook (quantified problem, named champion, systems, ideal state,
   frequency, constraints).
4. **Opportunity analysis** — scores the answers on five dimensions
   (measurable cost, data accessibility, agent coverage, governance risk,
   champion commitment), out of 25, and recommends a specific agent from a
   library of ten templates.
5. **Opportunity matrix** — plots business impact against implementation
   complexity and shows why this is (or isn't) a "build first" candidate.
6. **Agent Design Canvas** — an editable canvas (goal, trigger, inputs,
   actions, tools, memory, hand-off, SLO, failure modes) plus an architecture
   diagram.
7. **Roadmap** — the five phases (Discovery → Architecture → Build →
   Deploy & Govern → Scale), each with objectives, deliverables, and
   completion criteria. Marking phases complete drives a visible journey
   progress bar and awards XP/badges.
8. **Opportunity summary + lead capture** — the qualification happens after
   the person has already gotten real value, not on page one.
9. **Final roadmap** — a polished, personalized, printable summary with a
   Lyzr CTA.

## Product decisions

- **Deterministic-first, LLM-optional.** The scoring and agent-recommendation
  logic is rule-based so the demo always works — in an interview room with no
  wifi, on a plane, or in front of Lyzr's own team. A real LLM call (via Groq)
  is wired in and used automatically when a key is present, with the same
  output contract either way.
- **Same roadmap, different lens.** Persona selection doesn't change the
  underlying five-phase methodology — it changes the framing copy on
  Discovery, Analysis, and Roadmap so a CTO reads about architecture risk
  while a CEO reads about the business case, exactly as the brief asked.
- **Lead capture is earned, not extracted.** Name/email only appears after
  the person has a specific, scored agent recommendation in front of them —
  the qualification data (team size, timeline) is gathered as part of
  understanding their opportunity, not as a gate.
- **Gamification stays enterprise-appropriate.** XP and badges exist, but the
  visual language (monospace scores, phase numbering, a progress rail) reads
  as an instrument panel, not a mobile game. XP for each milestone is only
  ever awarded once, even if a step is revisited.
- **Governance is a step, not a footnote.** Failure modes and hand-off
  conditions are required fields on the Agent Design Canvas and get their own
  phase in the roadmap, matching the playbook's emphasis on proving value
  safely before scaling.

## Mapping to the assignment

| Assignment ask | Where it lives |
|---|---|
| Interactive, personalized, gamified experience | Full step-based journey with persona-adaptive copy, XP, badges |
| AI character/guide | Ava, present on every step from Role select onward |
| Playbook's five phases | `lib/content.ts` → `PHASES`, rendered in the Roadmap step |
| Quantified problems, named champions | Discovery questions 2–4 |
| Five scoring dimensions, score out of 25 | `lib/scoring.ts` |
| Business impact × complexity matrix | Opportunity Matrix step |
| Agent Design Canvas | Agent Canvas step, editable |
| Progressive lead qualification | Lead Capture step, after value is delivered |
| Real LLM endpoint with safe fallback | `/api/analyze`, powered by Groq |

## Production-readiness

- **Input validation (Zod).** Every request to `/api/analyze` is validated before it touches the scoring engine — malformed or wrong-typed fields are rejected with a clear 400 error, never silently ignored or allowed to crash the app.
- **LLM output validation (Zod).** The Groq response is validated against a strict schema before a single field of it is trusted. If the model hallucinates a wrong type, an out-of-range score, or a missing field, the whole response is rejected and the app falls back to the deterministic engine automatically — a bad AI response can never reach the screen.
- **Automated test suite.** `npm test` runs 33 tests covering all 11 agent classifications, all budget-gate combinations, all 4 opportunity-matrix quadrants, the business-case math (including the "payoff unclear" edge case), and several regression tests for bugs found and fixed during development.

```bash
npm test
```

## Journeys, gamification, and characters

- **Six distinct personas** (CEO, CTO, Ops, Sales, AI leader, Developer) — the underlying questions and scoring never change, but the framing language does, so each audience reads this as written for them.
- **Habituation mechanics, not just a progress bar.** The app remembers a returning visitor's browser (`visitCount`) and how many full roadmaps they've completed (`roadmapsCompleted`) — both survive clicking "Start a new roadmap," and a returning visitor sees a "Welcome back" recognition banner on the landing page. XP and badges are one-time-only (can't be farmed by replaying a step).
- **Five named ecosystem characters, not one mascot.** Ava guides the overall journey, but each of the five roadmap phases has its own specialist character with a distinct voice — Dex (Discovery), Aria (Architecture), Bolt (Build), Gio (Governance), and Sable (Scale) — each explaining, in one line, what that part of the ecosystem is actually for.

## Suggested 10-minute demo flow

1. **(0:00–0:45)** Open on the landing page — state the reframe: this isn't a
   website, it's Lyzr's own qualification methodology turned into a product.
2. **(0:45–1:30)** Pick a persona (CTO works well) and note how the framing
   text changes.
3. **(1:30–3:00)** Move through Discovery quickly with a real example (e.g. a
   sales research problem) — call out that every question maps directly to a
   line in the Lyzr playbook.
4. **(3:00–4:30)** Land on the Opportunity Analysis screen — walk through the
   score breakdown and explain the deterministic engine, then mention the
   LLM hook is live if a key is supplied.
5. **(4:30–5:30)** Show the Opportunity Matrix and explain why this became a
   "build first" case.
6. **(5:30–7:00)** Open the Agent Design Canvas, edit a field live to show
   it's a real, interactive artifact — not a static mockup.
7. **(7:00–8:00)** Scroll the Roadmap, check off a phase, show the XP/badge
   system firing.
8. **(8:00–9:00)** Reach the final summary, print it, and point to the Lyzr
   CTA — this is the lead-gen payoff.
9. **(9:00–10:00)** Zoom out: explain the deterministic fallback design
   decision, the persona-adaptive copy system, and one or two things you'd
   build next (real auth, CRM sync for the captured lead, a shareable link
   per generated roadmap).
