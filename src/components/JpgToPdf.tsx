"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "@/lib/image-compressor/validation";
import { detectImageKind, moveDown, moveUp, safeBaseName, validateBatchMeta } from "@/lib/jpg-to-pdf/validation";
import type { ImageKind, PageSizeMode, WorkerOutboundMessage } from "@/lib/jpg-to-pdf/types";

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  kind?: ImageKind;
  error?: string;
  reading: boolean;
}

type Status = "idle" | "converting" | "done" | "error";

interface ResultState {
  url: string;
  bytes: number;
  pageCount: number;
  fileName: string;
}

const PAGE_SIZE_OPTIONS: { id: PageSizeMode; label: string; description: string }[] = [
  { id: "fit-image", label: "Fit to image", description: "Page matches each image's own size" },
  { id: "a4", label: "A4", description: "Standard international size" },
  { id: "letter", label: "Letter", description: "Standard US size" },
];

export default function JpgToPdf() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeMode>("fit-image");
  const [status, setStatus] = useState<Status>("idle");
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const itemsRef = useRef<ImageItem[]>([]);
  itemsRef.current = items;
  const resultUrlRef = useRef<string | null>(null);

  const dropzoneId = useId();
  const fileInputId = useId();

  useEffect(() => {
    const worker = new Worker(new URL("../workers/jpg-to-pdf.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.stage === "embedding") setStageLabel(`Adding image ${message.index} of ${message.total}…`);
        else setStageLabel("Finalizing PDF…");
        return;
      }
      if (message.type === "success") {
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const blob = new Blob([message.bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        const baseName = itemsRef.current.length === 1 ? safeBaseName(itemsRef.current[0]!.file.name) : "images";
        setResult({ url, bytes: blob.size, pageCount: message.pageCount, fileName: `${baseName}.pdf` });
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
              ? { ...item, error: "Couldn't add this image — see the message above." }
              : item
          )
        );
      }
    });

    worker.addEventListener("error", () => {
      setErrorMessage("Something went wrong creating this PDF.");
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
      for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  const inspectFile = useCallback(async (id: string, file: File) => {
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, reading: false, error: "Couldn't read this file." } : item)));
      return;
    }
    const kind = detectImageKind(bytes);
    if (!kind) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, reading: false, error: "This doesn't look like a valid JPG or PNG image." } : item))
      );
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, reading: false, kind } : item)));
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const { accepted, rejected, batchWarning: overflowWarning } = validateBatchMeta(itemsRef.current.length, incoming);

      const newItems: ImageItem[] = accepted.map((file) => ({
        id: genId(),
        file,
        previewUrl: URL.createObjectURL(file),
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

      for (const item of newItems) void inspectFile(item.id, item.file);
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
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function moveItemUp(index: number) {
    setItems((prev) => moveUp(prev, index));
  }

  function moveItemDown(index: number) {
    setItems((prev) => moveDown(prev, index));
  }

  function startOver() {
    for (const item of itemsRef.current) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setStatus("idle");
    setStageLabel(null);
    setErrorMessage(null);
    setBatchWarning(null);
    setPageSize("fit-image");
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
  }

  async function handleConvert() {
    const validItems = itemsRef.current.filter((i) => !i.error && !i.reading && i.kind);
    if (validItems.length === 0) return;

    setErrorMessage(null);
    setStatus("converting");
    setStageLabel("Preparing images…");

    const images = await Promise.all(
      validItems.map(async (item) => ({
        name: item.file.name,
        bytes: await item.file.arrayBuffer(),
        kind: item.kind as ImageKind,
      }))
    );

    const outputFileName = validItems.length === 1 ? `${safeBaseName(validItems[0]!.file.name)}.pdf` : "images.pdf";

    workerRef.current?.postMessage(
      { type: "convert", job: { images, pageSize, outputFileName } },
      images.map((img) => img.bytes)
    );
  }

  const validCount = items.filter((i) => !i.error && !i.reading).length;
  const stillReading = items.some((i) => i.reading);
  const canConvert = validCount >= 1 && status !== "converting" && !stillReading;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      {items.length === 0 && (
        <div
          id={dropzoneId}
          role="button"
          tabIndex={0}
          aria-label="Drop JPG or PNG images here or press Enter to choose files"
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
          <p className="font-display text-lg sm:text-xl text-ink">Convert JPG to PDF</p>
          <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
            Turn one or more JPG or PNG images into a single PDF, directly in your browser. Your
            images are processed entirely on your device — they never leave your browser.
          </p>
          <div className="mt-4">
            <span className="inline-flex min-h-[44px] items-center px-5 py-2.5 rounded-lg bg-accent text-paper font-semibold text-sm">
              Select images
            </span>
            <input
              id={fileInputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileInputChange}
            />
          </div>
          <p className="mt-3 text-xs text-ink/40">Up to 50 images · 50 MB each</p>
        </div>
      )}

      {batchWarning && (
        <p role="alert" className="mt-3 text-sm text-error">
          {batchWarning}
        </p>
      )}

      {items.length > 0 && status !== "done" && (
        <>
          <fieldset className="mb-4">
            <legend className="text-sm font-medium text-ink mb-2">Page size</legend>
            <div className="flex flex-wrap gap-2">
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`min-h-[44px] flex flex-col justify-center px-3.5 py-1.5 rounded-lg border cursor-pointer text-sm
                    focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                    ${pageSize === opt.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                >
                  <input
                    type="radio"
                    name="page-size"
                    className="sr-only"
                    checked={pageSize === opt.id}
                    onChange={() => setPageSize(opt.id)}
                  />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-ink/50">{opt.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

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

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-12 h-12 object-cover rounded border border-line shrink-0 bg-surface"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">
                    <span className="text-ink/40 font-mono mr-1.5">{index + 1}.</span>
                    {item.file.name}
                  </p>
                  <p className="text-xs text-ink/50 font-mono">
                    {formatBytes(item.file.size)}
                    {item.reading && " · Reading…"}
                    {!item.reading && item.kind && ` · ${item.kind.toUpperCase()}`}
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
              Add more images
            </label>
            <input
              id={`${fileInputId}-more`}
              type="file"
              multiple
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileInputChange}
            />

            <button
              type="button"
              onClick={handleConvert}
              disabled={!canConvert}
              className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                hover:bg-accent-dark disabled:opacity-60
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              {status === "converting" ? "Converting…" : "Convert to PDF"}
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
          <p className="font-display text-lg text-ink">PDF created</p>
          <p className="mt-1 text-sm text-ink/60 font-mono">
            {result.fileName} · {formatBytes(result.bytes)} · {result.pageCount} page{result.pageCount === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={result.url}
              download={result.fileName}
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
