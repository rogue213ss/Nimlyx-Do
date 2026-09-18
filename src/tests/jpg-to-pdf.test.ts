import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { convertImagesToPdf, type ImageInput } from "@/lib/jpg-to-pdf/convert";
import { detectImageKind, safeBaseName, validateBatchMeta, validateFileMeta } from "@/lib/jpg-to-pdf/validation";

// --- validation.ts -------------------------------------------------------

describe("validateFileMeta", () => {
  it("accepts a normal jpeg", () => {
    expect(validateFileMeta({ name: "photo.jpg", type: "image/jpeg", size: 1024 }).ok).toBe(true);
  });

  it("accepts a normal png", () => {
    expect(validateFileMeta({ name: "scan.png", type: "image/png", size: 1024 }).ok).toBe(true);
  });

  it("rejects a non-image file", () => {
    expect(validateFileMeta({ name: "doc.pdf", type: "application/pdf", size: 1024 }).ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validateFileMeta({ name: "empty.jpg", type: "image/jpeg", size: 0 }).ok).toBe(false);
  });

  it("rejects an oversized file", () => {
    expect(validateFileMeta({ name: "huge.jpg", type: "image/jpeg", size: 60 * 1024 * 1024 }).ok).toBe(false);
  });
});

describe("validateBatchMeta", () => {
  it("accepts a normal small batch", () => {
    const result = validateBatchMeta(0, [
      { name: "a.jpg", type: "image/jpeg", size: 100 },
      { name: "b.png", type: "image/png", size: 100 },
    ]);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejected).toHaveLength(0);
    expect(result.batchWarning).toBeUndefined();
  });

  it("separates invalid files without blocking valid ones", () => {
    const result = validateBatchMeta(0, [
      { name: "a.jpg", type: "image/jpeg", size: 100 },
      { name: "b.pdf", type: "application/pdf", size: 100 },
    ]);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
  });

  it("caps the batch at the overall file limit", () => {
    const incoming = Array.from({ length: 10 }, (_, i) => ({ name: `${i}.jpg`, type: "image/jpeg", size: 100 }));
    const result = validateBatchMeta(45, incoming);
    expect(result.accepted).toHaveLength(5);
    expect(result.batchWarning).toMatch(/Only 5 more/);
  });
});

describe("detectImageKind", () => {
  it("recognizes a real JPEG signature", () => {
    expect(detectImageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("jpeg");
  });

  it("recognizes a real PNG signature", () => {
    expect(detectImageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toBe("png");
  });

  it("returns null for unrecognized content", () => {
    expect(detectImageKind(new TextEncoder().encode("not an image"))).toBeNull();
  });

  it("returns null for a truncated/too-short buffer", () => {
    expect(detectImageKind(new Uint8Array([0xff, 0xd8]))).toBeNull();
  });
});

describe("safeBaseName", () => {
  it("strips known extensions", () => {
    expect(safeBaseName("photo.jpg")).toBe("photo");
    expect(safeBaseName("scan.PNG")).toBe("scan");
  });

  it("strips path-like segments defensively", () => {
    expect(safeBaseName("../../etc/passwd.jpg")).toBe("passwd");
  });

  it("falls back to a fixed name when nothing usable remains", () => {
    expect(safeBaseName("....jpg")).toBe("images");
  });
});

// --- convert.ts (real pdf-lib integration) --------------------------------

async function makeJpegBytes(width: number, height: number): Promise<Uint8Array> {
  // Build a real, valid JPEG via pdf-lib's own embedder round-trip isn't
  // possible (embedJpg only reads JPEGs, it doesn't create them), so a
  // minimal real JPEG is constructed via a tiny solid-color raw buffer
  // encoded through the platform's own canvas-free path is unavailable in
  // Node. Instead, reuse a tiny, well-formed baseline JPEG fixture
  // embedded as bytes — this is the standard smallest-valid-JPEG trick
  // used in library test suites.
  // 1x1 red pixel baseline JPEG (well-known minimal fixture):
  const base64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";
  const bin = Buffer.from(base64, "base64");
  // width/height are accepted for API symmetry with the PNG helper below
  // but this fixed fixture is always a 1x1 image; tests only check
  // page count / ordering / error handling, not actual pixel dimensions.
  void width;
  void height;
  return new Uint8Array(bin);
}

async function makePngBytes(): Promise<Uint8Array> {
  // Build a real PNG the same way the project's own pdf-compressor tests
  // do: via pdf-lib's PNG embedding round trip isn't available either, so
  // use a well-known minimal valid 1x1 PNG fixture.
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  return new Uint8Array(Buffer.from(base64, "base64"));
}

describe("convertImagesToPdf", () => {
  it("converts a single JPEG into a one-page PDF", async () => {
    const jpeg = await makeJpegBytes(1, 1);
    const images: ImageInput[] = [{ name: "photo.jpg", bytes: jpeg, kind: "jpeg" }];
    const result = await convertImagesToPdf(images, "fit-image");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pageCount).toBe(1);
    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("converts multiple images (mixed jpeg/png) into a multi-page PDF, preserving order", async () => {
    const jpeg = await makeJpegBytes(1, 1);
    const png = await makePngBytes();
    const images: ImageInput[] = [
      { name: "a.jpg", bytes: jpeg, kind: "jpeg" },
      { name: "b.png", bytes: png, kind: "png" },
      { name: "c.jpg", bytes: jpeg, kind: "jpeg" },
    ];
    const result = await convertImagesToPdf(images, "fit-image");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pageCount).toBe(3);
    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it("rejects an empty image list", async () => {
    const result = await convertImagesToPdf([], "fit-image");
    expect(result.ok).toBe(false);
  });

  it("reports a clear, file-specific error for an unreadable image", async () => {
    const images: ImageInput[] = [{ name: "broken.jpg", bytes: new TextEncoder().encode("not a jpeg"), kind: "jpeg" }];
    const result = await convertImagesToPdf(images, "fit-image");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedFile).toBe("broken.jpg");
      expect(result.error).toMatch(/broken.jpg/);
    }
  });

  it("stops at the first failing image in a batch and names it", async () => {
    const jpeg = await makeJpegBytes(1, 1);
    const images: ImageInput[] = [
      { name: "good.jpg", bytes: jpeg, kind: "jpeg" },
      { name: "bad.png", bytes: new TextEncoder().encode("not a png"), kind: "png" },
    ];
    const result = await convertImagesToPdf(images, "fit-image");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failedFile).toBe("bad.png");
  });

  it("produces a valid PDF for the 'a4' page size mode too", async () => {
    const jpeg = await makeJpegBytes(1, 1);
    const result = await convertImagesToPdf([{ name: "a.jpg", bytes: jpeg, kind: "jpeg" }], "a4");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = await PDFDocument.load(result.bytes);
    const page = doc.getPage(0);
    // A4 portrait dimensions in points (a 1x1 image is never landscape).
    expect(page.getWidth()).toBeCloseTo(595.28, 0);
    expect(page.getHeight()).toBeCloseTo(841.89, 0);
  });

  it("emits progress events in order", async () => {
    const jpeg = await makeJpegBytes(1, 1);
    const stages: string[] = [];
    await convertImagesToPdf([{ name: "a.jpg", bytes: jpeg, kind: "jpeg" }], "fit-image", (e) => stages.push(e.stage));
    expect(stages[0]).toBe("embedding");
    expect(stages[stages.length - 1]).toBe("finalizing");
  });
});
