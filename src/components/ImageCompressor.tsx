"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  MAX_BATCH_SIZE,
  formatBytes,
  percentSaved,
  validateBatch,
  validateTargetSizeInput,
} from "@/lib/image-compressor/validation";
import type {
  OutputFormat,
  QueueItem,
  WorkerOutboundMessage,
} from "@/lib/image-compressor/types";

const OUTPUT_FORMATS: { id: OutputFormat; label: string }[] = [
  { id: "image/jpeg", label: "JPG" },
  { id: "image/png", label: "PNG" },
  { id: "image/webp", label: "WebP" },
];

function extensionFor(format: OutputFormat): string {
  switch (format) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function outputName(originalName: string, format: OutputFormat): string {
  const base = originalName.replace(/\.[^.]+$/, "");
  return `${base}-compressed.${extensionFor(format)}`;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ImageCompressorProps {
  /** Pre-fills and locks the tool into target-size mode at this KB value.
   * Used by the SEO preset pages (e.g. /compress-image-to-100kb). The user
   * can still change it — this only sets the initial state. */
  initialTargetKb?: number;
  /** Pre-selects an output format for format-specific landing pages
   * (e.g. /compress-jpeg). The user can still change it. */
  initialFormat?: OutputFormat;
}

export default function ImageCompressor({
  initialTargetKb,
  initialFormat,
}: ImageCompressorProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    initialFormat ?? "image/jpeg"
  );
  const [targetSizeEnabled, setTargetSizeEnabled] = useState(Boolean(initialTargetKb));
  const [targetSizeInput, setTargetSizeInput] = useState(
    initialTargetKb ? String(initialTargetKb) : ""
  );
  const [targetSizeError, setTargetSizeError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const itemsRef = useRef<QueueItem[]>([]);
  itemsRef.current = items;

  const dropzoneId = useId();
  const targetSizeInputId = useId();
  const fileInputId = useId();

  // --- Worker lifecycle -----------------------------------------------

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/image-compressor.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== message.id) return item;
          if (message.type === "progress") {
            return { ...item, status: "processing" };
          }
          if (message.type === "success") {
            const resultUrl = URL.createObjectURL(message.blob);
            return {
              ...item,
              status: "done",
              resultBlob: message.blob,
              resultUrl,
              resultBytes: message.resultBytes,
              targetAchieved: message.targetAchieved,
            };
          }
          // error
          return { ...item, status: "error", errorMessage: message.message };
        })
      );
    });

    worker.addEventListener("error", () => {
      // A worker-level (uncaught) error doesn't tell us which job failed,
      // so mark anything still queued/processing as failed rather than
      // leaving the UI stuck silently.
      setItems((prev) =>
        prev.map((item) =>
          item.status === "queued" || item.status === "processing"
            ? { ...item, status: "error", errorMessage: "Something went wrong processing this image." }
            : item
        )
      );
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Revoke every object URL on unmount.
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
    };
  }, []);

  // --- Compression dispatch --------------------------------------------

  const dispatch = useCallback(
    (item: QueueItem, compression: { kind: "quality"; quality: number } | { kind: "target-size"; targetBytes: number }) => {
      workerRef.current?.postMessage({
        type: "compress",
        job: {
          id: item.id,
          file: item.file,
          outputFormat,
          compression,
        },
      });
    },
    [outputFormat]
  );

  const compressAll = useCallback(
    (pending: QueueItem[]) => {
      if (pending.length === 0) return;

      let compression: { kind: "quality"; quality: number } | { kind: "target-size"; targetBytes: number };
      if (targetSizeEnabled) {
        const validated = validateTargetSizeInput(targetSizeInput);
        if (!validated.ok) {
          setTargetSizeError(validated.error);
          return;
        }
        setTargetSizeError(null);
        compression = { kind: "target-size", targetBytes: validated.bytes };
      } else {
        compression = { kind: "quality", quality: 0.8 };
      }

      setItems((prev) =>
        prev.map((item) =>
          pending.some((p) => p.id === item.id) ? { ...item, status: "processing" } : item
        )
      );
      for (const item of pending) {
        dispatch(item, compression);
      }
    },
    [dispatch, targetSizeEnabled, targetSizeInput]
  );

  // --- File intake -------------------------------------------------------

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const alreadyQueued = itemsRef.current.length;
      const room = Math.max(0, MAX_BATCH_SIZE - alreadyQueued);
      const { accepted, rejected, batchWarning: overflowWarning } = validateBatch(incoming);

      const trimmedAccepted = accepted.slice(0, room);
      const droppedForRoom =
        accepted.length > trimmedAccepted.length
          ? `Only ${room} more file${room === 1 ? "" : "s"} could be added — the batch limit is ${MAX_BATCH_SIZE}.`
          : undefined;

      const newItems: QueueItem[] = trimmedAccepted.map((file) => ({
        id: genId(),
        file,
        status: "queued",
        previewUrl: URL.createObjectURL(file),
        originalBytes: file.size,
      }));

      setItems((prev) => [...prev, ...newItems]);

      const warnings = [overflowWarning, droppedForRoom, ...rejected.map((r) => r.error)].filter(
        (w): w is string => Boolean(w)
      );
      setBatchWarning(warnings.length > 0 ? warnings.join(" ") : null);

      if (newItems.length > 0) {
        compressAll(newItems);
      }
    },
    [compressAll]
  );

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = ""; // allow re-selecting the same file later
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
  }

  // --- Item actions -------------------------------------------------------

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll() {
    for (const item of itemsRef.current) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    }
    setItems([]);
    setBatchWarning(null);
  }

  function recompressAll() {
    const all = itemsRef.current.filter((i) => i.status === "done" || i.status === "error");
    // Release previous results before re-running so we don't leak URLs.
    setItems((prev) =>
      prev.map((item) => {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        return { ...item, resultUrl: undefined, resultBlob: undefined, resultBytes: undefined, errorMessage: undefined };
      })
    );
    compressAll(all);
  }

  async function downloadAll() {
    const doneItems = itemsRef.current.filter((i) => i.status === "done" && i.resultBlob);
    if (doneItems.length === 0) return;
    setZipBusy(true);
    try {
      // Lazy-loaded so JSZip never touches the initial bundle — only users
      // who actually click "Download All" pay for it.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const item of doneItems) {
        zip.file(outputName(item.file.name, outputFormat), item.resultBlob as Blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed-images.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  // --- Derived state -------------------------------------------------------

  const doneCount = items.filter((i) => i.status === "done").length;
  const processingCount = items.filter((i) => i.status === "processing" || i.status === "queued").length;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      {/* Dropzone */}
      <div
        id={dropzoneId}
        role="button"
        tabIndex={0}
        aria-label="Drop images here or press Enter to choose files"
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
          ${
            isDragActive
              ? "border-accent bg-accent/[0.06]"
              : "border-line bg-surface hover:border-accent/40"
          }`}
      >
        <p className="font-display text-lg sm:text-xl text-ink">
          Compress images instantly — privately
        </p>
        <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
          Your images are processed entirely on your device. They never leave your browser.
        </p>
        <div className="mt-4">
          <span className="inline-flex min-h-[44px] items-center px-5 py-2.5 rounded-lg bg-accent text-paper font-semibold text-sm">
            Select images
          </span>
          <input
            id={fileInputId}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileInputChange}
          />
        </div>
        <p className="mt-3 text-xs text-ink/40">
          JPG, PNG, or WebP · up to 20 images · 50 MB each
        </p>
      </div>

      {batchWarning && (
        <p role="alert" className="mt-3 text-sm text-error">
          {batchWarning}
        </p>
      )}

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-ink/70 mb-1.5">Output format</legend>
          <div className="flex gap-2">
            {OUTPUT_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={outputFormat === f.id}
                onClick={() => setOutputFormat(f.id)}
                className={`min-h-[40px] px-3.5 rounded-lg text-sm border transition-colors
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                  ${
                    outputFormat === f.id
                      ? "bg-accent text-paper font-semibold border-accent"
                      : "border-line text-ink/70 hover:border-accent/40"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {outputFormat === "image/png" && (
            <p className="mt-1.5 text-xs text-ink/45 max-w-xs">
              PNG compression is lossless-optimized, not quality-based. For
              much smaller files, WebP usually produces better results.
            </p>
          )}
        </fieldset>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <input
              type="checkbox"
              checked={targetSizeEnabled}
              onChange={(e) => setTargetSizeEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Compress to a specific file size
          </label>
          {targetSizeEnabled && (
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor={targetSizeInputId} className="sr-only">
                Target size in kilobytes
              </label>
              <input
                id={targetSizeInputId}
                type="text"
                inputMode="decimal"
                value={targetSizeInput}
                onChange={(e) => {
                  setTargetSizeInput(e.target.value);
                  if (targetSizeError) setTargetSizeError(null);
                }}
                placeholder="100"
                aria-invalid={Boolean(targetSizeError)}
                aria-describedby={targetSizeError ? `${targetSizeInputId}-error` : undefined}
                className="w-24 rounded-lg border border-line px-3 py-2 text-sm font-mono bg-ink/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              />
              <span className="text-sm text-ink/60">KB</span>
            </div>
          )}
          {targetSizeError && (
            <p id={`${targetSizeInputId}-error`} role="alert" className="mt-1.5 text-xs text-error">
              {targetSizeError}
            </p>
          )}
        </div>
      </div>

      {/* Queue */}
      {items.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm text-ink/60">
              {processingCount > 0
                ? `Processing ${processingCount} of ${items.length}…`
                : `${doneCount} of ${items.length} compressed`}
            </p>
            <div className="flex gap-2">
              {doneCount > 1 && (
                <button
                  type="button"
                  onClick={downloadAll}
                  disabled={zipBusy}
                  className="min-h-[36px] px-3 text-sm rounded-lg bg-accent text-paper font-semibold
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {zipBusy ? "Zipping…" : "Download All"}
                </button>
              )}
              <button
                type="button"
                onClick={recompressAll}
                className="min-h-[36px] px-3 text-sm rounded-lg border border-line text-ink/80 hover:bg-ink/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Recompress
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="min-h-[36px] px-3 text-sm rounded-lg border border-line text-ink/80 hover:bg-ink/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Clear all
              </button>
            </div>
          </div>

          <ul className="mt-3 divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                {item.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover border border-line shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{item.file.name}</p>

                  {item.status === "queued" && (
                    <p className="text-xs text-ink/45">Waiting…</p>
                  )}
                  {item.status === "processing" && (
                    <p className="text-xs text-ink/45">Compressing…</p>
                  )}
                  {item.status === "error" && (
                    <p role="alert" className="text-xs text-error">
                      {item.errorMessage ?? "Something went wrong."}
                    </p>
                  )}
                  {item.status === "done" && item.resultBytes !== undefined && (
                    <p className="text-xs">
                      <span className="text-ink/60 font-mono">
                        {formatBytes(item.originalBytes)} → {formatBytes(item.resultBytes)}
                      </span>{" "}
                      <span className="text-result font-mono font-medium">
                        -{Math.max(0, percentSaved(item.originalBytes, item.resultBytes))}% saved
                      </span>
                      {item.targetAchieved === false && (
                        <span className="block text-ink/45 mt-0.5">
                          Couldn&apos;t reach your target size without excessive quality
                          loss — this is the smallest practical result.
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === "done" && item.resultUrl && (
                    <a
                      href={item.resultUrl}
                      download={outputName(item.file.name, outputFormat)}
                      className="min-h-[36px] inline-flex items-center px-3 text-sm rounded-lg bg-accent text-paper font-semibold
                        hover:bg-accent-dark
                        focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    >
                      Download
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-line text-ink/60 hover:text-ink hover:bg-ink/5
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
