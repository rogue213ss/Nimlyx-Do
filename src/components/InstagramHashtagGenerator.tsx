"use client";

import { useId, useMemo, useState } from "react";
import { generateHashtags } from "@/lib/social/hashtags";
import CopyButton from "@/components/CopyButton";

export default function InstagramHashtagGenerator() {
  const [topic, setTopic] = useState("");
  const inputId = useId();

  const { hashtags, matchedCategories } = useMemo(() => generateHashtags(topic, 20), [topic]);
  const allHashtagsText = hashtags.map((h) => `#${h}`).join(" ");

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
        Topic or keyword
      </label>
      <input
        id={inputId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. sunset photography, home workout, small business"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      {topic.trim() !== "" && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              {hashtags.length} hashtag{hashtags.length === 1 ? "" : "s"}
              {matchedCategories.length > 0 && ` · matched: ${matchedCategories.join(", ")}`}
            </p>
            <CopyButton text={allHashtagsText} label="Copy all" />
          </div>

          <div aria-live="polite" className="mt-3 flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span key={tag} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-sm text-ink/80 font-mono">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
