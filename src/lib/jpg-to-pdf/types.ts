// Worker message types and option enums for JPG to PDF.

export type PageSizeMode = "fit-image" | "a4" | "letter";

export type ImageKind = "jpeg" | "png";

export interface ImageInputFile {
  name: string;
  bytes: ArrayBuffer;
  kind: ImageKind;
}

export interface JpgToPdfJob {
  images: ImageInputFile[];
  pageSize: PageSizeMode;
  outputFileName: string;
}

export type WorkerInboundMessage = { type: "convert"; job: JpgToPdfJob };

export type WorkerOutboundMessage =
  | { type: "progress"; stage: "embedding"; index: number; total: number }
  | { type: "progress"; stage: "finalizing" }
  | { type: "success"; bytes: ArrayBuffer; pageCount: number }
  | { type: "error"; message: string; failedFile?: string };
