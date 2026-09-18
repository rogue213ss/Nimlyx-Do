import { describe, expect, it } from "vitest";
import {
  MAX_OUTPUT_DIMENSION,
  deriveLockedDimension,
  parseDimensionInput,
  resolveTargetDimensions,
} from "@/lib/image-resizer/dimensions";

describe("parseDimensionInput", () => {
  it("treats a blank field as 'not set', not an error", () => {
    const result = parseDimensionInput("");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeUndefined();
  });

  it("parses a normal integer", () => {
    const result = parseDimensionInput("800");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(800);
  });

  it("rounds a decimal value", () => {
    const result = parseDimensionInput("800.6");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(801);
  });

  it("rejects zero", () => {
    expect(parseDimensionInput("0").ok).toBe(false);
  });

  it("rejects a negative number", () => {
    expect(parseDimensionInput("-100").ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(parseDimensionInput("abc").ok).toBe(false);
  });

  it("rejects a value over the maximum dimension", () => {
    expect(parseDimensionInput(`${MAX_OUTPUT_DIMENSION + 1}`).ok).toBe(false);
  });

  it("accepts a value exactly at the maximum dimension", () => {
    expect(parseDimensionInput(`${MAX_OUTPUT_DIMENSION}`).ok).toBe(true);
  });
});

describe("resolveTargetDimensions — locked aspect ratio", () => {
  it("derives height from width for a 1600x900 (16:9) original", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1600,
      originalHeight: 900,
      targetWidth: 800,
      lockAspectRatio: true,
    });
    expect(result).toEqual({ ok: true, width: 800, height: 450 });
  });

  it("derives width from height for the same original", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1600,
      originalHeight: 900,
      targetHeight: 450,
      lockAspectRatio: true,
    });
    expect(result).toEqual({ ok: true, width: 800, height: 450 });
  });

  it("width-only resize on a portrait image", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1000,
      originalHeight: 2000,
      targetWidth: 500,
      lockAspectRatio: true,
    });
    expect(result).toEqual({ ok: true, width: 500, height: 1000 });
  });

  it("height-only resize on a portrait image", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1000,
      originalHeight: 2000,
      targetHeight: 1000,
      lockAspectRatio: true,
    });
    expect(result).toEqual({ ok: true, width: 500, height: 1000 });
  });
});

describe("resolveTargetDimensions — unlocked aspect ratio", () => {
  it("uses both width and height independently, ignoring original ratio", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1600,
      originalHeight: 900,
      targetWidth: 500,
      targetHeight: 500,
      lockAspectRatio: false,
    });
    expect(result).toEqual({ ok: true, width: 500, height: 500 });
  });

  it("holds the untouched axis at the original value when only one is given", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1600,
      originalHeight: 900,
      targetWidth: 800,
      lockAspectRatio: false,
    });
    expect(result).toEqual({ ok: true, width: 800, height: 900 });
  });
});

describe("resolveTargetDimensions — invalid input / edge cases", () => {
  it("rejects when neither width nor height is provided", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1000,
      originalHeight: 1000,
      lockAspectRatio: true,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a target below the minimum dimension", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1000,
      originalHeight: 1000,
      targetWidth: 0,
      lockAspectRatio: false,
      targetHeight: 100,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a target above the maximum dimension", () => {
    const result = resolveTargetDimensions({
      originalWidth: 1000,
      originalHeight: 1000,
      targetWidth: MAX_OUTPUT_DIMENSION + 1,
      targetHeight: 100,
      lockAspectRatio: false,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unreadable/invalid original dimensions", () => {
    const result = resolveTargetDimensions({
      originalWidth: 0,
      originalHeight: 0,
      targetWidth: 100,
      lockAspectRatio: true,
    });
    expect(result.ok).toBe(false);
  });

  it("allows enlarging beyond the original dimensions", () => {
    const result = resolveTargetDimensions({
      originalWidth: 400,
      originalHeight: 300,
      targetWidth: 2000,
      lockAspectRatio: true,
    });
    expect(result).toEqual({ ok: true, width: 2000, height: 1500 });
  });

  it("never produces a locked-ratio result below 1px on the derived axis", () => {
    const result = resolveTargetDimensions({
      originalWidth: 5000,
      originalHeight: 10,
      targetWidth: 1,
      lockAspectRatio: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.height).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("deriveLockedDimension", () => {
  it("computes height from a width edit on a 16:9 image", () => {
    expect(deriveLockedDimension(1600, 900, "width", 800)).toBe(450);
  });

  it("computes width from a height edit on a 16:9 image", () => {
    expect(deriveLockedDimension(1600, 900, "height", 450)).toBe(800);
  });

  it("never returns less than 1px", () => {
    expect(deriveLockedDimension(5000, 10, "width", 1)).toBeGreaterThanOrEqual(1);
  });
});
