// Core PDF compression logic.
//
// ARCHITECTURE NOTE: the build brief for this tool described a server-side
// pipeline (Ghostscript/qpdf/pikepdf, an upload API route). This project
// has no backend at all — every existing tool (Image Compressor, Image
// Resizer, JSON Formatter, PDF Merger) makes an explicit, repeatedly
// security-audited promise that user files never leave the browser, and
// there is no server infrastructure to run a system binary like
// Ghostscript reliably or safely across deployment targets. Per this
// project's own "identify the exact blocker instead of faking the
// functionality" principle, and per explicit instruction, this is
// implemented 100% client-side instead. See PROJECT_CONTEXT.md's decision
// log for the full reasoning.
//
// WHAT THIS ACTUALLY DOES (real compression, not a renamed copy):
//   1. Finds every image XObject encoded as a plain JPEG (Filter =
//      DCTDecode) — for those, the stream's stored bytes ARE a literal
//      JPEG codestream, so they can be handed directly to the browser's
//      native JPEG decoder (createImageBitmap) and re-encoded at a lower
//      quality via canvas. This is genuine lossy recompression, not a
//      trick — it's also where most of a real-world PDF's size usually
//      lives, since page/font/structural data is comparatively small.
//   2. Re-saves the document through pdf-lib, which rebuilds the object
//      graph from what's actually reachable (dropping orphaned objects)
//      and applies object-stream compression.
//   3. NEVER replaces an image with a larger one, and if the whole
//      document doesn't end up smaller, the ORIGINAL bytes are returned
//      instead — this tool will not present a larger file as a
//      successful compression.
//
// DELIBERATELY NOT ATTEMPTED (documented, not silently skipped): images
// using other encodings — CCITT Group 4 fax, JBIG2, JPEG2000 (JPXDecode),
// or raw/Flate-encoded bitmaps — are left completely untouched. Safely
// decoding those client-side would need a real decoder for each format;
// getting that wrong risks corrupting the PDF, which is worse than a
// smaller compression win. A PDF made up entirely of those encodings may
// see little or no size reduction from this tool — this is the same
// "not every PDF can shrink" honesty the brief itself required.

import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, type PDFRef } from "pdf-lib";

export type CompressionLevel = "extreme" | "recommended" | "low";

export const JPEG_QUALITY_BY_LEVEL: Record<CompressionLevel, number> = {
  extreme: 0.4,
  recommended: 0.65,
  low: 0.82,
};

/**
 * Re-encodes a raw JPEG byte stream at a lower quality. Returns `null` if
 * re-encoding wasn't possible for this particular image (e.g. the browser
 * couldn't decode it) — the caller must leave that image untouched rather
 * than guess. Injected so the orchestration logic below can be tested with
 * a synthetic implementation in Node, and swapped for a real
 * canvas/createImageBitmap implementation in the browser/worker.
 */
export type JpegReencoder = (jpegBytes: Uint8Array, quality: number) => Promise<Uint8Array | null>;

export type CompressProgressEvent =
  | { stage: "analyzing" }
  | { stage: "recompressing-image"; index: number; total: number }
  | { stage: "finalizing" };

export interface CompressSuccess {
  ok: true;
  bytes: Uint8Array;
  originalBytes: number;
  compressedBytes: number;
  imagesConsidered: number;
  imagesRecompressed: number;
  /** False when the attempted compression didn't actually come out
   * smaller — in that case `bytes`/`compressedBytes` are the ORIGINAL,
   * unmodified file, never a larger "compressed" one. */
  beneficial: boolean;
}

export interface CompressFailure {
  ok: false;
  error: string;
}

export type CompressResult = CompressSuccess | CompressFailure;

function isDctDecodeFilter(filterObj: ReturnType<PDFDict["get"]>): boolean {
  if (filterObj instanceof PDFName) return filterObj.toString() === "/DCTDecode";
  if (filterObj instanceof PDFArray) {
    // A filter chain (e.g. [ASCII85Decode, DCTDecode]) is left untouched
    // for safety — only the simple, common single-filter case is handled.
    if (filterObj.size() !== 1) return false;
    const only = filterObj.get(0);
    return only instanceof PDFName && only.toString() === "/DCTDecode";
  }
  return false;
}

export async function compressPdf(
  originalBytes: Uint8Array,
  level: CompressionLevel,
  reencodeJpeg: JpegReencoder,
  onProgress?: (event: CompressProgressEvent) => void
): Promise<CompressResult> {
  onProgress?.({ stage: "analyzing" });

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: false });
  } catch {
    return { ok: false, error: "Couldn't read this PDF. It may be corrupt or password-protected." };
  }

  const quality = JPEG_QUALITY_BY_LEVEL[level];

  const candidates: { ref: PDFRef; dict: PDFDict; stream: PDFRawStream }[] = [];
  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    const subtype = dict.get(PDFName.of("Subtype"));
    if (!subtype || subtype.toString() !== "/Image") continue;
    const filter = dict.get(PDFName.of("Filter"));
    if (!isDctDecodeFilter(filter)) continue;
    candidates.push({ ref, dict, stream: obj });
  }

  let imagesRecompressed = 0;
  for (const [index, candidate] of candidates.entries()) {
    onProgress?.({ stage: "recompressing-image", index: index + 1, total: candidates.length });

    const originalImageBytes = candidate.stream.getContents();
    let recompressed: Uint8Array | null;
    try {
      recompressed = await reencodeJpeg(originalImageBytes, quality);
    } catch {
      recompressed = null;
    }

    // Never replace with something equal-or-larger, and never guess if
    // re-encoding failed outright — leave that image exactly as it was.
    if (!recompressed || recompressed.length >= originalImageBytes.length) continue;

    const newDict = candidate.dict.clone(pdfDoc.context);
    newDict.set(PDFName.Length, pdfDoc.context.obj(recompressed.length));
    const newStream = PDFRawStream.of(newDict, recompressed);
    pdfDoc.context.assign(candidate.ref, newStream);
    imagesRecompressed++;
  }

  onProgress?.({ stage: "finalizing" });

  let optimizedBytes: Uint8Array;
  try {
    optimizedBytes = await pdfDoc.save({ useObjectStreams: true });
  } catch {
    return { ok: false, error: "Couldn't finalize the compressed PDF. Try a different file." };
  }

  const beneficial = optimizedBytes.length < originalBytes.length;

  return {
    ok: true,
    bytes: beneficial ? optimizedBytes : originalBytes,
    originalBytes: originalBytes.length,
    compressedBytes: beneficial ? optimizedBytes.length : originalBytes.length,
    imagesConsidered: candidates.length,
    imagesRecompressed,
    beneficial,
  };
}
