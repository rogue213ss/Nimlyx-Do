"use client";

import { useId, useMemo, useState } from "react";
import {
  percentOf,
  percentageChange,
  whatPercent,
  percentageDifference,
  type PercentageMode,
} from "@/lib/calculators/percentage";

type ModeDef = {
  id: PercentageMode;
  label: string;
  fieldA: string;
  fieldB: string;
  placeholderA: string;
  placeholderB: string;
  resultSuffix: string;
  describe: (a: string, b: string, resultDisplay: string) => string;
  substitution: (a: string, b: string, resultDisplay: string) => string;
};

const MODES: ModeDef[] = [
  {
    id: "percent-of",
    label: "% of a number",
    fieldA: "Percentage",
    fieldB: "Of number",
    placeholderA: "20",
    placeholderB: "150",
    resultSuffix: "",
    describe: (a, b, r) => `${a}% of ${b} is ${r}`,
    substitution: (a, b, r) => `${a} ÷ 100 × ${b} = ${r}`,
  },
  {
    id: "increase-decrease",
    label: "Increase / decrease",
    fieldA: "Original value",
    fieldB: "New value",
    placeholderA: "80",
    placeholderB: "100",
    resultSuffix: "%",
    describe: (a, b, r) => {
      const n = Number(r);
      const direction = n > 0 ? "an increase" : n < 0 ? "a decrease" : "no change";
      return `From ${a} to ${b} is ${direction} of ${r.replace("-", "")}%`;
    },
    substitution: (a, b, r) => `((${b} − ${a}) ÷ ${a}) × 100 = ${r}%`,
  },
  {
    id: "what-percent",
    label: "X is what % of Y",
    fieldA: "X",
    fieldB: "Y",
    placeholderA: "45",
    placeholderB: "60",
    resultSuffix: "%",
    describe: (a, b, r) => `${a} is ${r}% of ${b}`,
    substitution: (a, b, r) => `(${a} ÷ ${b}) × 100 = ${r}%`,
  },
  {
    id: "difference",
    label: "% difference",
    fieldA: "First number",
    fieldB: "Second number",
    placeholderA: "10",
    placeholderB: "20",
    resultSuffix: "%",
    describe: (a, b, r) => `${a} and ${b} differ by ${r}%`,
    substitution: (a, b, r) => {
      const avg = (Number(a) + Number(b)) / 2;
      return `(|${a} − ${b}| ÷ ${avg}) × 100 = ${r}%`;
    },
  },
];

function parseInput(raw: string): number {
  if (raw.trim() === "") return NaN;
  return Number(raw);
}

function compute(mode: PercentageMode, a: number, b: number) {
  switch (mode) {
    case "percent-of":
      return percentOf(a, b);
    case "increase-decrease":
      return percentageChange(a, b);
    case "what-percent":
      return whatPercent(a, b);
    case "difference":
      return percentageDifference(a, b);
  }
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>("percent-of");
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [copied, setCopied] = useState(false);

  const idA = useId();
  const idB = useId();
  const resultId = useId();

  const activeMode = MODES.find((m) => m.id === mode)!;

  const result = useMemo(() => {
    const a = parseInput(inputA);
    const b = parseInput(inputB);
    if (inputA.trim() === "" || inputB.trim() === "") {
      return null;
    }
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return { ok: false as const, error: "Enter valid numbers in both fields." };
    }
    return compute(mode, a, b);
  }, [mode, inputA, inputB]);

  function handleModeChange(next: PercentageMode) {
    if (next === mode) return;
    setMode(next);
    setInputA("");
    setInputB("");
    setCopied(false);
  }

  function handleReset() {
    setInputA("");
    setInputB("");
    setCopied(false);
  }

  async function handleCopy() {
    if (!result || !result.ok) return;
    const text = `${result.display}${activeMode.resultSuffix}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail (permissions, insecure context); fail silently
      // rather than showing an alarming error for a non-critical feature.
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <div
        role="tablist"
        aria-label="Calculation mode"
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => handleModeChange(m.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              mode === m.id
                ? "bg-accent text-paper font-semibold"
                : "border border-line text-ink/70 hover:border-accent/40 hover:text-ink font-medium"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={idA} className="block text-sm font-medium text-ink/70 mb-1.5">
              {activeMode.fieldA}
            </label>
            <input
              id={idA}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              placeholder={activeMode.placeholderA}
              className="w-full rounded-lg border border-line px-3.5 py-3 text-lg font-mono
                         bg-ink/5 placeholder:text-ink/30
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
                         focus-visible:outline-offset-2 focus-visible:bg-ink/10"
            />
          </div>
          <div>
            <label htmlFor={idB} className="block text-sm font-medium text-ink/70 mb-1.5">
              {activeMode.fieldB}
            </label>
            <input
              id={idB}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              placeholder={activeMode.placeholderB}
              className="w-full rounded-lg border border-line px-3.5 py-3 text-lg font-mono
                         bg-ink/5 placeholder:text-ink/30
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
                         focus-visible:outline-offset-2 focus-visible:bg-ink/10"
            />
          </div>
        </div>

        <div className="mt-5 min-h-[5.5rem]" aria-live="polite">
          {result === null && (
            <p className="text-sm text-ink/45 py-2">Enter both values to see the result.</p>
          )}

          {result && !result.ok && (
            <div
              role="alert"
              className="rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm text-error"
            >
              {result.error}
            </div>
          )}

          {result && result.ok && (
            <div
              key={`${mode}-${result.display}`}
              className="rounded-lg border border-accent/25 bg-accent/[0.06] px-4 py-4 sm:px-5 sm:py-5 animate-result-in"
            >
              <p
                id={resultId}
                className="font-mono text-4xl sm:text-5xl font-semibold text-result tabular-nums tracking-tight"
              >
                {result.display}
                {activeMode.resultSuffix}
              </p>
              <p className="mt-2 text-sm text-ink/70">
                {activeMode.describe(inputA, inputB, result.display)}
              </p>
              <p className="mt-3 pt-3 border-t border-accent/15 font-mono text-xs text-ink/45">
                {activeMode.substitution(inputA, inputB, result.display)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg border border-line text-ink/80
                       hover:bg-ink/5 focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result || !result.ok}
            aria-describedby={resultId}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg bg-accent text-paper font-semibold
                       hover:bg-accent-dark disabled:bg-line disabled:text-ink/30 disabled:hover:bg-line
                       focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            {copied ? "Copied" : "Copy result"}
          </button>
        </div>
      </div>
    </div>
  );
}
