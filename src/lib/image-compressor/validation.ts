// Pure validation and formatting logic for the Image Compressor.
// Deliberately duck-typed (FileLike) rather than requiring a real `File`
// object, so this is fully unit-testable in Node/Vitest without jsdom.

import { SUPPORTED_INPUT_TYPES, type SupportedInputType } from "./types";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_BATCH_SIZE = 20;
export const MAX_WORKING_DIMENSION = 4096;
export const MIN_TARGET_DIMENSION = 500;

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/** Validates a single file against format and size constraints. */
export function validateFile(file: FileLike): ValidationResult {
  if (!isSupportedType(file.type)) {
    return {
      ok: false,
      error: `${file.name}: unsupported format. Use JPG, PNG, or WebP.`,
    };
  }
  if (file.size <= 0) {
    return { ok: false, error: `${file.name}: this file appears to be empty.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `${file.name}: file too large. Maximum size is 50 MB.`,
    };
  }
  return { ok: true };
}

export function isSupportedType(type: string): type is SupportedInputType {
  return (SUPPORTED_INPUT_TYPES as readonly string[]).includes(type);
}

export interface BatchValidationResult<F extends FileLike> {
  accepted: F[];
  rejected: { file: F; error: string }[];
  /** Set when more files were provided than MAX_BATCH_SIZE allows. */
  batchWarning?: string;
}

/**
 * Validates a batch of files: enforces the 20-file cap and validates each
 * remaining file individually. One invalid file never blocks the others.
 */
export function validateBatch<F extends FileLike>(files: F[]): BatchValidationResult<F> {
  const overflow = files.length > MAX_BATCH_SIZE;
  const candidates = overflow ? files.slice(0, MAX_BATCH_SIZE) : files;

  const accepted: F[] = [];
  const rejected: { file: F; error: string }[] = [];

  for (const file of candidates) {
    const result = validateFile(file);
    if (result.ok) {
      accepted.push(file);
    } else {
      rejected.push({ file, error: result.error });
    }
  }

  return {
    accepted,
    rejected,
    batchWarning: overflow
      ? `Only the first ${MAX_BATCH_SIZE} files were added. Maximum batch size is ${MAX_BATCH_SIZE}.`
      : undefined,
  };
}

/**
 * Given the true dimensions of a decoded image, returns dimensions clamped
 * to the safe working bound (4096px on the longer side), preserving aspect
 * ratio. This runs BEFORE any expensive compression work, per the large-image
 * safety requirement.
 */
export function computeSafeDimensions(
  width: number,
  height: number
): { width: number; height: number; wasScaled: boolean } {
  if (width <= MAX_WORKING_DIMENSION && height <= MAX_WORKING_DIMENSION) {
    return { width, height, wasScaled: false };
  }
  const scale = MAX_WORKING_DIMENSION / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    wasScaled: true,
  };
}

export type TargetSizeValidation =
  | { ok: true; bytes: number }
  | { ok: false; error: string };

/**
 * Validates raw user input from the "target size (KB)" field.
 * Accepts decimal input, rejects zero/negative/non-numeric/unreasonable
 * values with a message the user can act on.
 */
export function validateTargetSizeInput(rawKb: string): TargetSizeValidation {
  const trimmed = rawKb.trim();
  if (trimmed === "") {
    return { ok: false, error: "Enter a target size." };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return { ok: false, error: "Enter a valid number." };
  }
  if (n <= 0) {
    return { ok: false, error: "Target size must be greater than 0." };
  }
  const bytes = Math.round(n * 1024);
  if (bytes < 1024) {
    return { ok: false, error: "Target size is too small to be practical (minimum 1 KB)." };
  }
  if (bytes > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "Target size is larger than the maximum file size we accept." };
  }
  return { ok: true, bytes };
}

/** Formats a byte count for display, e.g. "145 KB", "5.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

/** Percentage saved, clamped to a sane display range. */
export function percentSaved(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0) return 0;
  const saved = Math.round((1 - resultBytes / originalBytes) * 100);
  return Math.max(-999, Math.min(100, saved));
}
