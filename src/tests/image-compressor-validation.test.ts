import { describe, expect, it } from "vitest";
import {
  MAX_BATCH_SIZE,
  MAX_FILE_SIZE_BYTES,
  computeSafeDimensions,
  formatBytes,
  percentSaved,
  validateBatch,
  validateFile,
  validateTargetSizeInput,
} from "@/lib/image-compressor/validation";

function file(name: string, type: string, size: number) {
  return { name, type, size };
}

describe("validateFile", () => {
  it("accepts a valid JPEG", () => {
    expect(validateFile(file("a.jpg", "image/jpeg", 1024)).ok).toBe(true);
  });

  it("accepts a valid PNG", () => {
    expect(validateFile(file("a.png", "image/png", 1024)).ok).toBe(true);
  });

  it("accepts a valid WebP", () => {
    expect(validateFile(file("a.webp", "image/webp", 1024)).ok).toBe(true);
  });

  it("rejects an unsupported format", () => {
    const result = validateFile(file("a.gif", "image/gif", 1024));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unsupported format/);
  });

  it("rejects a file over 50MB", () => {
    const result = validateFile(file("big.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/);
  });

  it("accepts a file exactly at the 50MB limit", () => {
    expect(validateFile(file("edge.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES)).ok).toBe(true);
  });

  it("rejects an empty file", () => {
    const result = validateFile(file("empty.jpg", "image/jpeg", 0));
    expect(result.ok).toBe(false);
  });
});

describe("validateBatch", () => {
  it("accepts a batch of 20 files", () => {
    const files = Array.from({ length: 20 }, (_, i) => file(`f${i}.jpg`, "image/jpeg", 1024));
    const result = validateBatch(files);
    expect(result.accepted.length).toBe(20);
    expect(result.batchWarning).toBeUndefined();
  });

  it("truncates a batch of 21 files to 20 and warns", () => {
    const files = Array.from({ length: 21 }, (_, i) => file(`f${i}.jpg`, "image/jpeg", 1024));
    const result = validateBatch(files);
    expect(result.accepted.length).toBe(MAX_BATCH_SIZE);
    expect(result.batchWarning).toMatch(/20/);
  });

  it("rejects invalid files individually without dropping valid ones", () => {
    const files = [
      file("good.jpg", "image/jpeg", 1024),
      file("bad.gif", "image/gif", 1024),
      file("good2.png", "image/png", 1024),
    ];
    const result = validateBatch(files);
    expect(result.accepted.length).toBe(2);
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0]?.file.name).toBe("bad.gif");
  });
});

describe("computeSafeDimensions", () => {
  it("leaves normal dimensions untouched", () => {
    expect(computeSafeDimensions(1920, 1080)).toEqual({
      width: 1920,
      height: 1080,
      wasScaled: false,
    });
  });

  it("caps 8000x6000 into a 4096-bounded box preserving aspect ratio", () => {
    const result = computeSafeDimensions(8000, 6000);
    expect(result.wasScaled).toBe(true);
    expect(result.width).toBe(4096);
    expect(result.height).toBe(3072);
  });

  it("caps a portrait image on its taller axis", () => {
    const result = computeSafeDimensions(3000, 9000);
    expect(result.wasScaled).toBe(true);
    expect(result.height).toBe(4096);
    expect(result.width).toBe(Math.round(3000 * (4096 / 9000)));
  });

  it("leaves an image exactly at the 4096 boundary untouched", () => {
    expect(computeSafeDimensions(4096, 4096).wasScaled).toBe(false);
  });
});

describe("validateTargetSizeInput", () => {
  it("accepts a normal integer KB value", () => {
    const result = validateTargetSizeInput("100");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.bytes).toBe(100 * 1024);
  });

  it("accepts decimal KB values", () => {
    const result = validateTargetSizeInput("50.5");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.bytes).toBe(Math.round(50.5 * 1024));
  });

  it("rejects empty input", () => {
    expect(validateTargetSizeInput("").ok).toBe(false);
  });

  it("rejects zero", () => {
    expect(validateTargetSizeInput("0").ok).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(validateTargetSizeInput("-10").ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(validateTargetSizeInput("abc").ok).toBe(false);
  });

  it("rejects an unreasonably huge target", () => {
    expect(validateTargetSizeInput(`${1024 * 1024}`).ok).toBe(false); // 1TB in KB
  });

  it("rejects a target below the practical 1KB minimum", () => {
    expect(validateTargetSizeInput("0.0001").ok).toBe(false);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats kilobytes", () => {
    expect(formatBytes(145 * 1024)).toBe("145 KB");
  });
  it("formats megabytes", () => {
    expect(formatBytes(5.2 * 1024 * 1024)).toBe("5.20 MB");
  });
});

describe("percentSaved", () => {
  it("computes a typical savings percentage", () => {
    expect(percentSaved(5.2 * 1024 * 1024, 145 * 1024)).toBeGreaterThanOrEqual(97);
  });
  it("returns 0 for a zero-byte original rather than dividing by zero", () => {
    expect(percentSaved(0, 100)).toBe(0);
  });
  it("can be negative when the result is larger than the original", () => {
    expect(percentSaved(100, 200)).toBeLessThan(0);
  });
});
