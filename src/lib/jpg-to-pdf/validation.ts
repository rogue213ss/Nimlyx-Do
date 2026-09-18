// Pure validation, real image-content detection, and batch/ordering logic
// for JPG to PDF. No browser APIs — fully unit-testable, same discipline
// as pdf-merger/validation.ts (whose MAX_FILE_COUNT / move-up / move-down
// helpers are re-used directly since queue reordering is identical).

export { MAX_FILE_COUNT, moveDown, moveUp } from "@/lib/pdf-merger/validation";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per image — generous for a photo/scan

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

/** Metadata-level validation (type/name/size) — cheap, synchronous, run
 * before any actual image decoding. Real content is verified separately
 * via `detectImageKind`, since MIME type and extension are both trivially
 * spoofable and shouldn't be trusted alone. */
export function validateFileMeta(file: FileLike): ValidationResult {
  const looksLikeImageType = file.type === "image/jpeg" || file.type === "image/png" || file.type === "";
  const looksLikeImageName = /\.(jpe?g|png)$/i.test(file.name);
  if (!looksLikeImageType && !looksLikeImageName) {
    return { ok: false, error: `${file.name}: not a JPG or PNG image.` };
  }
  if (file.size <= 0) {
    return { ok: false, error: `${file.name}: this file appears to be empty.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `${file.name}: file too large. Maximum size is 50 MB.` };
  }
  return { ok: true };
}

export interface BatchValidationResult<F extends FileLike> {
  accepted: F[];
  rejected: { file: F; error: string }[];
  batchWarning?: string;
}

/** Validates a batch of newly added images against the existing queue
 * size, enforcing MAX_FILE_COUNT across (not just within) the batch. One
 * invalid file never blocks the others. Mirrors pdf-merger's
 * `validateBatchMeta` exactly, just against image rules instead of PDF
 * rules — kept as its own function since the two file-type checks
 * genuinely differ, not because the batching logic itself is different. */
export function validateBatchMeta<F extends FileLike>(existingCount: number, incoming: F[]): BatchValidationResult<F> {
  const MAX = 50; // generous for a multi-page scan-to-PDF session
  const room = Math.max(0, MAX - existingCount);
  const overflow = incoming.length > room;
  const candidates = incoming.slice(0, room);

  const accepted: F[] = [];
  const rejected: { file: F; error: string }[] = [];
  for (const file of candidates) {
    const result = validateFileMeta(file);
    if (result.ok) accepted.push(file);
    else rejected.push({ file, error: result.error });
  }

  return {
    accepted,
    rejected,
    batchWarning: overflow ? `Only ${room} more image${room === 1 ? "" : "s"} could be added — the limit is ${MAX}.` : undefined,
  };
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Checks the actual file bytes for a real JPEG or PNG signature, rather
 * than trusting MIME type or file extension. Returns `null` for anything
 * else (including corrupt/truncated files), so the caller can reject with
 * a clear message instead of attempting to embed unrecognized bytes. */
export function detectImageKind(bytes: Uint8Array): "jpeg" | "png" | null {
  if (bytes.length >= JPEG_MAGIC.length && JPEG_MAGIC.every((b, i) => bytes[i] === b)) return "jpeg";
  if (bytes.length >= PNG_MAGIC.length && PNG_MAGIC.every((b, i) => bytes[i] === b)) return "png";
  return null;
}

/** Derives a safe output filename base — same rule used by PDF to JPG and
 * PDF Splitter, kept consistent across all three rather than re-derived
 * differently per tool. */
export function safeBaseName(input: string): string {
  const lastSegment = input.split(/[\\/]/).pop() ?? "";
  const withoutExt = lastSegment.replace(/\.(jpe?g|png|pdf)$/i, "");
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  const hasUsableCharacter = /[a-zA-Z0-9]/.test(cleaned);
  return hasUsableCharacter ? cleaned : "images";
}
