// Pure calculation functions for the percentage calculator.
// No React, no DOM — this file is unit-testable in isolation and could be
// reused by a future API endpoint without modification.

export type PercentageMode =
  | "percent-of"
  | "increase-decrease"
  | "what-percent"
  | "difference";

export type CalculationResult =
  | { ok: true; value: number; display: string }
  | { ok: false; error: string };

const MAX_SAFE_INPUT = 1e15;

function isFiniteNumber(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n) <= MAX_SAFE_INPUT;
}

// Formats a number for display: strips floating-point noise, keeps up to
// 6 significant decimal places, and avoids scientific notation for the
// ranges this tool realistically sees.
export function formatResult(n: number): string {
  if (Object.is(n, -0)) n = 0;
  const rounded = Math.round(n * 1e6) / 1e6;
  return rounded.toString();
}

/** X% of Y */
export function percentOf(percent: number, base: number): CalculationResult {
  if (!isFiniteNumber(percent) || !isFiniteNumber(base)) {
    return { ok: false, error: "Enter valid numbers." };
  }
  const value = (percent / 100) * base;
  return { ok: true, value, display: formatResult(value) };
}

/** Percentage increase or decrease from oldValue to newValue. */
export function percentageChange(
  oldValue: number,
  newValue: number
): CalculationResult {
  if (!isFiniteNumber(oldValue) || !isFiniteNumber(newValue)) {
    return { ok: false, error: "Enter valid numbers." };
  }
  if (oldValue === 0) {
    return {
      ok: false,
      error: "The original value can't be 0 — percentage change is undefined.",
    };
  }
  const value = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  return { ok: true, value, display: formatResult(value) };
}

/** X is what percent of Y */
export function whatPercent(x: number, y: number): CalculationResult {
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
    return { ok: false, error: "Enter valid numbers." };
  }
  if (y === 0) {
    return { ok: false, error: "The second number can't be 0." };
  }
  const value = (x / y) * 100;
  return { ok: true, value, display: formatResult(value) };
}

/** Percentage difference between two values, relative to their average. */
export function percentageDifference(a: number, b: number): CalculationResult {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return { ok: false, error: "Enter valid numbers." };
  }
  const average = (a + b) / 2;
  if (average === 0) {
    return {
      ok: false,
      error: "Percentage difference is undefined when both numbers average to 0.",
    };
  }
  const value = (Math.abs(a - b) / Math.abs(average)) * 100;
  return { ok: true, value, display: formatResult(value) };
}
