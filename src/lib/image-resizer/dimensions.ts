// Pure dimension logic for the Image Resizer. No browser APIs — fully
// unit-testable, same pattern as image-compressor/validation.ts.

export const MIN_OUTPUT_DIMENSION = 1;
export const MAX_OUTPUT_DIMENSION = 10000; // sanity ceiling on requested OUTPUT size,
// independent of the 4096px SOURCE decode-safety bound in
// image-compressor/validation.ts (reused as-is for the source-side guard).

export type DimensionInputValidation =
  | { ok: true; value: number | undefined } // undefined = field left blank
  | { ok: false; error: string };

/** Parses one width/height text field. Blank is valid (means "not set" —
 * the caller decides what that implies); anything else must be a positive
 * number within the sanity ceiling. */
export function parseDimensionInput(raw: string): DimensionInputValidation {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, value: undefined };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return { ok: false, error: "Enter a valid number." };
  }
  if (n <= 0) {
    return { ok: false, error: "Must be greater than 0." };
  }
  if (n > MAX_OUTPUT_DIMENSION) {
    return { ok: false, error: `Can't exceed ${MAX_OUTPUT_DIMENSION}px.` };
  }
  return { ok: true, value: Math.round(n) };
}

export interface ResolveDimensionsInput {
  originalWidth: number;
  originalHeight: number;
  targetWidth?: number;
  targetHeight?: number;
  lockAspectRatio: boolean;
}

export type ResolveDimensionsResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: string };

/**
 * Resolves the final width/height to actually resize to, given whatever
 * the user has entered. This is the single source of truth called right
 * before dispatching a resize job — `deriveLockedDimension` below is a
 * lighter-weight helper for live UI feedback while the user is still
 * typing, not a replacement for this validation.
 */
export function resolveTargetDimensions(
  input: ResolveDimensionsInput
): ResolveDimensionsResult {
  const { originalWidth, originalHeight, lockAspectRatio, targetWidth, targetHeight } = input;

  if (
    !Number.isFinite(originalWidth) ||
    !Number.isFinite(originalHeight) ||
    originalWidth <= 0 ||
    originalHeight <= 0
  ) {
    return { ok: false, error: "Couldn't read the image's dimensions." };
  }

  if (targetWidth === undefined && targetHeight === undefined) {
    return { ok: false, error: "Enter a width or height." };
  }

  const ratio = originalWidth / originalHeight;
  let width: number;
  let height: number;

  if (lockAspectRatio) {
    if (targetWidth !== undefined) {
      width = targetWidth;
      height = Math.max(MIN_OUTPUT_DIMENSION, Math.round(targetWidth / ratio));
    } else {
      // targetHeight must be defined — the "both undefined" case returned above.
      height = targetHeight as number;
      width = Math.max(MIN_OUTPUT_DIMENSION, Math.round(height * ratio));
    }
  } else {
    // Unlocked: a field left blank holds at the original value for that axis.
    width = targetWidth ?? originalWidth;
    height = targetHeight ?? originalHeight;
  }

  if (width < MIN_OUTPUT_DIMENSION || height < MIN_OUTPUT_DIMENSION) {
    return {
      ok: false,
      error: `Width and height must be at least ${MIN_OUTPUT_DIMENSION}px.`,
    };
  }
  if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION) {
    return {
      ok: false,
      error: `Width and height can't exceed ${MAX_OUTPUT_DIMENSION}px.`,
    };
  }

  return { ok: true, width: Math.round(width), height: Math.round(height) };
}

/**
 * Live-updates the "other" dimension while the aspect ratio is locked and
 * the user is actively editing one field, for instant UI feedback before
 * they commit with the Resize action. Not used for the final resize
 * request itself — `resolveTargetDimensions` is.
 */
export function deriveLockedDimension(
  originalWidth: number,
  originalHeight: number,
  changedAxis: "width" | "height",
  value: number
): number {
  const ratio = originalWidth / originalHeight;
  if (changedAxis === "width") {
    return Math.max(MIN_OUTPUT_DIMENSION, Math.round(value / ratio));
  }
  return Math.max(MIN_OUTPUT_DIMENSION, Math.round(value * ratio));
}
