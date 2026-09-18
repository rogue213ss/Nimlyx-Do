"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { formatJson, minifyJson, validateJson } from "@/lib/json-formatter/format";

type Status = "idle" | "valid" | "invalid";
type LastAction = "format" | "minify" | "validate" | null;

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [copied, setCopied] = useState(false);

  const inputId = useId();
  const outputId = useId();
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runFormat = useCallback(() => {
    const result = formatJson(input);
    if (result.ok) {
      setOutput(result.output);
      setStatus("valid");
      setMessage("Formatted successfully.");
    } else {
      setOutput("");
      setStatus("invalid");
      setMessage(result.error);
    }
    setLastAction("format");
  }, [input]);

  const runMinify = useCallback(() => {
    const result = minifyJson(input);
    if (result.ok) {
      setOutput(result.output);
      setStatus("valid");
      setMessage("Minified successfully.");
    } else {
      setOutput("");
      setStatus("invalid");
      setMessage(result.error);
    }
    setLastAction("minify");
  }, [input]);

  const runValidate = useCallback(() => {
    // Validate deliberately doesn't touch `output` — it's a check, not a
    // transform, so Copy/Download stay tied to whatever Format/Minify last
    // actually produced (or hidden, if neither has run yet).
    const result = validateJson(input);
    setStatus(result.ok ? "valid" : "invalid");
    setMessage(result.message);
    setLastAction("validate");
  }, [input]);

  function handleClear() {
    setInput("");
    setOutput("");
    setStatus("idle");
    setMessage("");
    setLastAction(null);
  }

  function handleTextareaKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runFormat();
    }
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context, etc.) —
      // fail quietly rather than showing a scary error for a non-critical
      // convenience action; the text is still fully selectable/copyable
      // manually from the output area.
    }
  }

  function handleDownload() {
    if (!output) return;
    const filename = lastAction === "minify" ? "minified.json" : "formatted.json";
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasOutput = output !== "";
  const statusColor =
    status === "valid" ? "text-result" : status === "invalid" ? "text-error" : "text-ink/50";

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-ink/70">
              JSON input
            </label>
            {input !== "" && (
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder='Paste or type JSON here, e.g. {"hello": "world"}'
            spellCheck={false}
            className="w-full h-64 sm:h-80 resize-y rounded-lg border border-line bg-ink/5 p-3 text-sm font-mono text-ink
              placeholder:text-ink/30
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          />
          <p className="mt-1 text-xs text-ink/40">Tip: Ctrl/Cmd + Enter formats.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={outputId} className="text-sm font-medium text-ink/70">
              Result
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!hasOutput}
                className="text-xs text-ink/50 hover:text-ink underline-offset-4 hover:underline disabled:opacity-40 disabled:hover:no-underline
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!hasOutput}
                className="text-xs text-ink/50 hover:text-ink underline-offset-4 hover:underline disabled:opacity-40 disabled:hover:no-underline
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded"
              >
                Download
              </button>
            </div>
          </div>
          <textarea
            id={outputId}
            value={output}
            readOnly
            placeholder="Formatted or minified JSON will appear here."
            spellCheck={false}
            className="w-full h-64 sm:h-80 resize-y rounded-lg border border-line bg-ink/5 p-3 text-sm font-mono text-ink
              placeholder:text-ink/30
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={runFormat}
          className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
            hover:bg-accent-dark
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Format
        </button>
        <button
          type="button"
          onClick={runMinify}
          className="min-h-[44px] px-5 rounded-lg border border-line text-ink/80 font-medium text-sm hover:bg-ink/5
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Minify
        </button>
        <button
          type="button"
          onClick={runValidate}
          className="min-h-[44px] px-5 rounded-lg border border-line text-ink/80 font-medium text-sm hover:bg-ink/5
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Validate
        </button>
      </div>

      <p aria-live="polite" className={`mt-3 text-sm font-medium ${statusColor}`}>
        {message}
      </p>
    </div>
  );
}
