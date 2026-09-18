// Pure validation, page-range parsing, and filename logic for the PDF
// Splitter. No browser APIs — fully unit-testable, same discipline as
// pdf-merger/validation.ts and pdf-to-jpg/validation.ts.

export { looksLikePdfContent, validateFileMeta, type FileLike, type ValidationResult } from "@/lib/pdf-merger/validation";

export const MAX_SPLIT_OUTPUTS = 300; // matches PDF to JPG's per-conversion cap

/**
 * Parses a "ranges" string like "1-3, 4-6, 10" into a list of output
 * groups, where each comma-separated token becomes its OWN output PDF
 * (unlike PDF to JPG's page-range parser, which flattens everything into
 * one combined page list). "1-3, 4-6, 10" produces three output files:
 * pages [1,2,3], [4,5,6], and [10].
 *
 * Same deliberately simple grammar as PDF to JPG: single pages or
 * "start-end" ranges only, validated against the real page count.
 */
export function parseSplitRanges(
  input: string,
  totalPages: number
): { ok: true; groups: number[][] } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Enter at least one page or range, e.g. \"1-3, 4-6, 10\"." };
  }

  const tokens = trimmed.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
  if (tokens.length === 0) {
    return { ok: false, error: "Enter at least one page or range, e.g. \"1-3, 4-6, 10\"." };
  }
  if (tokens.length > MAX_SPLIT_OUTPUTS) {
    return { ok: false, error: `Too many output files requested — up to ${MAX_SPLIT_OUTPUTS} per split.` };
  }

  const groups: number[][] = [];
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
      const group: number[] = [];
      for (let p = start; p <= end; p++) group.push(p);
      groups.push(group);
    } else if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > totalPages) {
        return { ok: false, error: `Page ${page} doesn't exist in this document (1-${totalPages}).` };
      }
      groups.push([page]);
    } else {
      return { ok: false, error: `"${token}" isn't a valid page number or range.` };
    }
  }

  return { ok: true, groups };
}

/** Derives a safe base name from an uploaded filename — identical rule to
 * PDF to JPG's, kept in sync deliberately rather than re-derived
 * differently per tool. */
export function safeBaseName(originalFileName: string): string {
  const lastSegment = originalFileName.split(/[\\/]/).pop() ?? "";
  const withoutExt = lastSegment.replace(/\.pdf$/i, "");
  const cleaned = withoutExt.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  const hasUsableCharacter = /[a-zA-Z0-9]/.test(cleaned);
  return hasUsableCharacter ? cleaned : "document";
}

/** Output filename for splitting into individual single-page PDFs. */
export function singlePageFileName(baseName: string, pageNumber: number): string {
  return `${baseName}-page-${pageNumber}.pdf`;
}

/** Output filename for a custom range/group — describes the page span so
 * downloaded files are self-explanatory without opening them. */
export function rangeFileName(baseName: string, group: number[]): string {
  const first = group[0];
  const last = group[group.length - 1];
  const label = group.length === 1 || first === last ? `${first}` : `${first}-${last}`;
  return `${baseName}-pages-${label}.pdf`;
}
