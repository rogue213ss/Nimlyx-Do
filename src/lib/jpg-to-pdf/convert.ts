// Core JPG/PNG → PDF logic. Deliberately environment-agnostic — no DOM,
// no File/Blob APIs, just bytes in, bytes out — same pattern as
// pdf-merger/merge.ts and pdf-splitter/split.ts, so this runs identically
// inside the Worker (production) and directly in Vitest under Node
// (tests), with pdf-lib doing the real embedding work in both places.
//
// Each image becomes exactly one PDF page. Images are embedded via
// pdf-lib's `embedJpg`/`embedPng` (the actual encoded image data is
// carried through unchanged into the PDF — not re-rendered or
// re-encoded), so image quality is preserved exactly.

import { PDFDocument, type PDFImage, type PDFPage } from "pdf-lib";
import type { ImageKind, PageSizeMode } from "./types";

export interface ImageInput {
  name: string;
  bytes: Uint8Array;
  kind: ImageKind;
}

export type ConvertProgressEvent =
  | { stage: "embedding"; index: number; total: number }
  | { stage: "finalizing" };

export type ConvertResult =
  | { ok: true; bytes: Uint8Array; pageCount: number }
  | { ok: false; error: string; failedFile?: string };

// Standard page sizes in PDF points (1/72 inch) with a fixed margin. The
// image is scaled down (never up) to fit within the margin while
// preserving its aspect ratio, and centered on the page.
const PAGE_SIZES_PT: Record<Exclude<PageSizeMode, "fit-image">, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};
const PAGE_MARGIN_PT = 36; // 0.5 inch

function placeImageOnPage(page: PDFPage, image: PDFImage, pageSize: PageSizeMode) {
  const imgWidth = image.width;
  const imgHeight = image.height;

  if (pageSize === "fit-image") {
    // Page exactly matches the image's own pixel dimensions (treated 1:1
    // as PDF points) — no scaling, no margin, no orientation guessing.
    // This is the simplest, least surprising default: what you see is
    // what you get, full-bleed.
    page.setSize(imgWidth, imgHeight);
    page.drawImage(image, { x: 0, y: 0, width: imgWidth, height: imgHeight });
    return;
  }

  const { width: pageWidth, height: pageHeight } = PAGE_SIZES_PT[pageSize];
  // Orientation follows the image: a landscape photo gets a landscape
  // page of the same standard size, rather than being shrunk to fit
  // awkwardly inside a portrait page.
  const isLandscape = imgWidth > imgHeight;
  const finalPageWidth = isLandscape ? Math.max(pageWidth, pageHeight) : Math.min(pageWidth, pageHeight);
  const finalPageHeight = isLandscape ? Math.min(pageWidth, pageHeight) : Math.max(pageWidth, pageHeight);
  page.setSize(finalPageWidth, finalPageHeight);

  const availableWidth = finalPageWidth - PAGE_MARGIN_PT * 2;
  const availableHeight = finalPageHeight - PAGE_MARGIN_PT * 2;
  const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight, 1); // never upscale
  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;
  const x = (finalPageWidth - drawWidth) / 2;
  const y = (finalPageHeight - drawHeight) / 2;

  page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
}

/**
 * Converts a sequence of JPG/PNG images into a single PDF, one image per
 * page, in the given order. Stops and reports an error (naming the
 * offending file) on the first image that can't be embedded — consistent
 * with PDF Merger's own per-file error reporting.
 */
export async function convertImagesToPdf(
  images: ImageInput[],
  pageSize: PageSizeMode,
  onProgress?: (event: ConvertProgressEvent) => void
): Promise<ConvertResult> {
  if (images.length === 0) {
    return { ok: false, error: "Add at least one image to convert." };
  }

  const doc = await PDFDocument.create();

  for (const [index, image] of images.entries()) {
    onProgress?.({ stage: "embedding", index: index + 1, total: images.length });

    let embedded: PDFImage;
    try {
      embedded = image.kind === "jpeg" ? await doc.embedJpg(image.bytes) : await doc.embedPng(image.bytes);
    } catch {
      return {
        ok: false,
        error: `Couldn't read "${image.name}". It may be corrupt or an unsupported image variant.`,
        failedFile: image.name,
      };
    }

    try {
      const page = doc.addPage();
      placeImageOnPage(page, embedded, pageSize);
    } catch {
      return {
        ok: false,
        error: `Couldn't add "${image.name}" to the PDF.`,
        failedFile: image.name,
      };
    }

    // Yield between images so a large batch never blocks the worker
    // thread continuously.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  onProgress?.({ stage: "finalizing" });

  try {
    const bytes = await doc.save();
    return { ok: true, bytes, pageCount: doc.getPageCount() };
  } catch {
    return { ok: false, error: "Couldn't finalize the PDF. Try again, or remove any unusual images and retry." };
  }
}
