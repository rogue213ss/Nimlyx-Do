/// <reference lib="webworker" />
// NOTE: the `self as unknown as DedicatedWorkerGlobalScope` cast below plus
// this file-scoped `lib="webworker"` reference is the standard way to get
// worker-only globals (OffscreenCanvas, createImageBitmap's worker overload,
// DedicatedWorkerGlobalScope) typed correctly in a project whose root
// tsconfig `lib` is DOM-based (as this project's is, for the rest of the
// app). This is the same pattern used by Next.js/CRA worker examples.
// VERIFY: run `npm run build` in a real environment before shipping — this
// hasn't been type-checked against the project's actual tsconfig here.
// Image Compressor worker.
//
// Everything expensive happens here, off the main UI thread: decoding,
// canvas drawing, and format encoding. The main thread only ever sends a
// File in and receives a Blob back — no image bytes are ever sent anywhere
// else (no fetch, no XHR, no analytics). See PROJECT_CONTEXT.md and the
// build brief's privacy/security-audit section for the requirement this
// implements.

import { findTargetSize } from "@/lib/image-compressor/target-size";
import { computeSafeDimensions } from "@/lib/image-compressor/validation";
import { encodePng } from "@/lib/image-compressor/png-encoder";
import type {
  CompressionJob,
  OutputFormat,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from "@/lib/image-compressor/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(message: WorkerOutboundMessage) {
  // Structured-clone transfer: the Blob in a "success" message is
  // transferred efficiently by the browser's postMessage implementation
  // without us needing to manually specify transferables for a Blob.
  ctx.postMessage(message);
}

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "InvalidStateError" || err.name === "NotReadableError") {
      return "This image couldn't be decoded. It may be corrupt or an unsupported variant of its format.";
    }
  }
  if (err instanceof Error) {
    if (/out of memory|allocat/i.test(err.message)) {
      return "Your device couldn't allocate enough memory to process this image.";
    }
  }
  return "This image couldn't be processed. Try a different file.";
}

/**
 * Renders the given bitmap at `scale` into a fresh OffscreenCanvas and
 * returns its ImageData (needed for the PNG path) and dimensions.
 */
function drawScaled(bitmap: ImageBitmap, scale: number) {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    throw new Error("Canvas 2D context unavailable in this browser.");
  }
  canvasCtx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, canvasCtx, width, height };
}

async function encodeOnce(
  bitmap: ImageBitmap,
  quality: number,
  scale: number,
  outputFormat: OutputFormat
): Promise<{ size: number; blob: Blob }> {
  const { canvas, canvasCtx, width, height } = drawScaled(bitmap, scale);

  if (outputFormat === "image/png") {
    const imageData = canvasCtx.getImageData(0, 0, width, height);
    const pngBytes = await encodePng(imageData, quality);
    const blob = new Blob([pngBytes], { type: "image/png" });
    return { size: blob.size, blob };
  }

  // JPEG / WebP: native encoding, zero WASM. `convertToBlob` is available
  // on OffscreenCanvas in every browser that supports OffscreenCanvas at
  // all, so no feature-detection branch is needed beyond the worker's own
  // availability (checked at the call site before this worker is spawned).
  const blob = await canvas.convertToBlob({ type: outputFormat, quality });
  return { size: blob.size, blob };
}

async function processJob(job: CompressionJob) {
  const { id, file, outputFormat, compression } = job;

  post({ type: "progress", id, stage: "decoding" });

  let bitmap: ImageBitmap;
  try {
    // `imageOrientation: "from-image"` makes the decoded bitmap already
    // upright according to the file's EXIF orientation tag, regardless of
    // a given browser's default. Combined with the fact that we then
    // re-encode from pixels, no EXIF metadata (orientation or otherwise)
    // survives into the output — this is also the privacy win described in
    // the build brief (no location/device metadata carried through).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    post({ type: "error", id, message: friendlyErrorMessage(err) });
    return;
  }

  const safe = computeSafeDimensions(bitmap.width, bitmap.height);
  const preScaled = safe.wasScaled;

  // If the source exceeds the safe working dimension, replace `bitmap`
  // with a pre-scaled version now, before any expensive iterative encoding
  // begins. This bounds memory/CPU for the rest of the pipeline regardless
  // of how large the original file was.
  if (preScaled) {
    const prescaledBitmap = await createImageBitmap(bitmap, {
      resizeWidth: safe.width,
      resizeHeight: safe.height,
      resizeQuality: "high",
    });
    bitmap.close();
    bitmap = prescaledBitmap;
  }

  try {
    if (compression.kind === "quality") {
      post({ type: "progress", id, stage: "encoding" });
      const { size, blob } = await encodeOnce(bitmap, compression.quality, 1, outputFormat);
      post({
        type: "success",
        id,
        blob,
        width: bitmap.width,
        height: bitmap.height,
        originalBytes: file.size,
        resultBytes: size,
        preScaled,
      });
      return;
    }

    // Target-size mode.
    post({ type: "progress", id, stage: "searching" });
    const result = await findTargetSize(
      {
        targetBytes: compression.targetBytes,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
      },
      async (quality, scale) => {
        const { size, blob } = await encodeOnce(bitmap, quality, scale, outputFormat);
        return { size, data: blob };
      }
    );

    post({
      type: "success",
      id,
      blob: result.data,
      width: Math.round(bitmap.width * result.dimensionScale),
      height: Math.round(bitmap.height * result.dimensionScale),
      originalBytes: file.size,
      resultBytes: result.size,
      targetAchieved: result.achieved,
      preScaled,
    });
  } catch (err) {
    post({ type: "error", id, message: friendlyErrorMessage(err) });
  } finally {
    bitmap.close();
  }
}

// Jobs are processed one at a time, in the order received. This keeps
// memory bounded (only one image's worth of bitmaps/canvases live at once)
// and matches how a single-threaded worker naturally behaves anyway — the
// queue is just made explicit so a burst of postMessage calls from the
// main thread (e.g. dropping 20 files at once) doesn't try to decode all
// of them concurrently.
const queue: CompressionJob[] = [];
let draining = false;

async function drain() {
  if (draining) return;
  draining = true;
  let next: CompressionJob | undefined;
  while ((next = queue.shift())) {
    await processJob(next);
  }
  draining = false;
}

ctx.addEventListener("message", (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data;
  if (message.type === "compress") {
    queue.push(message.job);
    void drain();
  }
});
