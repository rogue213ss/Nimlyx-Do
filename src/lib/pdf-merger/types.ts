// Worker message types for the PDF Merger.

export interface PdfMergeJobFile {
  name: string;
  buffer: ArrayBuffer;
}

export interface PdfMergeJob {
  files: PdfMergeJobFile[];
}

export type WorkerInboundMessage = { type: "merge"; job: PdfMergeJob };

export type WorkerOutboundMessage =
  | { type: "progress"; stage: "reading"; fileName: string; index: number; total: number }
  | { type: "progress"; stage: "finalizing" }
  | { type: "success"; bytes: ArrayBuffer; pageCount: number }
  | { type: "error"; message: string; failedFile?: string };
