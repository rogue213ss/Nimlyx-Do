/// <reference lib="webworker" />
// PDF Compressor worker.
//
// The actual algorithm lives in lib/pdf-compressor/compress.ts, exercised
// directly (no worker) in src/tests/pdf-compressor.test.ts with a
// synthetic re-encoder. Here it's wired up with the real, browser-based
// JPEG re-encoder from jpeg-reencoder.ts — this file is just the
// message-passing shell plus that one real-environment dependency.

import { compressPdf } from "@/lib/pdf-compressor/compress";
import { reencodeJpegInBrowser } from "@/lib/pdf-compressor/jpeg-reencoder";
import type { WorkerInboundMessage, WorkerOutboundMessage } from "@/lib/pdf-compressor/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof Error && /out of memory|allocat/i.test(err.message)) {
    return "Your device couldn't allocate enough memory to process this PDF.";
  }
  return "This PDF couldn't be compressed. Try a different file.";
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== "compress") return;

  void (async () => {
    const originalBytes = new Uint8Array(message.job.buffer);

    let result;
    try {
      result = await compressPdf(originalBytes, message.job.level, reencodeJpegInBrowser, (progress) => {
        if (progress.stage === "recompressing-image") {
          post({
            type: "progress",
            stage: "recompressing-image",
            index: progress.index,
            total: progress.total,
          });
        } else {
          post({ type: "progress", stage: progress.stage });
        }
      });
    } catch (err) {
      post({ type: "error", message: friendlyErrorMessage(err) });
      return;
    }

    if (!result.ok) {
      post({ type: "error", message: result.error });
      return;
    }

    const outBuffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength
    ) as ArrayBuffer;

    post(
      {
        type: "success",
        bytes: outBuffer,
        originalBytes: result.originalBytes,
        compressedBytes: result.compressedBytes,
        imagesConsidered: result.imagesConsidered,
        imagesRecompressed: result.imagesRecompressed,
        beneficial: result.beneficial,
      },
      [outBuffer]
    );
  })();
});
