"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatBytes } from "@/lib/image-compressor/validation";
import { looksLikePdfContent, validateFileMeta } from "@/lib/pdf-merger/validation";
import { parseSplitRanges } from "@/lib/pdf-splitter/validation";
import type { SplitMode, WorkerOutboundMessage } from "@/lib/pdf-splitter/types";

type Status = "empty" | "ready" | "splitting" | "done" | "error";

interface ResultFile {
  url: string;
  bytes: number;
  fileName: string;
  pageCount: number;
}

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [mode, setMode] = useState<SplitMode>("all-pages");
  const [rangesInput, setRangesInput] = useState("");
  const [rangesError, setRangesError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("empty");
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultFiles, setResultFiles] = useState<ResultFile[]>([]);
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
    const worker = new Worker(new URL("../workers/pdf-splitter.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.addEventListener("message", (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        if (message.stage === "reading") setStageLabel("Reading PDF…");
        else if (message.stage === "splitting") setStageLabel(`Creating file ${message.index} of ${message.total}…`);
        else setStageLabel("Finalizing…");
        return;
      }
      if (message.type === "success") {
        revokeAllResultUrls();
        const files: ResultFile[] = message.files.map((f) => {
          const blob = new Blob([f.bytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          resultUrlsRef.current.push(url);
          return { url, bytes: blob.size, fileName: f.fileName, pageCount: f.pageCount };
        });
        setResultFiles(files);
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
      setErrorMessage("Something went wrong splitting this PDF.");
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
      // Lazy-loaded, same discipline as PDF Merger and PDF to JPG: only
      // used here on the main thread to report a page count up front.
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
      const count = doc.getPageCount();
      setPageCount(count);
      if (count <= 1) {
        setFileError("This PDF only has one page, so there's nothing to split.");
      } else {
        setStatus("ready");
      }
      setReading(false);
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
    setResultFiles([]);
    setErrorMessage(null);
    setRangesError(null);
  }

  function startOver() {
    resetResults();
    setFile(null);
    setPageCount(null);
    setFileError(null);
    setReading(false);
    setStatus("empty");
    setStageLabel(null);
    setMode("all-pages");
    setRangesInput("");
  }

  async function handleSplit() {
    if (!file || pageCount === null) return;

    let ranges: number[][] | undefined;
    if (mode === "ranges") {
      const parsed = parseSplitRanges(rangesInput, pageCount);
      if (!parsed.ok) {
        setRangesError(parsed.error);
        return;
      }
      ranges = parsed.groups;
    }
    setRangesError(null);

    resetResults();
    setStatus("splitting");
    setStageLabel("Reading PDF…");

    const buffer = await file.arrayBuffer();
    workerRef.current?.postMessage(
      { type: "split", job: { buffer, fileBaseName: file.name, mode, ranges } },
      [buffer]
    );
  }

  async function downloadAllAsZip() {
    if (resultFiles.length === 0) return;
    setZipBusy(true);
    try {
      // Lazy-loaded, same pattern used by Image Compressor and PDF to JPG.
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const f of resultFiles) {
        const blob = await fetch(f.url).then((r) => r.blob());
        zip.file(f.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file?.name.replace(/\.pdf$/i, "") || "split"}-pdfs.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  const canSplit = Boolean(file) && !reading && !fileError && status !== "splitting" && pageCount !== null && pageCount > 1;

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
          <p className="font-display text-lg sm:text-xl text-ink">Split a PDF</p>
          <p className="mt-2 text-sm text-ink/60 max-w-prose mx-auto">
            Split a PDF into separate files by page or custom ranges — directly in your browser.
            Your file is processed entirely on your device.
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

          {!fileError && pageCount !== null && pageCount > 1 && (
            <div className="mt-4 space-y-5">
              <fieldset>
                <legend className="text-sm font-medium text-ink mb-2">Split into</legend>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`min-h-[44px] flex flex-col justify-center px-3.5 py-1.5 rounded-lg border cursor-pointer text-sm
                      focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                      ${mode === "all-pages" ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      className="sr-only"
                      checked={mode === "all-pages"}
                      onChange={() => setMode("all-pages")}
                    />
                    <span className="font-medium">Individual pages</span>
                    <span className="text-xs text-ink/50">One PDF per page ({pageCount} files)</span>
                  </label>
                  <label
                    className={`min-h-[44px] flex flex-col justify-center px-3.5 py-1.5 rounded-lg border cursor-pointer text-sm
                      focus-within:outline focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2
                      ${mode === "ranges" ? "border-accent bg-accent/[0.06] text-ink" : "border-line text-ink/70 hover:bg-ink/5"}`}
                  >
                    <input
                      type="radio"
                      name="split-mode"
                      className="sr-only"
                      checked={mode === "ranges"}
                      onChange={() => setMode("ranges")}
                    />
                    <span className="font-medium">Custom ranges</span>
                    <span className="text-xs text-ink/50">Choose your own page groups</span>
                  </label>
                </div>

                {mode === "ranges" && (
                  <div className="mt-2">
                    <label htmlFor="split-ranges-input" className="sr-only">
                      Page ranges
                    </label>
                    <input
                      id="split-ranges-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1-3, 4-6, 10"
                      value={rangesInput}
                      onChange={(e) => setRangesInput(e.target.value)}
                      className="min-h-[44px] w-full sm:w-72 rounded-lg border border-line px-3 text-sm bg-surface text-ink
                        focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                    />
                    <p className="mt-1 text-xs text-ink/50">
                      Each comma-separated group becomes its own PDF file — &quot;1-3, 4-6, 10&quot; makes
                      three files.
                    </p>
                    {rangesError && (
                      <p role="alert" className="text-xs text-error mt-1">
                        {rangesError}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSplit}
                  disabled={!canSplit}
                  className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {status === "splitting" ? "Splitting…" : "Split PDF"}
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
              <p className="font-display text-lg text-ink">Split complete</p>
              <p className="mt-1 text-sm text-ink/60 font-mono">
                {resultFiles.length} file{resultFiles.length === 1 ? "" : "s"} created
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {resultFiles.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  disabled={zipBusy}
                  className="min-h-[44px] px-5 rounded-lg bg-accent text-paper font-semibold text-sm
                    hover:bg-accent-dark disabled:opacity-60
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  {zipBusy ? "Zipping…" : "Download All PDFs"}
                </button>
              )}
              <button
                type="button"
                onClick={startOver}
                className="min-h-[44px] px-4 rounded-lg border border-line text-ink/70 font-medium text-sm hover:bg-ink/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Split another PDF
              </button>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-line">
            {resultFiles.map((f) => (
              <li key={f.fileName} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{f.fileName}</p>
                  <p className="text-xs text-ink/50 font-mono">
                    {f.pageCount} page{f.pageCount === 1 ? "" : "s"} · {formatBytes(f.bytes)}
                  </p>
                </div>
                <a
                  href={f.url}
                  download={f.fileName}
                  className="min-h-[36px] shrink-0 inline-flex items-center justify-center px-3.5 rounded-lg border border-line text-xs font-medium text-ink/80 hover:bg-ink/5
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
