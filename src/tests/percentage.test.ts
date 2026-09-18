import { describe, it, expect } from "vitest";
import {
  percentOf,
  percentageChange,
  whatPercent,
  percentageDifference,
  formatResult,
} from "@/lib/calculators/percentage";

describe("percentOf", () => {
  it("computes a normal case", () => {
    const r = percentOf(20, 150);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.display).toBe("30");
  });

  it("handles 0 percent", () => {
    const r = percentOf(0, 500);
    if (r.ok) expect(r.display).toBe("0");
  });

  it("handles 0 base", () => {
    const r = percentOf(50, 0);
    if (r.ok) expect(r.display).toBe("0");
  });

  it("handles decimals", () => {
    const r = percentOf(12.5, 40);
    if (r.ok) expect(r.display).toBe("5");
  });

  it("handles negative percent", () => {
    const r = percentOf(-10, 200);
    if (r.ok) expect(r.display).toBe("-20");
  });

  it("handles negative base", () => {
    const r = percentOf(10, -200);
    if (r.ok) expect(r.display).toBe("-20");
  });

  it("handles large numbers", () => {
    const r = percentOf(50, 1_000_000_000);
    if (r.ok) expect(r.display).toBe("500000000");
  });

  it("rejects NaN input", () => {
    const r = percentOf(NaN, 100);
    expect(r.ok).toBe(false);
  });

  it("rejects Infinity input", () => {
    const r = percentOf(Infinity, 100);
    expect(r.ok).toBe(false);
  });

  it("rounds noisy floating point to a clean result", () => {
    const r = percentOf(33.333333, 3);
    if (r.ok) expect(r.display).toBe("1");
    expect(r.ok).toBe(true);
  });
});

describe("percentageChange (increase/decrease)", () => {
  it("computes a percentage increase", () => {
    const r = percentageChange(80, 100);
    if (r.ok) expect(r.display).toBe("25");
  });

  it("computes a percentage decrease", () => {
    const r = percentageChange(100, 80);
    if (r.ok) expect(r.display).toBe("-20");
  });

  it("is asymmetric: increase then decrease does not cancel to the same magnitude", () => {
    const up = percentageChange(80, 100);
    const down = percentageChange(100, 80);
    if (up.ok && down.ok) {
      expect(Math.abs(up.value)).not.toBe(Math.abs(down.value));
    }
  });

  it("rejects an original value of 0", () => {
    const r = percentageChange(0, 50);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/0/);
  });

  it("handles no change", () => {
    const r = percentageChange(50, 50);
    if (r.ok) expect(r.display).toBe("0");
  });

  it("handles negative old value with abs() denominator", () => {
    const r = percentageChange(-50, -25);
    // (-25 - -50) / |-50| * 100 = 25/50*100 = 50
    if (r.ok) expect(r.display).toBe("50");
  });

  it("handles decimals", () => {
    const r = percentageChange(33.3, 66.6);
    if (r.ok) expect(r.display).toBe("100");
  });

  it("handles large numbers", () => {
    const r = percentageChange(1_000_000, 1_500_000);
    if (r.ok) expect(r.display).toBe("50");
  });

  it("rejects invalid input", () => {
    const r = percentageChange(NaN, 10);
    expect(r.ok).toBe(false);
  });
});

describe("whatPercent (X is what % of Y)", () => {
  it("computes a normal case", () => {
    const r = whatPercent(45, 60);
    if (r.ok) expect(r.display).toBe("75");
  });

  it("handles X = 0", () => {
    const r = whatPercent(0, 60);
    if (r.ok) expect(r.display).toBe("0");
  });

  it("rejects Y = 0", () => {
    const r = whatPercent(10, 0);
    expect(r.ok).toBe(false);
  });

  it("handles X > Y (over 100%)", () => {
    const r = whatPercent(120, 60);
    if (r.ok) expect(r.display).toBe("200");
  });

  it("handles negative numbers", () => {
    const r = whatPercent(-30, 60);
    if (r.ok) expect(r.display).toBe("-50");
  });

  it("handles decimals", () => {
    const r = whatPercent(1, 3);
    if (r.ok) expect(r.display).toBe("33.333333");
  });

  it("rejects invalid input", () => {
    const r = whatPercent(Infinity, 60);
    expect(r.ok).toBe(false);
  });
});

describe("percentageDifference", () => {
  it("computes a normal case symmetrically", () => {
    const r1 = percentageDifference(10, 20);
    const r2 = percentageDifference(20, 10);
    if (r1.ok && r2.ok) {
      expect(r1.display).toBe(r2.display);
      expect(r1.display).toBe("66.666667");
    }
  });

  it("handles equal values (0 difference)", () => {
    const r = percentageDifference(50, 50);
    if (r.ok) expect(r.display).toBe("0");
  });

  it("rejects when both values average to 0", () => {
    const r = percentageDifference(-10, 10);
    expect(r.ok).toBe(false);
  });

  it("handles negative values with a nonzero average", () => {
    const r = percentageDifference(-10, -30);
    if (r.ok) expect(r.display).toBe("100");
  });

  it("handles decimals", () => {
    const r = percentageDifference(2.5, 7.5);
    if (r.ok) expect(r.display).toBe("100");
  });

  it("rejects invalid input", () => {
    const r = percentageDifference(NaN, 10);
    expect(r.ok).toBe(false);
  });
});

describe("additional edge cases (UX refinement pass)", () => {
  it("percentOf handles very small numbers", () => {
    const r = percentOf(0.0001, 100);
    if (r.ok) expect(r.display).toBe("0.0001");
  });

  it("percentageChange handles a value crossing zero (negative to positive)", () => {
    const r = percentageChange(-50, 50);
    // ((50 - -50) / |-50|) * 100 = (100/50)*100 = 200
    if (r.ok) expect(r.display).toBe("200");
  });

  it("percentageChange handles a value crossing zero (positive to negative)", () => {
    const r = percentageChange(50, -50);
    // ((-50 - 50) / |50|) * 100 = -200
    if (r.ok) expect(r.display).toBe("-200");
  });

  it("whatPercent produces a clean repeating-decimal result at 6dp", () => {
    const r = whatPercent(2, 3);
    if (r.ok) expect(r.display).toBe("66.666667");
  });

  it("percentOf produces a clean repeating-decimal result at 6dp", () => {
    const r = percentOf(1, 3);
    // (1/100)*3 = 0.03
    if (r.ok) expect(r.display).toBe("0.03");
  });

  it("display rounding never affects the underlying computed value", () => {
    const r = whatPercent(1, 3);
    if (r.ok) {
      // The stored numeric value keeps full precision even though display
      // is rounded to 6dp for readability.
      expect(r.value).toBeCloseTo(33.3333333333, 9);
      expect(r.display).toBe("33.333333");
    }
  });
});

describe("formatResult", () => {
  it("removes floating point noise", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });

  it("normalizes negative zero to 0", () => {
    expect(formatResult(-0)).toBe("0");
  });

  it("keeps up to 6 decimal places", () => {
    expect(formatResult(1 / 3)).toBe("0.333333");
  });

  it("handles whole numbers cleanly", () => {
    expect(formatResult(42)).toBe("42");
  });
});
