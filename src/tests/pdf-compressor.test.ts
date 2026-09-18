import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { compressPdf, type JpegReencoder } from "@/lib/pdf-compressor/compress";

// A real, minimal, valid 1x1 baseline JPEG (widely used as a placeholder
// fixture across the JS ecosystem). Used here so `PDFDocument.embedJpg`
// embeds a genuine DCTDecode-filtered image stream — the exact object
// shape `compressPdf` is looking for — rather than a mock.
const MINIMAL_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function decodeBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

async function makePdfWithEmbeddedJpeg(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const jpegBytes = decodeBase64(MINIMAL_JPEG_BASE64);
  const image = await doc.embedJpg(jpegBytes);
  const page = doc.addPage([200, 200]);
  page.drawImage(image, { x: 0, y: 0, width: 100, height: 100 });
  return doc.save();
}

async function makePlainPdf(pageCount = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([200, 200]);
  return doc.save();
}

async function makePdfWithEmbeddedPng(): Promise<Uint8Array> {
  // A minimal valid 1x1 PNG — embedding this produces a FlateDecode image
  // XObject, not DCTDecode, so compressPdf must leave it untouched.
  const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const doc = await PDFDocument.create();
  const pngBytes = decodeBase64(PNG_BASE64);
  const image = await doc.embedPng(pngBytes);
  const page = doc.addPage([200, 200]);
  page.drawImage(image, { x: 0, y: 0, width: 50, height: 50 });
  return doc.save();
}

/** A synthetic re-encoder for use in Node tests, standing in for the real
 * canvas-based implementation used in the browser/worker. Deterministic:
 * shrinks by roughly the requested proportion so tests can assert on real
 * orchestration behavior (which images got touched, the
 * beneficial/not-beneficial fallback) without needing a real JPEG codec. */
function makeShrinkingReencoder(shrinkFactor = 0.5): JpegReencoder {
  return async (jpegBytes) => {
    const targetLength = Math.max(4, Math.floor(jpegBytes.length * shrinkFactor));
    return jpegBytes.slice(0, targetLength);
  };
}

const neverReencode: JpegReencoder = async () => null;
const growingReencoder: JpegReencoder = async (jpegBytes) => {
  const bigger = new Uint8Array(jpegBytes.length + 100);
  bigger.set(jpegBytes);
  return bigger;
};

describe("compressPdf — finds and recompresses DCTDecode (JPEG) images", () => {
  it("recompresses an embedded JPEG when the re-encoder shrinks it", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const result = await compressPdf(original, "recommended", makeShrinkingReencoder(0.3));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imagesConsidered).toBe(1);
      expect(result.imagesRecompressed).toBe(1);
      const reloaded = await PDFDocument.load(result.bytes);
      expect(reloaded.getPageCount()).toBe(1);
    }
  });

  it("never replaces an image with an equal-or-larger one", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const result = await compressPdf(original, "recommended", growingReencoder);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imagesRecompressed).toBe(0);
    }
  });

  it("leaves an image untouched when the re-encoder can't process it", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const result = await compressPdf(original, "recommended", neverReencode);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imagesConsidered).toBe(1);
      expect(result.imagesRecompressed).toBe(0);
      const reloaded = await PDFDocument.load(result.bytes);
      expect(reloaded.getPageCount()).toBe(1);
    }
  });

  it("does not touch a non-JPEG (FlateDecode/PNG) embedded image", async () => {
    const original = await makePdfWithEmbeddedPng();
    const explodingReencoder: JpegReencoder = async () => {
      throw new Error("should never be called for a non-DCTDecode image");
    };
    const result = await compressPdf(original, "recommended", explodingReencoder);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imagesConsidered).toBe(0);
      expect(result.imagesRecompressed).toBe(0);
    }
  });

  it("handles a PDF with no images at all", async () => {
    const original = await makePlainPdf(3);
    const result = await compressPdf(original, "recommended", neverReencode);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imagesConsidered).toBe(0);
      const reloaded = await PDFDocument.load(result.bytes);
      expect(reloaded.getPageCount()).toBe(3);
    }
  });
});

describe("compressPdf — honest size reporting", () => {
  it("reports beneficial:true and a smaller size when compression actually helps", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const result = await compressPdf(original, "extreme", makeShrinkingReencoder(0.1));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.beneficial).toBe(true);
      expect(result.compressedBytes).toBeLessThan(result.originalBytes);
      expect(result.bytes.length).toBe(result.compressedBytes);
    }
  });

  it("falls back to the ORIGINAL bytes and beneficial:false when re-saving doesn't shrink the file", async () => {
    const original = await makePlainPdf(1);
    const result = await compressPdf(original, "recommended", neverReencode);
    expect(result.ok).toBe(true);
    if (result.ok && !result.beneficial) {
      expect(result.bytes).toEqual(original);
      expect(result.compressedBytes).toBe(original.length);
    }
  });

  it("never returns a result larger than the original", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const result = await compressPdf(original, "low", growingReencoder);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.compressedBytes).toBeLessThanOrEqual(result.originalBytes);
    }
  });
});

describe("compressPdf — error handling", () => {
  it("fails gracefully on corrupt/non-PDF bytes, without leaking internals", async () => {
    const bad = new TextEncoder().encode("this is not a pdf");
    const result = await compressPdf(bad, "recommended", neverReencode);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/at pdf-lib|Error:|\.ts:\d+|node_modules/);
    }
  });
});

describe("compressPdf — progress reporting", () => {
  it("reports real, truthful progress stages as they happen", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const events: string[] = [];
    await compressPdf(original, "recommended", makeShrinkingReencoder(0.3), (e) => {
      events.push(
        e.stage === "recompressing-image" ? `recompressing-image:${e.index}/${e.total}` : e.stage
      );
    });
    expect(events).toEqual(["analyzing", "recompressing-image:1/1", "finalizing"]);
  });
});

describe("compressPdf — level affects requested quality", () => {
  it("passes a lower quality value for 'extreme' than for 'low'", async () => {
    const original = await makePdfWithEmbeddedJpeg();
    const qualitiesSeen: number[] = [];
    const spyingReencoder: JpegReencoder = async (bytes, quality) => {
      qualitiesSeen.push(quality);
      return bytes.slice(0, Math.floor(bytes.length * 0.5));
    };
    await compressPdf(original, "extreme", spyingReencoder);
    await compressPdf(original, "low", spyingReencoder);
    expect(qualitiesSeen[0]).toBeLessThan(qualitiesSeen[1] as number);
  });
});
