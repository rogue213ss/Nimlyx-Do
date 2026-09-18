"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "@/lib/image-compressor/validation";
import { looksLikePdfContent, validateFileMeta } from "@/lib/pdf-merger/validation";
import { parsePageRange } from "@/lib/pdf-to-jpg/validation";
import type { JpgQuality, Resolution, WorkerOutboundMessage } from "@/lib/pdf-to-jpg/types";

const QUALITY_OPTIONS: { id: JpgQuality; label: string; description: string }[] = [
  { id: "high", label: "High", description: "Best detail, larger files" },
  { id: "recommended", label: "Recommended", description: "Balanced size and quality" },
  { id: "small", label: "Small", description: "Smallest files, more compression" },
];

const RESOLUTION_OPTIONS: { id: Resolution; label: string; description: string }[] = [
  { id: "standard", label: "Standard", description: "Good for screens" },
  { id: "high", label: "High", description: "Sharper, larger images" },
  { id: "very-high", label: "Very High", description: "Best for printing or zooming" },
];

type Status = "empty" | "ready" | "converting" | "done" | "error";
type PageSelectionMode = "all" | "range";

interface ResultPage {
  pageNumber: number;
  url: string;
  bytes: number;
  fileName: string;
  width: number;
  height: number;
}

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [quality, setQuality] = useState<JpgQuality>("recommended");
  const [resolution, setResolution] = useState<Resolution>("standard");
  const [selectionMode, setSelectionMode] = useState<PageSelectionMode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("empty");
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultPages, setResultPages] = useState<ResultPage[]>([]);
  const [zipBusy, setZipBusy] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const resultUrlsRef = useRef<string[]>([]);
  const fileInputId = useId();

  function revokeAllResultUrls() {
    for (const url of resultUrlsRef.current) URL.revokeObjectURL(url);
    resultUrlsRef.current = [];
  }

  useEffect(() => {
    const worker = new Worker(new URL("../workers/pdf-to-jpg.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.stage === "reading") setStageLabel("Reading PDF…");
        else if (message.stage === "preparing") setStageLabel("Preparing pages…");
        else if (message.stage === "converting-page") {
          setStageLabel(`Converting page ${message.index} of ${message.total}…`);
        } else setStageLabel("Preparing downloads…");
        return;
      }
      if (message.type === "page") {
        const blob = new Blob([message.page.bytes], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        resultUrlsRef.current.push(url);
        setResultPages((prev) =>
          [
            ...prev,
            {
              pageNumber: message.page.pageNumber,
              url,
              bytes: blob.size,
              fileName: message.page.fileName,
              width: message.page.width,
              height: message.page.height,
            },
          ].sort((a, b) => a.pageNumber - b.pageNumber)
        );
        return;
      }
      if (message.type === "success") {
        setStatus("done");
        setStageLabel(null);
        return;
      }
      // error
      setErrorMessage(message.message);
      setStatus("error");
      setStageLabel(null);
    });

    worker.addEventListener("error", () => {
      setErrorMessage("Something went wrong converting this PDF.");
      setStatus("error");
      setStageLabel(null);
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => () => revokeAllResultUrls(), []);

  async function inspectFile(f: File) {
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await f.arrayBuffer());
    } catch {
      setFileError("Couldn't read this file.");
      setReading(false);
      return;
    }
    if (!looksLikePdfContent(bytes)) {
      setFileError("This doesn't look like a valid PDF file.");
      setReading(false);
      return;
    }
    try {
      // Lazy-loaded, same discipline as PDF Merger: pdf-lib is only used
      // here on the main thread to report a page count up front; actual
      // conversion runs in the worker via pdfjs-dist.
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      setPageCount(doc.getPageCount());
      setReading(false);
      setStatus("ready");
    } catch {
      setFileError("Couldn't read this PDF. It may be corrupt or password-protected.");
      setReading(false);
    }
  }

  function selectFile(f: File) {
    const metaResult = validateFileMeta(f);
    resetResults();
    setFile(f);
    setPageCount(null);
    setFileError(metaResult.ok ? null : metaResult.error);
    setStatus("empty");
    if (metaResult.ok) {
      setReading(true);
      void inspectFile(f);
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) selectFile(e.target.files[0] as File);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) selectFile(e.dataTransfer.files[0] as File);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
  }

  function resetResults() {
    revokeAllResultUrls();
    setResultPages([]);
    setErrorMessage(null);
    setRangeError(null);
  }

  function startOver() {
    resetResults();
    setFile(null);
    setPageCount(null);
    setFileError(null);
    setReading(false);
    setStatus("empty");
    setStageLabel(null);
    setSelectionMode("all");
    setRangeInput("");
  }

  async function handleConvert() {
    if (!file || pageCount === null) return;

    let pages: number[] | undefined;
    if (selectionMode === "range") {
      const parsed = parsePageRange(rangeInput, pageCount);
      if (!parsed.ok) {
        setRangeError(parsed.error);
        return;
      }
      pages = parsed.pages;
    }
    setRangeError(null);

    resetResults();
    setStatus("converting");
    setStageLabel("Reading PDF…");

    const buffer = await file.arrayBuffer();
    workerRef.current?.postMessage(
      {
        type: "convert",
        job: {
          buffer,
          fileBaseName: file.name,
          options: { quality, resolution, pages },
        },
      },
      [buffer]
    );
  }

  async function downloadAllAsZip() {
    if (resultPages.length === 0) return;
    setZipBusy(true);
    try {
      // Lazy-loaded, same pattern as Image Compressor's "Download All" —
      // JSZip only loads for users who actually click this, and the ZIP
      // is assembled entirely in the browser from the already-generated
      // JPEG blobs (no re-upload, no server involvement).
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const page of resultPages) {
        const blob = await fetch(page.url).then((r) => r.blob());
        zip.file(page.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file?.name.replace(/\.pdf$/i, "") || "pages"}-jpg.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  const canConvert = Boolean(file) && !reading && !fileError && status !== "converting" && pageCount !== null;

  return (
    <div className="rounded-2xl border border-line bg-paper p-3 sm:p-4">
      {!file && (
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
          <p className="font-display text-lg sm:text-xl text-ink">Convert PDF to JPG</p>
          <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
            Convert PDF pages into JPG images directly in your browser. Your file is processed
            entirely on your device — it never leaves your browser.
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

      {file && status !== "done" && (
        <>
          <div className="flex items-center gap-3 py-3 border-b border-line">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink truncate">{file.name}</p>
              <p className="text-xs text-ink/50 font-mono">
                {formatBytes(file.size)}
                {reading && " · Reading…"}
                {!reading && pageCount !== null && ` · ${pageCount} page${pageCount === 1 ? "" : "s"}`}
              </p>
              {fileError && (
                <p role="alert" className="text-xs text-error mt-0.5">
                  {fileError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={startOver}
              aria-label="Remove file"
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-line text-ink/60 hover:text-ink hover:bg-ink/5 shrink-0
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
            >
              ✕
            </button>
          </div>

          {!fileError && pageCount !== null && (
            <div className="mt-4 space-y-5">
              {/* JPG Quality */}
              <fieldset>
                <legend className="text-sm font-medium text-ink mb-2">JPG Quality</legend>
                <div className="flex flex-wrap gap-2">
                  {QUALITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`min-h-[44px] flex flex-col justify-center px-3.5 py-1.5 rounded-lg border cursor-pointer text-sm
                        focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                        ${quality === opt.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                    >
                      <input
                        type="radio"
                        name="quality"
                        className="sr-only"
                        checked={quality === opt.id}
                        onChange={() => setQuality(opt.id)}
                      />
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-ink/50">{opt.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Resolution */}
              <fieldset>
                <legend className="text-sm font-medium text-ink mb-2">Resolution</legend>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTION_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`min-h-[44px] flex flex-col justify-center px-3.5 py-1.5 rounded-lg border cursor-pointer text-sm
                        focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                        ${resolution === opt.id ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        className="sr-only"
                        checked={resolution === opt.id}
                        onChange={() => setResolution(opt.id)}
                      />
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-ink/50">{opt.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Page selection */}
              {pageCount > 1 && (
                <fieldset>
                  <legend className="text-sm font-medium text-ink mb-2">Pages</legend>
                  <div className="flex flex-wrap gap-2">
                    <label
                      className={`min-h-[44px] inline-flex items-center px-3.5 rounded-lg border cursor-pointer text-sm
                        focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                        ${selectionMode === "all" ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                    >
                      <input
                        type="radio"
                        name="page-selection"
                        className="sr-only"
                        checked={selectionMode === "all"}
                        onChange={() => setSelectionMode("all")}
                      />
                      All pages
                    </label>
                    <label
                      className={`min-h-[44px] inline-flex items-center px-3.5 rounded-lg border cursor-pointer text-sm
                        focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                        ${selectionMode === "range" ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                    >
                      <input
                        type="radio"
                        name="page-selection"
                        className="sr-only"
                        checked={selectionMode === "range"}
                        onChange={() => setSelectionMode("range")}
                      />
                      Choose pages
                    </label>
                  </div>
                  {selectionMode === "range" && (
                    <div className="mt-2">
                      <label htmlFor="page-range-input" className="sr-only">
                        Pages to convert
                      </label>
                      <input
                        id="page-range-input"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 1-3, 5, 8"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        className="min-h-[44px] w-full sm:w-64 rounded-lg border border-line px-3 text-sm bg-surface text-ink
                          focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                      />
                      {rangeError && (
                        <p role="alert" className="text-xs text-error mt-1">
                          {rangeError}
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!canConvert}
                  className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {status === "converting" ? "Converting…" : "Convert to JPG"}
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

              <p aria-live="polite" className="text-sm text-ink/60">
                {stageLabel ?? ""}
                {status === "converting" && resultPages.length > 0 && ` · ${resultPages.length} page${resultPages.length === 1 ? "" : "s"} converted`}
              </p>

              {status === "error" && errorMessage && (
                <p role="alert" className="text-sm text-error">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {status === "done" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="font-display text-lg text-ink">Conversion complete</p>
              <p className="mt-1 text-sm text-ink/60 font-mono">
                {resultPages.length} page{resultPages.length === 1 ? "" : "s"} converted
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resultPages.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  disabled={zipBusy}
                  className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {zipBusy ? "Zipping…" : "Download All JPGs"}
                </button>
              )}
              <button
                type="button"
                onClick={startOver}
                className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Convert another PDF
              </button>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {resultPages.map((page) => (
              <li key={page.pageNumber} className="rounded-lg border border-line overflow-hidden bg-surface">
                {/* next/image can't optimize a blob: object URL, and these
                    previews are ephemeral, in-memory generated images —
                    same justified exception as ImageCompressor's own
                    preview. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.url}
                  alt={`Page ${page.pageNumber} of ${file?.name ?? "the PDF"}, converted to JPG`}
                  className="w-full h-auto block"
                  width={page.width}
                  height={page.height}
                />
                <div className="p-2">
                  <p className="text-xs text-ink/60 font-mono truncate">
                    Page {page.pageNumber} · {formatBytes(page.bytes)}
                  </p>
                  <a
                    href={page.url}
                    download={page.fileName}
                    className="mt-1 min-h-[36px] inline-flex items-center justify-center w-full rounded-md border border-line text-xs font-medium text-ink/80 hover:bg-ink/5
                      focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
