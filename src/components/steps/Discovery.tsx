"use client";

import { useMemo, useState } from "react";
import { useJourney } from "@/lib/store";
import { DISCOVERY_QUESTIONS, DiscoveryQuestion } from "@/lib/content";
import { PERSONA_COPY, getPersona } from "@/lib/personas";
import { Ava } from "../Ava";
import { Button, TextField } from "../ui/Primitives";

function parseStoredAnswer(question: DiscoveryQuestion, stored: string) {
  const parts = question.multiSelect
    ? stored.split(",").map((s) => s.trim()).filter(Boolean)
    : [stored].filter(Boolean);

  const selected: string[] = [];
  const leftovers: string[] = [];

  for (const part of parts) {
    const match = question.options.find((o) => o.value === part);
    if (match) selected.push(match.value);
    else leftovers.push(part);
  }

  return { selected, custom: leftovers.join(", ") };
}

export function Discovery() {
  const { state, dispatch } = useJourney();
  const index = state.discoveryStepIndex;
  const question = DISCOVERY_QUESTIONS[index];
  const isFirst = index === 0;
  const isLast = index === DISCOVERY_QUESTIONS.length - 1;
  const persona = getPersona(state.persona);
  const copy = PERSONA_COPY[persona.id];

  const initial = useMemo(
    () => parseStoredAnswer(question, state.discovery[question.field]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.field]
  );

  const [selected, setSelected] = useState<string[]>(initial.selected);
  const [customText, setCustomText] = useState(initial.custom);
  const [showCustom, setShowCustom] = useState(initial.custom.length > 0);

  function resetFor(q: DiscoveryQuestion, stored: string) {
    const parsed = parseStoredAnswer(q, stored);
    setSelected(parsed.selected);
    setCustomText(parsed.custom);
    setShowCustom(parsed.custom.length > 0);
  }

  function toggleOption(value: string) {
    if (question.multiSelect) {
      setSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setSelected([value]);
      setShowCustom(false);
    }
  }

  function toggleCustom() {
    if (question.multiSelect) {
      setShowCustom((s) => !s);
    } else {
      setShowCustom(true);
      setSelected([]);
    }
  }

  function currentAnswer(): string {
    if (question.multiSelect) {
      const parts = [...selected];
      if (customText.trim()) parts.push(customText.trim());
      return parts.join(", ");
    }
    return showCustom ? customText.trim() : selected[0] ?? "";
  }

  const isValid = question.multiSelect
    ? selected.length > 0 || customText.trim().length > 0
    : selected.length > 0 || (showCustom && customText.trim().length > 0);

  function next() {
    dispatch({ type: "SET_DISCOVERY_ANSWER", field: question.field, value: currentAnswer() });
    if (isLast) {
      dispatch({ type: "COMPLETE_DISCOVERY" });
      dispatch({ type: "GO_TO_STEP", step: 3 });
    } else {
      const nextIndex = index + 1;
      const nextQuestion = DISCOVERY_QUESTIONS[nextIndex];
      dispatch({ type: "SET_DISCOVERY_STEP", index: nextIndex });
      resetFor(nextQuestion, state.discovery[nextQuestion.field]);
    }
  }

  function back() {
    dispatch({ type: "SET_DISCOVERY_ANSWER", field: question.field, value: currentAnswer() });
    if (isFirst) {
      dispatch({ type: "GO_TO_STEP", step: 1 });
      return;
    }
    const prevIndex = index - 1;
    const prevQuestion = DISCOVERY_QUESTIONS[prevIndex];
    dispatch({ type: "SET_DISCOVERY_STEP", index: prevIndex });
    resetFor(prevQuestion, state.discovery[prevQuestion.field]);
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-6 py-16 flex-1 flex flex-col justify-center gap-8">
      <div className="flex items-center gap-2">
        {DISCOVERY_QUESTIONS.map((q, i) => (
          <div key={q.field} className={`h-1 flex-1 ${i <= index ? "bg-signal-500" : "bg-line-500"}`} />
        ))}
      </div>

      {isFirst && <p className="font-mono text-xs text-paper-500">{copy.discoveryIntro}</p>}

      <Ava>{question.ava}</Ava>

      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleOption(opt.value)}
              className={`w-full text-left px-4 py-3 border transition-colors flex items-center gap-3 ${
                isSelected
                  ? "border-signal-500 bg-signal-500/10 text-paper-100"
                  : "border-line-500 text-paper-300 hover:border-paper-300"
              }`}
            >
              <span
                className={`shrink-0 w-4 h-4 border flex items-center justify-center text-[10px] ${
                  question.multiSelect ? "" : "rounded-full"
                } ${isSelected ? "border-signal-500 bg-signal-500 text-ink-900" : "border-line-400"}`}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span className="text-sm">{opt.label}</span>
            </button>
          );
        })}

        <button
          onClick={toggleCustom}
          className={`w-full text-left px-4 py-3 border transition-colors flex items-center gap-3 ${
            showCustom
              ? "border-signal-500 bg-signal-500/10 text-paper-100"
              : "border-line-500 text-paper-300 hover:border-paper-300"
          }`}
        >
          <span
            className={`shrink-0 w-4 h-4 border flex items-center justify-center text-[10px] ${
              question.multiSelect ? "" : "rounded-full"
            } ${showCustom ? "border-signal-500 bg-signal-500 text-ink-900" : "border-line-400"}`}
          >
            {showCustom ? "✓" : ""}
          </span>
          <span className="text-sm">Something else — let me type it</span>
        </button>

        {showCustom && (
          <div className="pl-7 pt-1">
            <TextField
              value={customText}
              onChange={setCustomText}
              placeholder="Type your own answer"
              autoFocus
            />
          </div>
        )}
      </div>

      <p className="text-xs text-paper-500">{question.helper}</p>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={back}>
          Back
        </Button>
        <span className="font-mono text-xs text-paper-500">
          {index + 1} / {DISCOVERY_QUESTIONS.length}
        </span>
        <Button onClick={next} disabled={!isValid}>
          {isLast ? "Analyze my process" : "Next"}
        </Button>
      </div>
    </div>
  );
}
