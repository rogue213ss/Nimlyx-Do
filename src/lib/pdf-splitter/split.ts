// Core PDF split logic. Deliberately environment-agnostic — no DOM, no
// File/Blob APIs, just bytes in, bytes out — same pattern as
// pdf-merger/merge.ts, so this runs identically inside the Worker
// (production) and directly in Vitest under Node (tests), with pdf-lib
// doing the real structural work in both places.
//
// Like PDF Merger, this uses pdf-lib's `copyPages` (structural page
// copying), never rasterization — output pages retain their original
// text selectability, fonts, and links exactly as in the source file.

import { PDFDocument } from "pdf-lib";
import { rangeFileName, safeBaseName, singlePageFileName } from "./validation";
import type { SplitMode } from "./types";

export interface SplitOutput {
  bytes: Uint8Array;
  fileName: string;
  pageCount: number;
}

export type SplitProgressEvent =
  | { stage: "reading" }
  | { stage: "splitting"; index: number; total: number }
  | { stage: "finalizing" };

export type SplitResult =
  | { ok: true; files: SplitOutput[] }
  | { ok: false; error: string };

/**
 * Splits a PDF according to `mode`:
 * - "all-pages": one output PDF per page of the source document.
 * - "ranges": one output PDF per entry in `ranges`, each containing the
 *   given 1-indexed page numbers (already validated against the real
 *   page count by the caller via `parseSplitRanges`).
 */
export async function splitPdf(
  bytes: Uint8Array,
  fileBaseNameInput: string,
  mode: SplitMode,
  ranges: number[][] | undefined,
  onProgress?: (event: SplitProgressEvent) => void
): Promise<SplitResult> {
  onProgress?.({ stage: "reading" });

  let source: PDFDocument;
  try {
    source = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch {
    return { ok: false, error: "Couldn't read this PDF. It may be corrupt, password-protected, or unsupported." };
  }

  const pageCount = source.getPageCount();
  const baseName = safeBaseName(fileBaseNameInput);

  const groups: number[][] =
    mode === "all-pages" ? Array.from({ length: pageCount }, (_, i) => [i + 1]) : ranges ?? [];

  if (groups.length === 0) {
    return { ok: false, error: "No pages selected to split." };
  }
  for (const group of groups) {
    if (group.some((p) => p < 1 || p > pageCount)) {
      return { ok: false, error: "The requested page selection doesn't match this document." };
    }
  }

  const outputs: SplitOutput[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i] as number[];
    onProgress?.({ stage: "splitting", index: i + 1, total: groups.length });

    let bytesOut: Uint8Array;
    try {
      const out = await PDFDocument.create();
      const pageIndices = group.map((p) => p - 1);
      const copiedPages = await out.copyPages(source, pageIndices);
      for (const page of copiedPages) out.addPage(page);
      bytesOut = await out.save();
    } catch {
      return { ok: false, error: `Couldn't build the output file for page${group.length === 1 ? "" : "s"} ${group.join(", ")}.` };
    }

    outputs.push({
      bytes: bytesOut,
      fileName: mode === "all-pages" ? singlePageFileName(baseName, group[0] as number) : rangeFileName(baseName, group),
      pageCount: group.length,
    });

    // Yield between outputs so a large split (many pages/ranges) never
    // blocks the worker thread continuously.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onProgress?.({ stage: "finalizing" });
  return { ok: true, files: outputs };
}
