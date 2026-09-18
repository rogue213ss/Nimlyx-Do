"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  formatBytes,
  percentSaved,
  validateFile,
} from "@/lib/image-compressor/validation";
import type { OutputFormat } from "@/lib/image-compressor/types";
import {
  deriveLockedDimension,
  parseDimensionInput,
  resolveTargetDimensions,
} from "@/lib/image-resizer/dimensions";
import type { ResizerOutboundMessage } from "@/lib/image-resizer/types";

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
  return `${base}-resized.${extensionFor(format)}`;
}

type Stage =
  | "idle"
  | "reading"
  | "configuring"
  | "resizing"
  | "encoding"
  | "done"
  | "error";

const STAGE_ANNOUNCEMENT: Partial<Record<Stage, string>> = {
  reading: "Reading image…",
  resizing: "Resizing…",
  encoding: "Encoding…",
  done: "Resize complete.",
};

interface ResultState {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const fileInputId = useId();
  const widthInputId = useId();
  const heightInputId = useId();

  // --- Worker lifecycle -----------------------------------------------

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/image-resizer.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<ResizerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        setStage(message.stage);
        return;
      }
      if (message.type === "success") {
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        const url = URL.createObjectURL(message.blob);
        resultUrlRef.current = url;
        setResult({ url, width: message.width, height: message.height, bytes: message.resultBytes });
        setStage("done");
        return;
      }
      setErrorMessage(message.message);
      setStage("error");
    });

    worker.addEventListener("error", () => {
      setErrorMessage("Something went wrong resizing this image.");
      setStage("error");
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

  // --- File intake -------------------------------------------------------

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!selected) return;

    const validation = validateFile(selected);
    if (!validation.ok) {
      setFile(null);
      setResult(null);
      setErrorMessage(validation.error);
      setStage("error");
      return;
    }

    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);
    setErrorMessage(null);
    setFieldError(null);
    setFile(selected);
    setOriginalWidth(null);
    setOriginalHeight(null);
    setStage("reading");

    // Dimensions are read directly on the main thread: it's a cheap,
    // one-shot decode purely to report width/height, so there's no benefit
    // to a worker round-trip for it. The actual resize+encode work (the
    // expensive part) still goes through the worker below.
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(selected, { imageOrientation: "from-image" });
    } catch {
      setErrorMessage(
        "This image couldn't be read. It may be corrupt or an unsupported variant of its format."
      );
      setStage("error");
      return;
    }
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();

    setOriginalWidth(w);
    setOriginalHeight(h);
    setWidthInput(String(w));
    setHeightInput(String(h));
    setStage("configuring");
  }

  // --- Dimension field handling --------------------------------------------

  function handleWidthChange(raw: string) {
    setWidthInput(raw);
    setFieldError(null);
    if (lockAspectRatio && originalWidth && originalHeight) {
      const parsed = parseDimensionInput(raw);
      if (parsed.ok && parsed.value !== undefined) {
        setHeightInput(String(deriveLockedDimension(originalWidth, originalHeight, "width", parsed.value)));
      }
    }
  }

  function handleHeightChange(raw: string) {
    setHeightInput(raw);
    setFieldError(null);
    if (lockAspectRatio && originalWidth && originalHeight) {
      const parsed = parseDimensionInput(raw);
      if (parsed.ok && parsed.value !== undefined) {
        setWidthInput(String(deriveLockedDimension(originalWidth, originalHeight, "height", parsed.value)));
      }
    }
  }

  function toggleLockAspectRatio() {
    setLockAspectRatio((prev) => {
      const next = !prev;
      // Re-sync height to the current width immediately on locking, so the
      // fields aren't left in a stale, now-inconsistent state.
      if (next && originalWidth && originalHeight) {
        const parsed = parseDimensionInput(widthInput);
        if (parsed.ok && parsed.value !== undefined) {
          setHeightInput(String(deriveLockedDimension(originalWidth, originalHeight, "width", parsed.value)));
        }
      }
      return next;
    });
  }

  // --- Resize dispatch -------------------------------------------------

  function handleResize() {
    if (!file || originalWidth === null || originalHeight === null) return;

    const widthParsed = parseDimensionInput(widthInput);
    if (!widthParsed.ok) {
      setFieldError(widthParsed.error);
      return;
    }
    const heightParsed = parseDimensionInput(heightInput);
    if (!heightParsed.ok) {
      setFieldError(heightParsed.error);
      return;
    }

    const resolved = resolveTargetDimensions({
      originalWidth,
      originalHeight,
      targetWidth: widthParsed.value,
      targetHeight: heightParsed.value,
      lockAspectRatio,
    });
    if (!resolved.ok) {
      setFieldError(resolved.error);
      return;
    }

    setFieldError(null);
    setResult(null);
    setErrorMessage(null);
    setStage("resizing");
    workerRef.current?.postMessage({
      type: "resize",
      job: { file, width: resolved.width, height: resolved.height, outputFormat },
    });
  }

  const isBusy = stage === "reading" || stage === "resizing" || stage === "encoding";
  const hasDimensions = originalWidth !== null && originalHeight !== null;
  const savings = result && file ? percentSaved(file.size, result.bytes) : null;
  const announcement = stage === "error" ? errorMessage ?? "Something went wrong." : STAGE_ANNOUNCEMENT[stage];

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      <div className="rounded-xl border-2 border-dashed border-line bg-surface p-6 sm:p-8 text-center">
        <p className="font-display text-lg sm:text-xl text-ink">Resize an image — privately</p>
        <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
          Your image is processed entirely on your device. It never leaves your browser.
        </p>
        <div className="mt-4">
          <label
            htmlFor={fileInputId}
            className="inline-flex min-h-[44px] items-center px-5 py-2.5 rounded-lg bg-accent text-paper font-semibold text-sm cursor-pointer
              focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2"
          >
            Select image
          </label>
          <input
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
        <p className="mt-3 text-xs text-ink/40">JPG, PNG, or WebP · up to 50 MB</p>
      </div>

      {/* Single live region for stage/status announcements — screen-reader
          only, since the visible states below already communicate the same
          thing visually. */}
      <p aria-live="polite" className="sr-only">
        {announcement ?? ""}
      </p>

      {file && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-ink/80 truncate max-w-[16rem]">{file.name}</span>
            {hasDimensions && (
              <span className="font-mono text-ink/50">
                {originalWidth} × {originalHeight}px · {formatBytes(file.size)}
              </span>
            )}
          </div>

          {stage === "reading" && <p className="mt-3 text-sm text-ink/60">Reading image…</p>}

          {hasDimensions && (
            <>
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor={widthInputId} className="block text-sm font-medium text-ink/70 mb-1.5">
                    Width (px)
                  </label>
                  <input
                    id={widthInputId}
                    type="text"
                    inputMode="numeric"
                    value={widthInput}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? "resize-field-error" : undefined}
                    className="w-28 rounded-lg border border-line px-3 py-2 text-sm font-mono bg-ink/5
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={toggleLockAspectRatio}
                  aria-pressed={lockAspectRatio}
                  aria-label={
                    lockAspectRatio
                      ? "Aspect ratio locked. Activate to unlock and set width and height independently."
                      : "Aspect ratio unlocked. Activate to lock and resize proportionally."
                  }
                  className={`min-h-[44px] min-w-[44px] rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                    ${lockAspectRatio ? "bg-accent/10 border-accent text-accent" : "border-line text-ink/60 hover:border-accent/40"}`}
                >
                  <span aria-hidden="true">{lockAspectRatio ? "🔒" : "🔓"}</span>
                  <span className="hidden sm:inline">{lockAspectRatio ? "Locked" : "Unlocked"}</span>
                </button>

                <div>
                  <label htmlFor={heightInputId} className="block text-sm font-medium text-ink/70 mb-1.5">
                    Height (px)
                  </label>
                  <input
                    id={heightInputId}
                    type="text"
                    inputMode="numeric"
                    value={heightInput}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? "resize-field-error" : undefined}
                    className="w-28 rounded-lg border border-line px-3 py-2 text-sm font-mono bg-ink/5
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  />
                </div>
              </div>

              {fieldError && (
                <p id="resize-field-error" role="alert" className="mt-2 text-sm text-error">
                  {fieldError}
                </p>
              )}

              <fieldset className="mt-5">
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
              </fieldset>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleResize}
                  disabled={isBusy}
                  className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {stage === "resizing" ? "Resizing…" : stage === "encoding" ? "Encoding…" : "Resize image"}
                </button>
              </div>
            </>
          )}

          {stage === "error" && errorMessage && (
            <p role="alert" className="mt-3 text-sm text-error">
              {errorMessage}
            </p>
          )}

          {stage === "done" && result && (
            <div className="mt-6 rounded-xl border border-line p-4">
              <p className="text-sm">
                <span className="font-mono text-ink">
                  {result.width} × {result.height}px
                </span>{" "}
                <span className="text-ink/30">·</span>{" "}
                <span className="font-mono text-ink/60">{formatBytes(result.bytes)}</span>
                {savings !== null && (
                  <span className="ml-2 font-mono font-medium text-result">
                    {savings >= 0 ? `-${savings}%` : `+${Math.abs(savings)}%`} vs original
                  </span>
                )}
              </p>
              <a
                href={result.url}
                download={outputName(file.name, outputFormat)}
                className="mt-3 inline-flex min-h-[44px] items-center px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                  hover:bg-accent-dark
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Download
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
