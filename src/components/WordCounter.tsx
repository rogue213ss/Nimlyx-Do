"use client";

import { useId, useMemo, useState } from "react";
import { computeTextStats } from "@/lib/word-counter/stats";

const STAT_ITEMS: { key: keyof ReturnType<typeof computeTextStats>; label: string; suffix?: string }[] = [
  { key: "words", label: "Words" },
  { key: "characters", label: "Characters" },
  { key: "charactersNoSpaces", label: "Characters (no spaces)" },
  { key: "sentences", label: "Sentences" },
  { key: "paragraphs", label: "Paragraphs" },
];

export default function WordCounter() {
  const [text, setText] = useState("");
  const inputId = useId();

  // Computed directly on every keystroke rather than debounced: this is
  // a handful of regex passes over a string, cheap enough even for
  // multi-page pasted text that a live count doesn't need to be delayed
  // (see PROJECT_CONTEXT.md decision log for the reasoning against a
  // worker here).
  const stats = useMemo(() => computeTextStats(text), [text]);

  function handleClear() {
    setText("");
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
          Your text
        </label>
        {text !== "" && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-ink/50 hover:text-ink underline-offset-4 hover:underline
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here…"
        rows={12}
        spellCheck={false}
        className="w-full rounded-lg border border-line bg-surface text-ink p-3 font-mono text-sm resize-y
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <div aria-live="polite" className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-2xl font-display text-ink tabular-nums">{stats[item.key].toLocaleString()}</p>
            <p className="text-xs text-ink/50 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/60">
        <p>
          Reading time: <span className="font-medium text-ink">~{stats.readingTimeMinutes} min</span>
        </p>
        <p>
          Speaking time: <span className="font-medium text-ink">~{stats.speakingTimeMinutes} min</span>
        </p>
      </div>
    </div>
  );
}
