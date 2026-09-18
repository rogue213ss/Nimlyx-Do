import type { CompressionLevel } from "./compress";

export interface CompressJob {
  buffer: ArrayBuffer;
  level: CompressionLevel;
}

export type WorkerInboundMessage = { type: "compress"; job: CompressJob };

export type WorkerOutboundMessage =
  | { type: "progress"; stage: "analyzing" }
  | { type: "progress"; stage: "recompressing-image"; index: number; total: number }
  | { type: "progress"; stage: "finalizing" }
  | {
      type: "success";
      bytes: ArrayBuffer;
      originalBytes: number;
      compressedBytes: number;
      imagesConsidered: number;
      imagesRecompressed: number;
      beneficial: boolean;
    }
  | { type: "error"; message: string };
