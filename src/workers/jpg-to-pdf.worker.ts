/// <reference lib="webworker" />
// JPG to PDF worker — wires the environment-agnostic convert logic
// (lib/jpg-to-pdf/convert.ts) to the postMessage protocol. Pure pdf-lib
// embedding work, no rendering, no OffscreenCanvas.

import { convertImagesToPdf } from "@/lib/jpg-to-pdf/convert";
import type { WorkerInboundMessage, WorkerOutboundMessage } from "@/lib/jpg-to-pdf/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== "convert") return;

  void (async () => {
    const images = message.job.images.map((img) => ({
      name: img.name,
      bytes: new Uint8Array(img.bytes),
      kind: img.kind,
    }));

    const result = await convertImagesToPdf(images, message.job.pageSize, (progress) => {
      if (progress.stage === "embedding") {
        post({ type: "progress", stage: "embedding", index: progress.index, total: progress.total });
      } else {
        post({ type: "progress", stage: "finalizing" });
      }
    });

    if (!result.ok) {
      post({ type: "error", message: result.error, failedFile: result.failedFile });
      return;
    }

    // Slice to the exact byte range and transfer the buffer back rather
    // than copying — same zero-copy pattern used by PDF Merger/Splitter.
    const outBuffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength
    ) as ArrayBuffer;
    post({ type: "success", bytes: outBuffer, pageCount: result.pageCount }, [outBuffer]);
  })();
});
