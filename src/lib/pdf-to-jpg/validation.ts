// Pure validation, page-range parsing, and filename logic for the
// PDF → JPG converter. No browser APIs — fully unit-testable without a
// DOM, same discipline as lib/pdf-merger/validation.ts.

// File-level validation (extension/MIME/size) and the real PDF magic-byte
// check are identical in spirit to the PDF Merger's, so they're re-used
// directly rather than re-implemented — one PDF-sniffing rule for the
// whole project.
export { looksLikePdfContent, validateFileMeta, type FileLike, type ValidationResult } from "@/lib/pdf-merger/validation";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB, matching PDF Merger/Compressor
export const MAX_PAGES_TO_CONVERT = 300; // generous but bounded — see PROJECT_CONTEXT.md limitations

/**
 * Parses a page-range string like "1-3, 5, 8" into a sorted, de-duplicated
 * list of 1-indexed page numbers, validated against the document's actual
 * page count. Returns an error instead of throwing so the UI can show a
 * clear message rather than crash on a typo.
 *
 * Deliberately simple: comma-separated tokens that are either a single
 * page number or a "start-end" range. No open-ended ranges, no negative
 * indexing, no whitespace-sensitive edge cases — anything not fitting
 * this shape is a validation error, per the brief's explicit instruction
 * not to let fragile parsing destabilize the core "all pages" workflow.
 */
export function parsePageRange(
  input: string,
  totalPages: number
): { ok: true; pages: number[] } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Enter at least one page number, e.g. \"1-3, 5, 8\"." };
  }

  const pages = new Set<number>();
  const tokens = trimmed.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return { ok: false, error: "Enter at least one page number, e.g. \"1-3, 5, 8\"." };
  }

  for (const token of tokens) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    const singleMatch = /^(\d+)$/.exec(token);

    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < 1 || start > end) {
        return { ok: false, error: `"${token}" isn't a valid page range.` };
      }
      if (end > totalPages) {
        return { ok: false, error: `"${token}" goes past the document's last page (${totalPages}).` };
      }
      for (let p = start; p <= end; p++) pages.add(p);
    } else if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > totalPages) {
        return { ok: false, error: `Page ${page} doesn't exist in this document (1-${totalPages}).` };
      }
      pages.add(page);
    } else {
      return { ok: false, error: `"${token}" isn't a valid page number or range.` };
    }
  }

  if (pages.size > MAX_PAGES_TO_CONVERT) {
    return { ok: false, error: `Too many pages selected — up to ${MAX_PAGES_TO_CONVERT} per conversion.` };
  }

  return { ok: true, pages: Array.from(pages).sort((a, b) => a - b) };
}

/**
 * Derives a safe base name from an uploaded filename: strips any
 * directory-like path segments (defense in depth — browsers don't expose
 * a real path via `File.name`, but nothing here should ever trust it),
 * drops the extension, strips characters outside a conservative safe
 * set, and falls back to a fixed name if nothing usable remains.
 */
export function safeBaseName(originalFileName: string): string {
  const lastSegment = originalFileName.split(/[\\/]/).pop() ?? "";
  const withoutExt = lastSegment.replace(/\.pdf$/i, "");
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  const hasUsableCharacter = /[a-zA-Z0-9]/.test(cleaned);
  return hasUsableCharacter ? cleaned : "document";
}

/** Builds the per-page output filename, e.g. "document-page-1.jpg". */
export function pageFileName(baseName: string, pageNumber: number): string {
  return `${baseName}-page-${pageNumber}.jpg`;
}
