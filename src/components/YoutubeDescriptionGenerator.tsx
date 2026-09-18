"use client";

import { useId, useMemo, useState } from "react";
import { generateDescription } from "@/lib/social/youtube-description";
import CopyButton from "@/components/CopyButton";

export default function YoutubeDescriptionGenerator() {
  const [topic, setTopic] = useState("");
  const [pointsRaw, setPointsRaw] = useState("");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const topicId = useId();
  const pointsId = useId();

  const keyPoints = useMemo(
    () =>
      pointsRaw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    [pointsRaw]
  );

  const description = useMemo(
    () => generateDescription({ topic, keyPoints, includeHashtags, includeSubscribeCta: includeCta }),
    [topic, keyPoints, includeHashtags, includeCta]
  );

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={topicId} className="text-sm font-medium text-ink/70">
        Video topic
      </label>
      <input
        id={topicId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. beginner home workouts"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <label htmlFor={pointsId} className="mt-4 block text-sm font-medium text-ink/70">
        Key points (one per line)
      </label>
      <textarea
        id={pointsId}
        value={pointsRaw}
        onChange={(e) => setPointsRaw(e.target.value)}
        placeholder={"Why warming up matters\nThree beginner-friendly moves\nHow often to train each week"}
        rows={4}
        className="mt-1.5 w-full rounded-lg border border-line bg-surface text-ink p-3 text-sm resize-y
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <div className="mt-3 flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={includeCta} onChange={(e) => setIncludeCta(e.target.checked)} className="rounded border-line" />
          Include subscribe line
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={includeHashtags}
            onChange={(e) => setIncludeHashtags(e.target.checked)}
            className="rounded border-line"
          />
          Include hashtags
        </label>
      </div>

      {topic.trim() !== "" && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-ink/70">Description</p>
            <CopyButton text={description} />
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-sm text-ink font-body">
            {description}
          </pre>
        </div>
      )}
    </div>
  );
}
