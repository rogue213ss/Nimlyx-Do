"use client";

import { useId, useMemo, useState } from "react";
import { TITLE_CATEGORIES, generateTitles, type TitleCategory } from "@/lib/social/titles";
import CopyButton from "@/components/CopyButton";

export default function YoutubeTitleGenerator() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<TitleCategory>("howto");
  const inputId = useId();

  const titles = useMemo(() => generateTitles(topic, category, 5), [topic, category]);
  const allTitlesText = titles.join("\n");

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
        Video topic
      </label>
      <input
        id={inputId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. meal prepping, learning guitar, running a marathon"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink mb-2">Style</legend>
        <div className="flex flex-wrap gap-2">
          {TITLE_CATEGORIES.map((c) => (
            <label
              key={c.id}
              className={`min-h-[36px] inline-flex items-center px-3.5 rounded-lg border cursor-pointer text-sm
                focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                ${category === c.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
            >
              <input
                type="radio"
                name="category"
                className="sr-only"
                checked={category === c.id}
                onChange={() => setCategory(c.id)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      {topic.trim() !== "" && (
        <div className="mt-5">
          <div className="flex items-center justify-end">
            <CopyButton text={allTitlesText} label="Copy all" />
          </div>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {titles.map((title, i) => (
              <li key={i} className="py-2.5 flex items-center justify-between gap-3">
                <p className="text-sm text-ink flex-1">{title}</p>
                <CopyButton text={title} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
