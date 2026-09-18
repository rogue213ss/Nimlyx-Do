// Orchestration logic for PDF → JPG: decides which pages to convert, in
// what order, drives progress events, and assembles filenames/results.
// The actual pixel-rendering is injected (see `PdfOpener`) so this module
// has no dependency on pdfjs-dist, OffscreenCanvas, or any browser API —
// it can run identically in the Worker (with the real opener from
// render.ts) and in Vitest under Node (with a synthetic fake), the same
// "environment-agnostic core, real integration test" pattern used by
// lib/pdf-merger/merge.ts.

import { JPG_QUALITY_VALUE, RESOLUTION_SCALE, type PdfToJpgOptions } from "./types";
import { pageFileName, safeBaseName } from "./validation";

export interface RenderedPageResult {
  bytes: ArrayBuffer;
  width: number;
  height: number;
}

/** Shape of a PDF opened for rendering — implemented for real by
 * render.ts (pdfjs-dist + OffscreenCanvas) and by a synthetic fake in
 * tests. Kept minimal on purpose. */
export interface OpenedPdf {
  pageCount: number;
  renderPage: (pageNumber: number, scale: number, quality: number) => Promise<RenderedPageResult>;
  destroy: () => void;
}

export type PdfOpener = (bytes: Uint8Array) => Promise<OpenedPdf>;

export interface ConvertedPageOutput {
  pageNumber: number;
  bytes: ArrayBuffer;
  fileName: string;
  width: number;
  height: number;
}

export type ConvertProgressEvent =
  | { stage: "reading" }
  | { stage: "preparing"; totalPages: number }
  | { stage: "converting-page"; index: number; total: number }
  | { stage: "preparing-downloads" };

export type ConvertResult =
  | { ok: true; pages: ConvertedPageOutput[] }
  | { ok: false; error: string };

/**
 * Converts the requested pages of a PDF to JPG. `options.pages` selects
 * specific 1-indexed pages (already validated against the real page
 * count by the caller via `parsePageRange`); omitted means all pages.
 *
 * Stops and reports an error on the first page that fails to render —
 * a partially-converted result would be confusing to hand back as a
 * success, and per-page fault tolerance isn't worth the added
 * complexity for a first version (documented limitation).
 *
 * If `onPage` is given, each page's result is handed off as soon as it's
 * rendered (letting the caller — the worker — transfer/release that
 * page's bytes immediately) rather than being retained until the whole
 * document finishes; the returned array still includes every page for
 * callers (like tests) that just want the final list in one place.
 */
export async function convertPdfToJpg(
  bytes: Uint8Array,
  fileBaseNameInput: string,
  options: PdfToJpgOptions,
  openPdf: PdfOpener,
  onProgress?: (event: ConvertProgressEvent) => void,
  onPage?: (page: ConvertedPageOutput) => void
): Promise<ConvertResult> {
  onProgress?.({ stage: "reading" });

  let doc: OpenedPdf;
  try {
    doc = await openPdf(bytes);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't read this PDF." };
  }

  try {
    const pageNumbers = options.pages ?? Array.from({ length: doc.pageCount }, (_, i) => i + 1);

    if (pageNumbers.length === 0) {
      return { ok: false, error: "No pages selected to convert." };
    }
    if (pageNumbers.some((p) => p < 1 || p > doc.pageCount)) {
      return { ok: false, error: "The requested page selection doesn't match this document." };
    }

    onProgress?.({ stage: "preparing", totalPages: pageNumbers.length });

    const baseName = safeBaseName(fileBaseNameInput);
    const scale = RESOLUTION_SCALE[options.resolution];
    const quality = JPG_QUALITY_VALUE[options.quality];

    const results: ConvertedPageOutput[] = [];
    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNumber = pageNumbers[i] as number;
      onProgress?.({ stage: "converting-page", index: i + 1, total: pageNumbers.length });

      let rendered: RenderedPageResult;
      try {
        rendered = await doc.renderPage(pageNumber, scale, quality);
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : `Couldn't convert page ${pageNumber}.`,
        };
      }

      const pageOutput: ConvertedPageOutput = {
        pageNumber,
        bytes: rendered.bytes,
        fileName: pageFileName(baseName, pageNumber),
        width: rendered.width,
        height: rendered.height,
      };
      results.push(pageOutput);
      onPage?.(pageOutput);

      // Yield to the event loop between pages so a long conversion never
      // blocks the worker thread continuously — keeps progress messages
      // and the ability to observe memory behavior responsive even
      // though the worker isn't rendering UI itself.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    onProgress?.({ stage: "preparing-downloads" });
    return { ok: true, pages: results };
  } finally {
    doc.destroy();
  }
}
