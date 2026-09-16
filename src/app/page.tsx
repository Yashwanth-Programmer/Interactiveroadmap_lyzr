"use client";

import { JourneyProvider, useJourney } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { Landing } from "@/components/steps/Landing";
import { RoleSelect } from "@/components/steps/RoleSelect";
import { Discovery } from "@/components/steps/Discovery";
import { OpportunityAnalysis } from "@/components/steps/OpportunityAnalysis";
import { OpportunityMatrix } from "@/components/steps/OpportunityMatrix";
import { AgentCanvas } from "@/components/steps/AgentCanvas";
import { Roadmap } from "@/components/steps/Roadmap";
import { LeadCapture } from "@/components/steps/LeadCapture";
import { FinalSummary } from "@/components/steps/FinalSummary";

function StepRouter() {
  const { state } = useJourney();
  switch (state.step) {
    case 0:
      return <Landing />;
    case 1:
      return <RoleSelect />;
    case 2:
      return <Discovery />;
    case 3:
      return <OpportunityAnalysis />;
    case 4:
      return <OpportunityMatrix />;
    case 5:
      return <AgentCanvas />;
    case 6:
      return <Roadmap />;
    case 7:
      return <LeadCapture />;
    case 8:
      return <FinalSummary />;
    default:
      return <Landing />;
  }
}

export default function Home() {
  return (
    <JourneyProvider>
      <Shell>
        <StepRouter />
      </Shell>
    </JourneyProvider>
  );
}
