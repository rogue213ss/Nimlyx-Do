// Real, browser-based implementation of the `JpegReencoder` type from
// compress.ts. Lives in its own file (rather than inline in the worker)
// so compress.ts itself stays environment-agnostic and testable in Node —
// this is the one piece that genuinely needs `createImageBitmap` and
// `OffscreenCanvas`, both worker-safe APIs.

import type { JpegReencoder } from "./compress";

export const reencodeJpegInBrowser: JpegReencoder = async (jpegBytes, quality) => {
  try {
    const arrayBuffer = jpegBytes.buffer.slice(
      jpegBytes.byteOffset,
      jpegBytes.byteOffset + jpegBytes.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    const bitmap = await createImageBitmap(blob);
    try {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      const outBlob = await canvas.convertToBlob({ type: "image/jpeg", quality });
      return new Uint8Array(await outBlob.arrayBuffer());
    } finally {
      bitmap.close();
    }
  } catch {
    // Some embedded "JPEGs" are technically DCTDecode but use a color
    // transform or subsampling the browser's decoder rejects (e.g. CMYK
    // JPEGs, which are valid PDF content but not valid web JPEGs). Return
    // null rather than throw — compressPdf treats that as "leave this one
    // image untouched", never a hard failure of the whole document.
    return null;
  }
};
