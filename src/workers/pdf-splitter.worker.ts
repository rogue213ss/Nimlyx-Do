/// <reference lib="webworker" />
// PDF Splitter worker — wires the environment-agnostic split logic
// (lib/pdf-splitter/split.ts) to the postMessage protocol. Pure pdf-lib
// work, no rendering, so unlike PDF to JPG this needs no external worker
// script and no OffscreenCanvas.

import { splitPdf } from "@/lib/pdf-splitter/split";
import type { WorkerInboundMessage, WorkerOutboundMessage } from "@/lib/pdf-splitter/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== "split") return;

  void (async () => {
    const bytes = new Uint8Array(message.job.buffer);

    const result = await splitPdf(bytes, message.job.fileBaseName, message.job.mode, message.job.ranges, (progress) => {
      if (progress.stage === "reading") post({ type: "progress", stage: "reading" });
      else if (progress.stage === "splitting") {
        post({ type: "progress", stage: "splitting", index: progress.index, total: progress.total });
      } else post({ type: "progress", stage: "finalizing" });
    });

    if (!result.ok) {
      post({ type: "error", message: result.error });
      return;
    }

    // Slice each output to its exact byte range and transfer the
    // underlying buffers back rather than copying — same zero-copy
    // pattern used for PDF Merger's successful result.
    const outFiles = result.files.map((f) => {
      const buffer = f.bytes.buffer.slice(f.bytes.byteOffset, f.bytes.byteOffset + f.bytes.byteLength) as ArrayBuffer;
      return { bytes: buffer, fileName: f.fileName, pageCount: f.pageCount };
    });
    post(
      { type: "success", files: outFiles },
      outFiles.map((f) => f.bytes)
    );
  })();
});
