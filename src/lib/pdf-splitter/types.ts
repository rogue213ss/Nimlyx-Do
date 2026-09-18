// Worker message types and mode definitions for the PDF Splitter.

export type SplitMode = "all-pages" | "ranges";

export interface SplitJob {
  buffer: ArrayBuffer;
  fileBaseName: string;
  mode: SplitMode;
  /** Only used when mode is "ranges" — one output PDF per entry, each
   * containing the given 1-indexed page numbers in the given order. */
  ranges?: number[][];
}

export interface SplitOutputFile {
  bytes: ArrayBuffer;
  fileName: string;
  pageCount: number;
}

export type WorkerInboundMessage = { type: "split"; job: SplitJob };

export type WorkerOutboundMessage =
  | { type: "progress"; stage: "reading" }
  | { type: "progress"; stage: "splitting"; index: number; total: number }
  | { type: "progress"; stage: "finalizing" }
  | { type: "success"; files: SplitOutputFile[] }
  | { type: "error"; message: string };
