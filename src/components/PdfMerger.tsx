"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "@/lib/image-compressor/validation";
import {
  MAX_FILE_COUNT,
  looksLikePdfContent,
  moveDown,
  moveUp,
  validateBatchMeta,
} from "@/lib/pdf-merger/validation";
import type { WorkerOutboundMessage } from "@/lib/pdf-merger/types";

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PdfItem {
  id: string;
  file: File;
  pageCount?: number;
  error?: string;
  reading: boolean;
}

type Status = "idle" | "merging" | "done" | "error";

interface ResultState {
  url: string;
  bytes: number;
  pageCount: number;
}

export default function PdfMerger() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const itemsRef = useRef<PdfItem[]>([]);
  itemsRef.current = items;
  const resultUrlRef = useRef<string | null>(null);

  const dropzoneId = useId();
  const fileInputId = useId();

  useEffect(() => {
    const worker = new Worker(new URL("../workers/pdf-merger.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.stage === "reading") {
          setStageLabel(`Reading ${message.fileName} (${message.index} of ${message.total})…`);
        } else {
          setStageLabel("Finalizing…");
        }
        return;
      }
      if (message.type === "success") {
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const blob = new Blob([message.bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        setResult({ url, bytes: blob.size, pageCount: message.pageCount });
        setStatus("done");
        setStageLabel(null);
        return;
      }
      // error
      setErrorMessage(message.message);
      setStatus("error");
      setStageLabel(null);
      if (message.failedFile) {
        setItems((prev) =>
          prev.map((item) =>
            item.file.name === message.failedFile
              ? { ...item, error: "Couldn't merge this file — see the message above." }
              : item
          )
        );
      }
    });

    worker.addEventListener("error", () => {
      setErrorMessage("Something went wrong merging these PDFs.");
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

  // --- File intake: validate metadata, add rows immediately, then
  // inspect real content (magic bytes + a lightweight pdf-lib parse) to
  // get a page count and catch corrupt/password-protected files early. ---

  const inspectFile = useCallback(async (id: string, file: File) => {
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, reading: false, error: "Couldn't read this file." } : item))
      );
      return;
    }

    if (!looksLikePdfContent(bytes)) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, reading: false, error: "This doesn't look like a valid PDF file." } : item
        )
      );
      return;
    }

    try {
      // Lazy-loaded: pdf-lib is a substantial library, and this is the one
      // place it's used on the main thread (purely to report a page count
      // before merging) — loading it only once a file is actually added
      // keeps it out of this page's initial bundle entirely, matching the
      // lazy-loading discipline already used for the image tools' WASM
      // dependencies. The actual merge work still runs in the worker,
      // which loads its own copy of pdf-lib independently.
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      const pageCount = doc.getPageCount();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, reading: false, pageCount } : item))
      );
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, reading: false, error: "Couldn't read this PDF. It may be corrupt or password-protected." }
            : item
        )
      );
    }
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const { accepted, rejected, batchWarning: overflowWarning } = validateBatchMeta(
        itemsRef.current.length,
        incoming
      );

      const newItems: PdfItem[] = accepted.map((file) => ({
        id: genId(),
        file,
        reading: true,
      }));

      setItems((prev) => [...prev, ...newItems]);
      setResult((prevResult) => {
        if (prevResult) URL.revokeObjectURL(prevResult.url);
        return null;
      });
      resultUrlRef.current = null;
      setStatus("idle");
      setErrorMessage(null);

      const warnings = [overflowWarning, ...rejected.map((r) => r.error)].filter((w): w is string => Boolean(w));
      setBatchWarning(warnings.length > 0 ? warnings.join(" ") : null);

      for (const item of newItems) {
        void inspectFile(item.id, item.file);
      }
    },
    [inspectFile]
  );

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function moveItemUp(index: number) {
    setItems((prev) => moveUp(prev, index));
  }

  function moveItemDown(index: number) {
    setItems((prev) => moveDown(prev, index));
  }

  function startOver() {
    setItems([]);
    setStatus("idle");
    setStageLabel(null);
    setErrorMessage(null);
    setBatchWarning(null);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }

  async function handleMerge() {
    const validItems = itemsRef.current.filter((i) => !i.error && !i.reading);
    if (validItems.length === 0) return;

    setErrorMessage(null);
    setStatus("merging");
    setStageLabel("Preparing PDFs…");

    const files = await Promise.all(
      validItems.map(async (item) => ({
        name: item.file.name,
        buffer: await item.file.arrayBuffer(),
      }))
    );

    workerRef.current?.postMessage(
      { type: "merge", job: { files } },
      files.map((f) => f.buffer)
    );
  }

  const validCount = items.filter((i) => !i.error && !i.reading).length;
  const stillReading = items.some((i) => i.reading);
  const canMerge = validCount >= 1 && status !== "merging" && !stillReading;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      {items.length === 0 && (
        <div
          id={dropzoneId}
          role="button"
          tabIndex={0}
          aria-label="Drop PDFs here or press Enter to choose files"
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
          <p className="font-display text-lg sm:text-xl text-ink">Merge PDFs</p>
          <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
            Combine multiple PDF files into one document. Your files are processed entirely on your
            device — they never leave your browser.
          </p>
          <div className="mt-4">
            <span className="inline-flex min-h-[44px] items-center px-5 py-2.5 rounded-lg bg-accent text-paper font-semibold text-sm">
              Select PDFs
            </span>
            <input
              id={fileInputId}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileInputChange}
            />
          </div>
          <p className="mt-3 text-xs text-ink/40">Up to {MAX_FILE_COUNT} PDFs · 100 MB each</p>
        </div>
      )}

      {batchWarning && (
        <p role="alert" className="mt-3 text-sm text-error">
          {batchWarning}
        </p>
      )}

      {items.length > 0 && status !== "done" && (
        <>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item, index) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveItemUp(index)}
                    disabled={index === 0}
                    aria-label={`Move ${item.file.name} up`}
                    className="min-h-[28px] min-w-[28px] rounded border border-line text-ink/50 hover:text-ink hover:bg-ink/5 disabled:opacity-30
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItemDown(index)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                    className="min-h-[28px] min-w-[28px] rounded border border-line text-ink/50 hover:text-ink hover:bg-ink/5 disabled:opacity-30
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    ▼
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">
                    <span className="text-ink/40 font-mono mr-1.5">{index + 1}.</span>
                    {item.file.name}
                  </p>
                  <p className="text-xs text-ink/50 font-mono">
                    {formatBytes(item.file.size)}
                    {item.reading && " · Reading…"}
                    {!item.reading &&
                      item.pageCount !== undefined &&
                      ` · ${item.pageCount} page${item.pageCount === 1 ? "" : "s"}`}
                  </p>
                  {item.error && (
                    <p role="alert" className="text-xs text-error mt-0.5">
                      {item.error}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-line text-ink/60 hover:text-ink hover:bg-ink/5 shrink-0
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label
              htmlFor={`${fileInputId}-more`}
              className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-line text-ink/80 font-medium text-sm hover:bg-ink/5 cursor-pointer
                focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
            >
              Add more PDFs
            </label>
            <input
              id={`${fileInputId}-more`}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={handleFileInputChange}
            />

            <button
              type="button"
              onClick={handleMerge}
              disabled={!canMerge}
              className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                hover:bg-accent-dark disabled:opacity-60
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {status === "merging" ? "Merging…" : "Merge PDFs"}
            </button>

            <button
              type="button"
              onClick={startOver}
              className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Start over
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
        </>
      )}

      {status === "done" && result && (
        <div className="rounded-xl border border-line p-5">
          <p className="font-display text-lg text-ink">Merged successfully</p>
          <p className="mt-1 text-sm text-ink/60 font-mono">
            merged.pdf · {formatBytes(result.bytes)} · {result.pageCount} page
            {result.pageCount === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={result.url}
              download="merged.pdf"
              className="min-h-[44px] inline-flex items-center px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                hover:bg-accent-dark
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={startOver}
              className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
