"use client";

import { useId, useMemo, useState } from "react";
import { BIO_PLATFORMS, generateBios, type BioPlatform } from "@/lib/social/bio";
import CopyButton from "@/components/CopyButton";

export default function SocialBioGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<BioPlatform>("instagram");
  const inputId = useId();

  const bios = useMemo(() => generateBios(topic, platform), [topic, platform]);
  const activeLimit = BIO_PLATFORMS.find((p) => p.id === platform)!.limit;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
        What&apos;s your account about?
      </label>
      <input
        id={inputId}
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. plant-based recipes, freelance design, marathon training"
        className="mt-1.5 w-full min-h-[44px] rounded-lg border border-line bg-surface text-ink px-3 text-sm
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      />

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink mb-2">Platform</legend>
        <div className="flex flex-wrap gap-2">
          {BIO_PLATFORMS.map((p) => (
            <label
              key={p.id}
              className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 rounded-lg border cursor-pointer text-sm
                focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                ${platform === p.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
            >
              <input
                type="radio"
                name="platform"
                className="sr-only"
                checked={platform === p.id}
                onChange={() => setPlatform(p.id)}
              />
              {p.label}
              <span className="text-xs text-ink/40 font-mono">{p.limit}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {topic.trim() !== "" && (
        <div className="mt-5 space-y-3">
          {bios.map((b, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ink flex-1">{b.bio}</p>
                <CopyButton text={b.bio} />
              </div>
              <p className={`mt-1.5 text-xs font-mono ${b.withinLimit ? "text-ink/50" : "text-error"}`}>
                {b.length} / {activeLimit} characters
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
