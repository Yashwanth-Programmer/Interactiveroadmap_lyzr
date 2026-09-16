"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  AgentDesign,
  AnalysisResult,
  CanvasSignOff,
  DiscoveryAnswers,
  JourneyState,
  PersonaId,
  XP_EVENTS,
} from "./types";

const STORAGE_KEY = "agentos-journey-v1";

const EMPTY_DISCOVERY: DiscoveryAnswers = {
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

const initialState: JourneyState = {
  step: 0,
  persona: null,
  discovery: EMPTY_DISCOVERY,
  discoveryStepIndex: 0,
  analysis: null,
  agentDesign: null,
  canvasSignOff: { championSigned: false, projectLeadSigned: false, date: "" },
  phaseProgress: {},
  xp: 0,
  badges: [],
  milestones: [],
  visitCount: 0,
  roadmapsCompleted: 0,
  lead: { name: "", email: "", company: "", teamSize: "", timeline: "" },
};

type Action =
  | { type: "GO_TO_STEP"; step: number }
  | { type: "SET_PERSONA"; persona: PersonaId }
  | { type: "SET_DISCOVERY_ANSWER"; field: keyof DiscoveryAnswers; value: string }
  | { type: "SET_DISCOVERY_STEP"; index: number }
  | { type: "COMPLETE_DISCOVERY" }
  | { type: "SET_ANALYSIS"; analysis: AnalysisResult }
  | { type: "VALIDATE_USE_CASE" }
  | { type: "SET_AGENT_DESIGN"; design: AgentDesign }
  | { type: "SET_SIGNOFF"; signOff: Partial<CanvasSignOff> }
  | { type: "CONFIRM_AGENT_DESIGN" }
  | { type: "TOGGLE_PHASE"; phaseId: string }
  | { type: "DEFINE_GOVERNANCE" }
  | { type: "SET_LEAD_FIELD"; field: keyof JourneyState["lead"]; value: string }
  | { type: "AWARD_BADGE"; badgeId: string }
  | { type: "INCREMENT_VISIT" }
  | { type: "COMPLETE_ROADMAP" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: JourneyState };

/** Awards XP exactly once per milestone id, no matter how many times the action fires. */
function claimMilestone(state: JourneyState, milestoneId: string, amount: number): JourneyState {
  if (state.milestones.includes(milestoneId)) return state;
  return { ...state, xp: state.xp + amount, milestones: [...state.milestones, milestoneId] };
}

function awardBadge(state: JourneyState, badgeId: string): JourneyState {
  if (state.badges.includes(badgeId)) return state;
  return { ...state, badges: [...state.badges, badgeId] };
}

function reducer(state: JourneyState, action: Action): JourneyState {
  switch (action.type) {
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "SET_PERSONA":
      return { ...state, persona: action.persona };
    case "SET_DISCOVERY_ANSWER":
      return {
        ...state,
        discovery: { ...state.discovery, [action.field]: action.value },
      };
    case "SET_DISCOVERY_STEP":
      return { ...state, discoveryStepIndex: action.index };
    case "COMPLETE_DISCOVERY": {
      let next = claimMilestone(state, "discovery-complete", XP_EVENTS.DISCOVERY_COMPLETE);
      next = awardBadge(next, "problem-hunter");
      return next;
    }
    case "SET_ANALYSIS":
      return { ...state, analysis: action.analysis, agentDesign: action.analysis.agentDesign };
    case "VALIDATE_USE_CASE":
      return claimMilestone(state, "use-case-validated", XP_EVENTS.USE_CASE_VALIDATED);
    case "SET_AGENT_DESIGN":
      return { ...state, agentDesign: action.design };
    case "SET_SIGNOFF":
      return { ...state, canvasSignOff: { ...state.canvasSignOff, ...action.signOff } };
    case "CONFIRM_AGENT_DESIGN": {
      let next = claimMilestone(state, "agent-designed", XP_EVENTS.AGENT_DESIGNED);
      next = awardBadge(next, "agent-architect");
      next = awardBadge(next, "automation-builder");
      return next;
    }
    case "TOGGLE_PHASE":
      return {
        ...state,
        phaseProgress: {
          ...state.phaseProgress,
          [action.phaseId]: !state.phaseProgress[action.phaseId],
        },
      };
    case "DEFINE_GOVERNANCE": {
      let next = claimMilestone(state, "governance-defined", XP_EVENTS.GOVERNANCE_DEFINED);
      next = awardBadge(next, "governance-guardian");
      return next;
    }
    case "SET_LEAD_FIELD":
      return { ...state, lead: { ...state.lead, [action.field]: action.value } };
    case "AWARD_BADGE":
      return awardBadge(state, action.badgeId);
    case "INCREMENT_VISIT":
      return { ...state, visitCount: state.visitCount + 1 };
    case "COMPLETE_ROADMAP":
      return { ...state, roadmapsCompleted: state.roadmapsCompleted + 1 };
    case "RESET":
      // visitCount and roadmapsCompleted deliberately survive a reset — this is
      // the habituation hook: the app remembers this browser has been here
      // before, even after someone starts a brand new roadmap.
      return { ...initialState, visitCount: state.visitCount, roadmapsCompleted: state.roadmapsCompleted };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

interface StoreContextValue {
  state: JourneyState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as JourneyState;
        dispatch({ type: "HYDRATE", state: { ...initialState, ...parsed } });
      }
    } catch {
      // ignore corrupted storage
    }
    dispatch({ type: "INCREMENT_VISIT" });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
}
