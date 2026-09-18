/// <reference lib="webworker" />
// Image Resizer worker.
//
// Deliberately reuses two pieces of the Image Compressor's infrastructure
// rather than reimplementing them, per the brief's "do not unnecessarily
// duplicate existing image-processing infrastructure" requirement:
//   - computeSafeDimensions: the same 4096px source-side safety clamp
//   - encodePng: the same lazy oxipng wrapper (verified working — see
//     PROJECT_CONTEXT.md decision log)
// Neither of those files was modified to support this reuse; both were
// already generic (not Compressor-specific) and are imported as-is.
//
// Everything else about this worker is intentionally simpler than the
// Compressor's: one image at a time, one explicit target size (no
// target-size search, no quality/dimension iteration) — this tool answers
// "resize to this exact size", not "get under this file size."

import { computeSafeDimensions } from "@/lib/image-compressor/validation";
import { encodePng } from "@/lib/image-compressor/png-encoder";
import type {
  ResizeJob,
  ResizerInboundMessage,
  ResizerOutboundMessage,
} from "@/lib/image-resizer/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: ResizerOutboundMessage) {
  ctx.postMessage(message);
}

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "InvalidStateError" || err.name === "NotReadableError") {
      return "This image couldn't be read. It may be corrupt or an unsupported variant of its format.";
    }
  }
  if (err instanceof Error && /out of memory|allocat/i.test(err.message)) {
    return "Your device couldn't allocate enough memory to process this image.";
  }
  return "This image couldn't be resized. Try a different file.";
}

async function resize(job: ResizeJob) {
  const { file, width, height, outputFormat } = job;

  let bitmap: ImageBitmap;
  try {
    // Same EXIF-normalizing decode as the Compressor: the output ends up
    // upright regardless of the source's orientation tag, and re-encoding
    // from pixels means no EXIF metadata survives into the result.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    post({ type: "error", message: friendlyErrorMessage(err) });
    return;
  }

  // Guard against a pathologically large SOURCE image before any drawing —
  // independent of whatever output size was requested.
  const safeSource = computeSafeDimensions(bitmap.width, bitmap.height);
  if (safeSource.wasScaled) {
    const scaledBitmap = await createImageBitmap(bitmap, {
      resizeWidth: safeSource.width,
      resizeHeight: safeSource.height,
      resizeQuality: "high",
    });
    bitmap.close();
    bitmap = scaledBitmap;
  }

  try {
    post({ type: "progress", stage: "resizing" });
    const canvas = new OffscreenCanvas(width, height);
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      throw new Error("Canvas 2D context unavailable in this browser.");
    }
    canvasCtx.drawImage(bitmap, 0, 0, width, height);

    post({ type: "progress", stage: "encoding" });
    let blob: Blob;
    if (outputFormat === "image/png") {
      const imageData = canvasCtx.getImageData(0, 0, width, height);
      // Resizing has no "quality" concept of its own — there's no
      // target-size search here, unlike the Compressor. A fixed input
      // close to encodePng's own upper bound keeps PNG optimization at
      // oxipng's fast default level rather than spending extra time on
      // aggressive optimization for a workflow that isn't about file size.
      const pngBytes = await encodePng(imageData, 0.9);
      blob = new Blob([pngBytes], { type: "image/png" });
    } else {
      blob = await canvas.convertToBlob({ type: outputFormat, quality: 0.9 });
    }

    post({
      type: "success",
      blob,
      width,
      height,
      originalBytes: file.size,
      resultBytes: blob.size,
    });
  } catch (err) {
    post({ type: "error", message: friendlyErrorMessage(err) });
  } finally {
    bitmap.close();
  }
}

ctx.addEventListener("message", (event: MessageEvent<ResizerInboundMessage>) => {
  const message = event.data;
  if (message.type === "resize") {
    void resize(message.job);
  }
});
