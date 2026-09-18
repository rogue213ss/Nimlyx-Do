/// <reference lib="webworker" />
// PDF Merger worker.
//
// Keeps the (potentially memory-heavy) merge work off the main UI thread.
// The actual merge algorithm lives in lib/pdf-merger/merge.ts and is
// imported here unchanged — this worker is just the message-passing shell
// around it, exactly the same module that's exercised directly (no worker
// involved) in src/tests/pdf-merger.test.ts.

import { mergePdfs } from "@/lib/pdf-merger/merge";
import type { WorkerInboundMessage, WorkerOutboundMessage } from "@/lib/pdf-merger/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== "merge") return;

  void (async () => {
    const files = message.job.files.map((f) => ({ name: f.name, bytes: new Uint8Array(f.buffer) }));

    const result = await mergePdfs(files, (progress) => {
      if (progress.stage === "reading") {
        post({
          type: "progress",
          stage: "reading",
          fileName: progress.fileName,
          index: progress.index,
          total: progress.total,
        });
      } else {
        post({ type: "progress", stage: "finalizing" });
      }
    });

    if (!result.ok) {
      post({ type: "error", message: result.error, failedFile: result.failedFile });
      return;
    }

    // Transfer the underlying buffer back rather than copying it — the
    // merged PDF can be large, and this is the same zero-copy pattern used
    // for successful results elsewhere in the project.
    const outBuffer = result.bytes.buffer.slice(
      result.bytes.byteOffset,
      result.bytes.byteOffset + result.bytes.byteLength
    ) as ArrayBuffer;
    post({ type: "success", bytes: outBuffer, pageCount: result.pageCount }, [outBuffer]);
  })();
});
