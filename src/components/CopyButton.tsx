"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context, etc.) —
      // fail quietly rather than showing a scary error for a low-stakes
      // convenience action; the text is still visible on screen to
      // select and copy manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="min-h-[36px] shrink-0 inline-flex items-center justify-center px-3.5 rounded-lg border border-line text-xs font-medium text-ink/80 hover:bg-ink/5
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
