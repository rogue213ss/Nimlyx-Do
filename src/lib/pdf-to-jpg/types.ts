// Worker message types and option enums for the PDF → JPG converter.

export type JpgQuality = "high" | "recommended" | "small";
export type Resolution = "standard" | "high" | "very-high";

/** Actual encoder quality values (0-1) behind each user-facing label —
 * kept out of the UI so the tool exposes a normal-person choice, not a
 * technical settings panel. */
export const JPG_QUALITY_VALUE: Record<JpgQuality, number> = {
  high: 0.92,
  recommended: 0.8,
  small: 0.6,
};

/** Device-pixel-ratio-style render scale behind each resolution label.
 * 1.5 (Standard) matches a normal screen-reading size; 2 and 3 give
 * print-quality output for scanned/text-heavy pages at the cost of more
 * memory per page. */
export const RESOLUTION_SCALE: Record<Resolution, number> = {
  standard: 1.5,
  high: 2,
  "very-high": 3,
};

export interface PdfToJpgOptions {
  quality: JpgQuality;
  resolution: Resolution;
  /** 1-indexed page numbers to convert, in the order they should be
   * produced. `undefined` means "all pages" — the default and only mode
   * guaranteed to be available (see validation.ts for the range-parsing
   * limitation this depends on). */
  pages?: number[];
}

export interface PdfToJpgJob {
  buffer: ArrayBuffer;
  fileBaseName: string;
  options: PdfToJpgOptions;
}

export interface ConvertedPage {
  pageNumber: number;
  bytes: ArrayBuffer;
  fileName: string;
  width: number;
  height: number;
}

export type WorkerInboundMessage = { type: "convert"; job: PdfToJpgJob };

export type WorkerOutboundMessage =
  | { type: "progress"; stage: "reading" }
  | { type: "progress"; stage: "preparing"; totalPages: number }
  | { type: "progress"; stage: "converting-page"; index: number; total: number }
  | { type: "progress"; stage: "preparing-downloads" }
  | { type: "page"; page: ConvertedPage }
  | { type: "success"; pageCount: number }
  | { type: "error"; message: string };
