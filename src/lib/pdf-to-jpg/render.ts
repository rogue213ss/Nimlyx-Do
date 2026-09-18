// Real PDF page rasterization: PDF bytes → rendered page → JPEG bytes.
//
// ARCHITECTURE NOTE: pdf-lib (used by PDF Merger and PDF Compressor) only
// manipulates PDF structure — it has no rasterizer. Nothing else in this
// project renders a PDF page to pixels. Converting a page to an actual
// JPG image is fundamentally impossible without a real PDF renderer, so
// this is the one tool that adds pdfjs-dist (Mozilla's PDF.js) as a new
// dependency — not a second copy of an existing capability, the first
// instance of this capability. See PROJECT_CONTEXT.md's decision log.
//
// Runs entirely inside the Worker using OffscreenCanvas — no DOM canvas,
// no main-thread work, and (same promise as every other file tool here)
// the PDF bytes never leave the browser. pdfjs-dist's own worker script,
// standard font data, and CMap data are all bundled locally as static
// assets (see scripts/copy-pdf-worker.js), never fetched from a CDN, so
// there is no network call anywhere in this path.
//
// This module is deliberately NOT unit-tested under Vitest/Node: it
// requires OffscreenCanvas, a real 2D rendering context, and pdfjs-dist's
// canvas-backed rendering pipeline, none of which exist in Node. The
// orchestration logic that calls this (page ordering, progress sequence,
// error handling, filename generation) lives in convert.ts instead, built
// so it can be exercised with a fake renderer in tests — this file itself
// is covered by manual QA (see PROJECT_CONTEXT.md's checklist).

import * as pdfjsLib from "pdfjs-dist";

// Served from /public rather than bundled via `new URL(..., import.meta.url)`.
// That pattern makes webpack try to statically parse pdf.worker.min.mjs as a
// module — but it's a self-contained worker bundle (with an embedded WASM
// JPX/OpenJPEG decoder) that isn't meant to be re-parsed by another bundler,
// and doing so fails the build. Serving it as a same-origin static file
// keeps this fully local (no CDN) while sidestepping that failure. The file
// is copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs into
// public/pdfjs/ — see PROJECT_CONTEXT.md decision log for the reasoning and
// the copy step needed after any pdfjs-dist version bump.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

export interface RenderedPage {
  bytes: ArrayBuffer;
  width: number;
  height: number;
}

export class PdfRenderError extends Error {}

/** Loads a PDF document from raw bytes and returns its page count plus a
 * render function bound to that document, so the caller can render pages
 * one at a time (and let go of each canvas immediately after) rather than
 * holding every page's pixels in memory at once. */
export async function openPdfForRendering(bytes: Uint8Array) {
  let doc: pdfjsLib.PDFDocumentProxy;
  try {
    doc = await pdfjsLib.getDocument({
      data: bytes,
      isEvalSupported: false,
      // Without these, pages using non-embedded standard fonts (or
      // certain embedded-font character encodings) render with missing
      // or placeholder ("notdef") glyphs instead of the real text —
      // this was a real, reported bug (see PROJECT_CONTEXT.md decision
      // log). Both are served locally from public/pdfjs/ (copied from
      // the installed pdfjs-dist package by scripts/copy-pdf-worker.js),
      // never fetched from a CDN, keeping the zero-network-call promise.
      standardFontDataUrl: "/pdfjs/standard_fonts/",
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
    }).promise;
  } catch {
    throw new PdfRenderError("Couldn't read this PDF. It may be corrupt, password-protected, or unsupported.");
  }

  async function renderPage(pageNumber: number, scale: number, quality: number): Promise<RenderedPage> {
    let page;
    try {
      page = await doc.getPage(pageNumber);
    } catch {
      throw new PdfRenderError(`Couldn't read page ${pageNumber} of this PDF.`);
    }

    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.round(viewport.width));
    const height = Math.max(1, Math.round(viewport.height));

    let canvas: OffscreenCanvas;
    try {
      canvas = new OffscreenCanvas(width, height);
    } catch {
      throw new PdfRenderError("This page is too large to render at the selected resolution. Try a lower resolution.");
    }
    const context = canvas.getContext("2d");
    if (!context) throw new PdfRenderError(`Couldn't prepare page ${pageNumber} for conversion.`);

    // JPEG has no alpha channel — an unpainted canvas defaults to
    // transparent black, which would encode as solid black. Fill white
    // first so pages with transparent regions come out correctly.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    try {
      await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, viewport }).promise;
    } catch {
      throw new PdfRenderError(`Rendering failed on page ${pageNumber}. It may use unsupported content.`);
    } finally {
      page.cleanup();
    }

    let blob: Blob;
    try {
      blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    } catch {
      throw new PdfRenderError(`Couldn't encode page ${pageNumber} as a JPG.`);
    }

    const bytesOut = await blob.arrayBuffer();
    return { bytes: bytesOut, width, height };
  }

  return { pageCount: doc.numPages, renderPage, destroy: () => doc.destroy() };
}
