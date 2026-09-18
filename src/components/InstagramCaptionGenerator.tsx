"use client";

import { useId, useMemo, useState } from "react";
import { CAPTION_TONES, generateCaptions, type CaptionTone } from "@/lib/social/captions";
import { generateHashtags } from "@/lib/social/hashtags";
import CopyButton from "@/components/CopyButton";

export default function InstagramCaptionGenerator() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<CaptionTone>("casual");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const inputId = useId();

  const captions = useMemo(() => generateCaptions(topic, tone, 3), [topic, tone]);
  const { hashtags } = useMemo(() => generateHashtags(topic, 15), [topic]);
  const hashtagText = hashtags.map((h) => `#${h}`).join(" ");

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
        What&apos;s the post about?
      </label>
      <input
        id={inputId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. morning coffee routine, launching my shop"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink mb-2">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {CAPTION_TONES.map((t) => (
            <label
              key={t.id}
              className={`min-h-[36px] inline-flex items-center px-3.5 rounded-lg border cursor-pointer text-sm
                focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                ${tone === t.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
            >
              <input type="radio" name="tone" className="sr-only" checked={tone === t.id} onChange={() => setTone(t.id)} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-3 inline-flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={includeHashtags}
          onChange={(e) => setIncludeHashtags(e.target.checked)}
          className="rounded border-line"
        />
        Include hashtags
      </label>

      {topic.trim() !== "" && (
        <div className="mt-5 space-y-3">
          {captions.map((c, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-3 flex items-start justify-between gap-3">
              <p className="text-sm text-ink flex-1">{c.caption}</p>
              <CopyButton text={c.caption} />
            </div>
          ))}

          {includeHashtags && hashtags.length > 0 && (
            <div className="rounded-lg border border-line bg-surface p-3 flex items-start justify-between gap-3">
              <p className="text-sm text-ink/70 font-mono flex-1">{hashtagText}</p>
              <CopyButton text={hashtagText} label="Copy tags" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
