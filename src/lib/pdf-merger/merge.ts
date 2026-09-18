// Core PDF merge logic. Deliberately environment-agnostic: no DOM, no
// File/Blob APIs — just bytes in, bytes out — so this same module runs
// identically inside the Worker (production) and directly in Vitest under
// Node (tests), with pdf-lib itself doing the real work in both places.
// This is what makes it possible to genuinely exercise real merges in
// tests rather than only testing surrounding glue code.

import { PDFDocument } from "pdf-lib";

export interface MergeInputFile {
  name: string;
  bytes: Uint8Array;
}

export interface MergeSuccess {
  ok: true;
  bytes: Uint8Array;
  pageCount: number;
}

export interface MergeFailure {
  ok: false;
  error: string;
  /** Which input file caused the failure, when known — lets the UI point
   * the user at the specific file to remove/replace rather than just
   * failing the whole batch with no direction. */
  failedFile?: string;
}

export type MergeResult = MergeSuccess | MergeFailure;

export type MergeProgressEvent =
  | { stage: "reading"; fileName: string; index: number; total: number }
  | { stage: "finalizing" };

/**
 * Merges PDFs in the given order, preserving each source document's
 * original pages (copied via pdf-lib's `copyPages`, never rendered to an
 * image and re-embedded) — so output quality, text selectability, and
 * embedded links/fonts are all preserved exactly as in the source files.
 *
 * `onProgress`, if given, is called with real, truthful stage information
 * as each file is actually read — never a synthetic percentage.
 */
export async function mergePdfs(
  files: MergeInputFile[],
  onProgress?: (event: MergeProgressEvent) => void
): Promise<MergeResult> {
  if (files.length === 0) {
    return { ok: false, error: "Add at least one PDF to merge." };
  }

  const merged = await PDFDocument.create();

  for (const [index, file] of files.entries()) {
    onProgress?.({ stage: "reading", fileName: file.name, index: index + 1, total: files.length });

    let source: PDFDocument;
    try {
      source = await PDFDocument.load(file.bytes, { ignoreEncryption: false });
    } catch {
      return {
        ok: false,
        error: `Couldn't read "${file.name}". It may be corrupt, password-protected, or not a valid PDF.`,
        failedFile: file.name,
      };
    }

    try {
      const pageIndices = source.getPageIndices();
      const copiedPages = await merged.copyPages(source, pageIndices);
      for (const page of copiedPages) merged.addPage(page);
    } catch {
      return {
        ok: false,
        error: `Couldn't merge "${file.name}". It may use a PDF feature that isn't supported.`,
        failedFile: file.name,
      };
    }
  }

  onProgress?.({ stage: "finalizing" });

  try {
    const bytes = await merged.save();
    return { ok: true, bytes, pageCount: merged.getPageCount() };
  } catch {
    return {
      ok: false,
      error: "Couldn't finalize the merged PDF. Try again, or remove any unusual files and retry.",
    };
  }
}
