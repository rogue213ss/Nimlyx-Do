// Shared types for the Image Resizer. `OutputFormat` is reused from the
// Image Compressor rather than redefined — same three formats, same
// meaning — without touching or depending on any Compressor-specific
// (batch, target-size) types.

import type { OutputFormat } from "@/lib/image-compressor/types";

export type { OutputFormat };

export interface ResizeJob {
  file: File;
  width: number;
  height: number;
  outputFormat: OutputFormat;
}

export type ResizerInboundMessage = { type: "resize"; job: ResizeJob };

export type ResizerOutboundMessage =
  | { type: "progress"; stage: "resizing" | "encoding" }
  | {
      type: "success";
      blob: Blob;
      width: number;
      height: number;
      originalBytes: number;
      resultBytes: number;
    }
  | { type: "error"; message: string };
