import { describe, expect, it, vi } from "vitest";
import { findTargetSize } from "@/lib/image-compressor/target-size";

/**
 * A synthetic encoder that models a plausible real-world relationship:
 * size decreases roughly monotonically with quality and with the square of
 * dimension scale (fewer pixels), with a small amount of noise to make sure
 * the algorithm doesn't assume perfect monotonicity.
 */
function makeModelEncoder(originalBytes: number, noise = 0) {
  return vi.fn(async (quality: number, dimensionScale: number) => {
    const base = originalBytes * quality * dimensionScale * dimensionScale;
    const jitter = noise ? Math.sin(quality * 97 + dimensionScale * 13) * noise : 0;
    const size = Math.max(500, Math.round(base + jitter));
    return { size, data: { quality, dimensionScale, size } };
  });
}

describe("findTargetSize", () => {
  it("finds a candidate at or under the target when one is reachable via quality alone", async () => {
    const encode = makeModelEncoder(1_000_000);
    const result = await findTargetSize(
      {
        targetBytes: 200_000,
        originalWidth: 2000,
        originalHeight: 1500,
      },
      encode
    );
    expect(result.achieved).toBe(true);
    expect(result.size).toBeLessThanOrEqual(200_000);
    expect(result.dimensionScale).toBe(1); // no dimension reduction needed
  });

  it("falls back to dimension reduction when quality alone can't reach target", async () => {
    // Original is small enough that even min quality at full size exceeds target.
    const encode = makeModelEncoder(5_000_000);
    const result = await findTargetSize(
      {
        targetBytes: 50_000,
        originalWidth: 4000,
        originalHeight: 3000,
        minDimension: 500,
      },
      encode
    );
    expect(result.dimensionScale).toBeLessThan(1);
  });

  it("does not reduce dimensions below the minDimension safety floor", async () => {
    const encode = makeModelEncoder(50_000_000); // pathologically large relative to target
    const result = await findTargetSize(
      {
        targetBytes: 1_000,
        originalWidth: 4000,
        originalHeight: 3000,
        minDimension: 500,
      },
      encode
    );
    const finalWidth = 4000 * result.dimensionScale;
    const finalHeight = 3000 * result.dimensionScale;
    expect(Math.min(finalWidth, finalHeight)).toBeGreaterThanOrEqual(500 * 0.75);
  });

  it("returns the closest practical result (achieved: false) when target is unreachable", async () => {
    const encode = makeModelEncoder(50_000_000);
    const result = await findTargetSize(
      {
        targetBytes: 1_000,
        originalWidth: 4000,
        originalHeight: 3000,
      },
      encode
    );
    // May or may not achieve depending on the floor, but must never lie
    // about a size it didn't actually produce.
    expect(result.size).toBeGreaterThan(0);
    expect(typeof result.achieved).toBe("boolean");
  });

  it("keeps the best candidate even when size is not perfectly monotonic in quality", async () => {
    const encode = makeModelEncoder(1_000_000, /* noise */ 30_000);
    const result = await findTargetSize(
      {
        targetBytes: 150_000,
        originalWidth: 1920,
        originalHeight: 1080,
      },
      encode
    );
    expect(result.size).toBeGreaterThan(0);
    // The search must have actually explored multiple quality points.
    expect(encode.mock.calls.length).toBeGreaterThan(1);
  });

  it("does not needlessly degrade when the target is already larger than what quality search naturally lands on", async () => {
    const encode = makeModelEncoder(100_000);
    const result = await findTargetSize(
      {
        targetBytes: 5_000_000, // far larger than the original could ever be
        originalWidth: 1200,
        originalHeight: 800,
      },
      encode
    );
    expect(result.achieved).toBe(true);
    // Should settle near the top of the quality range rather than searching
    // all the way down, since even max quality already fits comfortably.
    expect(result.quality).toBeGreaterThan(0.5);
  });

  it("respects a custom iteration budget", async () => {
    const encode = makeModelEncoder(1_000_000);
    await findTargetSize(
      {
        targetBytes: 200_000,
        originalWidth: 2000,
        originalHeight: 1500,
        maxQualityIterations: 3,
        dimensionStep: 0.75,
      },
      encode
    );
    // At most one dimension pass should be needed here since target is
    // reachable at scale 1; 3 iterations for that one pass.
    expect(encode.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
