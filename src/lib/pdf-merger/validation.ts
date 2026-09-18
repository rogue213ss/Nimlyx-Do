// Pure validation and ordering logic for the PDF Merger. No browser APIs
// beyond duck-typed shapes — fully unit-testable without a DOM.

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB per file — PDFs
// legitimately run larger than images; kept generous but bounded given
// everything happens in-memory in the browser.
export const MAX_FILE_COUNT = 30;

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export type ValidationResult = { ok: true } | { ok: false; error: string };

/** Metadata-level validation (type/name/size) — cheap, synchronous, run
 * before any actual PDF parsing. Real PDF content is verified separately
 * (see `looksLikePdfContent`) since MIME type and extension are both
 * trivially spoofable and shouldn't be trusted alone. */
export function validateFileMeta(file: FileLike): ValidationResult {
  const looksLikePdfType = file.type === "application/pdf" || file.type === "";
  const looksLikePdfName = /\.pdf$/i.test(file.name);
  if (!looksLikePdfType && !looksLikePdfName) {
    return { ok: false, error: `${file.name}: not a PDF file.` };
  }
  if (file.size <= 0) {
    return { ok: false, error: `${file.name}: this file appears to be empty.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `${file.name}: file too large. Maximum size is 100 MB.` };
  }
  return { ok: true };
}

export interface BatchValidationResult<F extends FileLike> {
  accepted: F[];
  rejected: { file: F; error: string }[];
  batchWarning?: string;
}

/** Validates a batch of newly added files against the existing queue size,
 * enforcing MAX_FILE_COUNT across (not just within) the batch, and
 * validates each remaining file individually. One invalid file never blocks
 * the others. */
export function validateBatchMeta<F extends FileLike>(
  existingCount: number,
  incoming: F[]
): BatchValidationResult<F> {
  const room = Math.max(0, MAX_FILE_COUNT - existingCount);
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
    batchWarning: overflow
      ? `Only ${room} more file${room === 1 ? "" : "s"} could be added — the limit is ${MAX_FILE_COUNT} PDFs.`
      : undefined,
  };
}

const PDF_MAGIC = "%PDF-";

/** Checks the actual file content for the PDF magic header, rather than
 * trusting MIME type or file extension alone. A real PDF can technically
 * have leading bytes before "%PDF-" (some tools prepend junk), but
 * requiring it at the very start is a reasonable, simple V1 check — the
 * real correctness check is still `PDFDocument.load` itself, which will
 * reject anything this heuristic lets through but isn't truly valid. */
export function looksLikePdfContent(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false;
  let header = "";
  for (let i = 0; i < PDF_MAGIC.length; i++) {
    header += String.fromCharCode(bytes[i] ?? 0);
  }
  return header === PDF_MAGIC;
}

/** Moves the item at `fromIndex` to `toIndex`, clamping the destination
 * into bounds. Returns a new array; never mutates the input. A no-op
 * (returns the same array reference) for an out-of-range `fromIndex` or a
 * same-position move. */
export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  const clampedTo = Math.max(0, Math.min(toIndex, items.length - 1));
  if (fromIndex === clampedTo) return items;
  const copy = items.slice();
  const moved = copy.splice(fromIndex, 1)[0] as T;
  copy.splice(clampedTo, 0, moved);
  return copy;
}

export function moveUp<T>(items: T[], index: number): T[] {
  return moveItem(items, index, index - 1);
}

export function moveDown<T>(items: T[], index: number): T[] {
  return moveItem(items, index, index + 1);
}
