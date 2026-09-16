"use client";

import { useJourney } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";
import { Ava } from "../Ava";
import { Button } from "../ui/Primitives";
import { PersonaId } from "@/lib/types";

export function RoleSelect() {
  const { state, dispatch } = useJourney();

  function choose(id: PersonaId) {
    dispatch({ type: "SET_PERSONA", persona: id });
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-6 py-16 flex-1 flex flex-col justify-center gap-12">
      <Ava>Which seat are you sitting in today? I&rsquo;ll shape the whole journey around it.</Ava>

      <div className="grid sm:grid-cols-2 gap-px bg-line-500">
        {PERSONAS.map((p) => {
          const selected = state.persona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              className={`text-left p-6 bg-ink-900 transition-colors ${
                selected ? "bg-ink-800 ring-1 ring-inset ring-signal-500" : "hover:bg-ink-800"
              }`}
            >
              <div className="font-display text-lg text-paper-100 mb-1.5">{p.label}</div>
              <p className="text-sm text-paper-300 leading-relaxed">{p.subtitle}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!state.persona}
          onClick={() => dispatch({ type: "GO_TO_STEP", step: 2 })}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
