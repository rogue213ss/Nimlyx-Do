"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "@/lib/image-compressor/validation";
import { looksLikePdfContent, validateFileMeta } from "@/lib/pdf-merger/validation";
import type { CompressionLevel } from "@/lib/pdf-compressor/compress";
import type { WorkerOutboundMessage } from "@/lib/pdf-compressor/types";

const LEVELS: { id: CompressionLevel; label: string; description: string }[] = [
  { id: "extreme", label: "Extreme", description: "Smallest file size, more quality loss" },
  { id: "recommended", label: "Recommended", description: "Balanced compression" },
  { id: "low", label: "Low", description: "Better quality, larger file" },
];

type Status = "empty" | "ready" | "compressing" | "done" | "not-beneficial" | "error";

interface ResultState {
  url: string;
  bytes: number;
  originalBytes: number;
  beneficial: boolean;
}

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("recommended");
  const [status, setStatus] = useState<Status>("empty");
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const fileInputId = useId();

  useEffect(() => {
    const worker = new Worker(new URL("../workers/pdf-compressor.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.stage === "analyzing") setStageLabel("Analyzing PDF…");
        else if (message.stage === "recompressing-image") {
          setStageLabel(`Optimizing images (${message.index} of ${message.total})…`);
        } else setStageLabel("Finalizing file…");
        return;
      }
      if (message.type === "success") {
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const blob = new Blob([message.bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        setResult({
          url,
          bytes: message.compressedBytes,
          originalBytes: message.originalBytes,
          beneficial: message.beneficial,
        });
        setStatus(message.beneficial ? "done" : "not-beneficial");
        setStageLabel(null);
        return;
      }
      setErrorMessage(message.message);
      setStatus("error");
      setStageLabel(null);
    });

    worker.addEventListener("error", () => {
      setErrorMessage("Something went wrong compressing this PDF.");
      setStatus("error");
      setStageLabel(null);
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  async function handleSelectedFile(selected: File) {
    const metaCheck = validateFileMeta(selected);
    if (!metaCheck.ok) {
      setFile(null);
      setErrorMessage(metaCheck.error);
      setStatus("error");
      return;
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await selected.arrayBuffer());
    } catch {
      setFile(null);
      setErrorMessage("Couldn't read this file.");
      setStatus("error");
      return;
    }

    if (!looksLikePdfContent(bytes)) {
      setFile(null);
      setErrorMessage("This doesn't look like a valid PDF file.");
      setStatus("error");
      return;
    }

    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setErrorMessage(null);
    setFile(selected);
    setStatus("ready");
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (selected) void handleSelectedFile(selected);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) void handleSelectedFile(selected);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function handleCompress() {
    if (!file) return;
    setStatus("compressing");
    setStageLabel("Uploading PDF…"); // "uploading" here means "reading into memory" — nothing is sent anywhere
    setErrorMessage(null);

    void file.arrayBuffer().then((buffer) => {
      workerRef.current?.postMessage({ type: "compress", job: { buffer, level } }, [buffer]);
    });
  }

  function reset() {
    setFile(null);
    setStatus("empty");
    setStageLabel(null);
    setErrorMessage(null);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }

  const savedBytes = result ? result.originalBytes - result.bytes : 0;
  const savedPercent = result && result.originalBytes > 0 ? Math.round((savedBytes / result.originalBytes) * 100) : 0;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      {status === "empty" && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a PDF here or press Enter to choose a file"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById(fileInputId)?.click();
            }
          }}
          onClick={() => document.getElementById(fileInputId)?.click()}
          className={`rounded-xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-colors
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
            ${isDragActive ? "border-accent bg-accent/[0.06]" : "border-line bg-surface hover:border-accent/40"}`}
        >
          <p className="font-display text-lg sm:text-xl text-ink">Drop your PDF here</p>
          <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
            Reduce PDF file size without unnecessary quality loss. Your file is processed entirely on
            your device — it never leaves your browser.
          </p>
          <div className="mt-4">
            <span className="inline-flex min-h-[44px] items-center px-5 py-2.5 rounded-lg bg-accent text-paper font-semibold text-sm">
              Select PDF
            </span>
            <input
              id={fileInputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileInputChange}
            />
          </div>
          <p className="mt-3 text-xs text-ink/40">Up to 100 MB</p>
        </div>
      )}

      {status === "error" && !file && errorMessage && (
        <div className="rounded-xl border border-line p-5 text-center">
          <p role="alert" className="text-sm text-error">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Try another file
          </button>
        </div>
      )}

      {file && (status === "ready" || status === "compressing" || (status === "error" && errorMessage)) && (
        <div className="rounded-xl border border-line p-5">
          <p className="text-sm text-ink truncate">{file.name}</p>
          <p className="text-xs text-ink/50 font-mono mt-0.5">Original size: {formatBytes(file.size)}</p>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-ink/70 mb-2">Compression level</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={level === l.id}
                  disabled={status === "compressing"}
                  onClick={() => setLevel(l.id)}
                  className={`text-left rounded-lg border p-3 transition-colors disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                    ${level === l.id ? "border-accent bg-accent/[0.06]" : "border-line hover:border-accent/40"}`}
                >
                  <span className="block text-sm font-semibold text-ink">{l.label}</span>
                  <span className="block text-xs text-ink/50 mt-0.5">{l.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCompress}
              disabled={status === "compressing"}
              className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                hover:bg-accent-dark disabled:opacity-60
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {status === "compressing" ? "Compressing…" : "Compress PDF"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={status === "compressing"}
              className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5 disabled:opacity-60
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Choose a different PDF
            </button>
          </div>

          <p aria-live="polite" className="mt-3 text-sm text-ink/60">
            {stageLabel ?? ""}
          </p>

          {status === "error" && errorMessage && (
            <p role="alert" className="mt-2 text-sm text-error">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {(status === "done" || status === "not-beneficial") && result && file && (
        <div className="rounded-xl border border-line p-5">
          {status === "done" ? (
            <>
              <p className="font-display text-lg text-ink">Compressed successfully</p>
              <div className="mt-3 space-y-1 text-sm font-mono">
                <p className="text-ink/60">Original: {formatBytes(result.originalBytes)}</p>
                <p className="text-ink/60">Compressed: {formatBytes(result.bytes)}</p>
                <p className="text-result font-medium">
                  Saved: {formatBytes(savedBytes)} ({savedPercent}%)
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="font-display text-lg text-ink">This PDF is already well optimized</p>
              <p className="mt-2 text-sm text-ink/60">
                Compressing it further would not have made it smaller, so we&apos;ve kept your
                original file unchanged. You can still download it below.
              </p>
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={result.url}
              download="compressed.pdf"
              className="min-h-[44px] inline-flex items-center px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                hover:bg-accent-dark
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Download {status === "done" ? "Compressed PDF" : "PDF"}
            </a>
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Compress Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
