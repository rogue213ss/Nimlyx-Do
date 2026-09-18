"use client";

import { useId, useMemo, useState } from "react";
import { generateTiktokCaptions } from "@/lib/social/tiktok";
import CopyButton from "@/components/CopyButton";

export default function TiktokCaptionGenerator() {
  const [topic, setTopic] = useState("");
  const inputId = useId();

  const results = useMemo(() => generateTiktokCaptions(topic, 4), [topic]);

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
        What&apos;s the video about?
      </label>
      <input
        id={inputId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. iced coffee, thrift flip, gym progress"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      {topic.trim() !== "" && (
        <div className="mt-5 space-y-3">
          {results.map((r, i) => {
            const hashtagText = r.hashtags.map((h) => `#${h}`).join(" ");
            const combined = `${r.caption}\n${hashtagText}`;
            return (
              <div key={i} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ink flex-1">{r.caption}</p>
                  <CopyButton text={combined} />
                </div>
                <p className="mt-1.5 text-xs text-ink/50 font-mono">{hashtagText}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
