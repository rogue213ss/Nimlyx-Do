// Shared, framework-agnostic types for the Image Compressor tool.
// These are used on both sides of the main-thread <-> Worker boundary, so
// keeping them in one place is what lets us use discriminated unions
// instead of `any` when passing messages back and forth.

export const SUPPORTED_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedInputType = (typeof SUPPORTED_INPUT_TYPES)[number];

export const SUPPORTED_OUTPUT_FORMATS = [
  "image/jpeg",
  "image/webp",
  "image/png",
] as const;

export type OutputFormat = (typeof SUPPORTED_OUTPUT_FORMATS)[number];

// How a single file should be compressed.
export type CompressionSpec =
  | { kind: "quality"; quality: number } // 0..1
  | { kind: "target-size"; targetBytes: number };

// A unit of work sent from the main thread into the worker.
export interface CompressionJob {
  id: string; // client-generated id, used to correlate responses to queue rows
  file: File;
  outputFormat: OutputFormat;
  compression: CompressionSpec;
}

// Messages the main thread sends to the worker.
export type WorkerInboundMessage = { type: "compress"; job: CompressionJob };

// Messages the worker sends back to the main thread.
export type WorkerOutboundMessage =
  | { type: "progress"; id: string; stage: "decoding" | "searching" | "encoding" }
  | {
      type: "success";
      id: string;
      blob: Blob;
      width: number;
      height: number;
      originalBytes: number;
      resultBytes: number;
      /**
       * Only meaningful for target-size compression: whether the target was
       * actually reached (within tolerance) or whether this is just the
       * closest practical result we could produce.
       */
      targetAchieved?: boolean;
      /** True if the source image was downscaled before processing began
       * because it exceeded the safe working-dimension limit. */
      preScaled: boolean;
    }
  | { type: "error"; id: string; message: string };

// A single row in the compression queue, as tracked by the UI.
export type QueueItemStatus =
  | "queued"
  | "processing"
  | "done"
  | "error";

export interface QueueItem {
  id: string;
  file: File;
  status: QueueItemStatus;
  previewUrl?: string;
  resultBlob?: Blob;
  resultUrl?: string;
  originalBytes: number;
  resultBytes?: number;
  targetAchieved?: boolean;
  errorMessage?: string;
}
