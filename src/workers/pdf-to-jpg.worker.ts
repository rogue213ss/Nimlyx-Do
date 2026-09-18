/// <reference lib="webworker" />
// PDF → JPG worker.
//
// Wires the environment-agnostic orchestration (lib/pdf-to-jpg/convert.ts)
// to the real pdfjs-dist/OffscreenCanvas renderer (lib/pdf-to-jpg/render.ts).
// Streams each converted page back to the main thread as soon as it's
// ready (rather than waiting for the whole document) so large PDFs show
// incremental previews instead of one long silent wait, and so this
// worker never needs to hold every page's JPEG bytes in memory at once —
// each page's ArrayBuffer is transferred out and released immediately.

import { convertPdfToJpg } from "@/lib/pdf-to-jpg/convert";
import { openPdfForRendering } from "@/lib/pdf-to-jpg/render";
import type { WorkerInboundMessage, WorkerOutboundMessage } from "@/lib/pdf-to-jpg/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage, transfer: Transferable[] = []) {
  ctx.postMessage(message, transfer);
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type !== "convert") return;

  void (async () => {
    const bytes = new Uint8Array(message.job.buffer);

    const result = await convertPdfToJpg(
      bytes,
      message.job.fileBaseName,
      message.job.options,
      openPdfForRendering,
      (progress) => {
        if (progress.stage === "reading") post({ type: "progress", stage: "reading" });
        else if (progress.stage === "preparing") {
          post({ type: "progress", stage: "preparing", totalPages: progress.totalPages });
        } else if (progress.stage === "converting-page") {
          post({ type: "progress", stage: "converting-page", index: progress.index, total: progress.total });
        } else {
          post({ type: "progress", stage: "preparing-downloads" });
        }
      },
      // Stream each page to the main thread the moment it's ready,
      // transferring its buffer (zero-copy) rather than retaining every
      // page's JPEG bytes in this worker until the whole document is
      // done — this is what keeps a large multi-hundred-page PDF from
      // accumulating every page's output in memory simultaneously.
      (page) => {
        post(
          {
            type: "page",
            page: {
              pageNumber: page.pageNumber,
              bytes: page.bytes,
              fileName: page.fileName,
              width: page.width,
              height: page.height,
            },
          },
          [page.bytes]
        );
      }
    );

    if (!result.ok) {
      post({ type: "error", message: result.error });
      return;
    }

    post({ type: "success", pageCount: result.pages.length });
  })();
});
