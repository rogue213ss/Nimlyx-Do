import { describe, expect, it, vi } from "vitest";
import { convertPdfToJpg, type OpenedPdf, type RenderedPageResult } from "@/lib/pdf-to-jpg/convert";
import {
  looksLikePdfContent,
  pageFileName,
  parsePageRange,
  safeBaseName,
  validateFileMeta,
} from "@/lib/pdf-to-jpg/validation";
import type { PdfToJpgOptions } from "@/lib/pdf-to-jpg/types";

// --- validation.ts -------------------------------------------------------

describe("validateFileMeta / looksLikePdfContent (re-exported from pdf-merger)", () => {
  it("accepts a normal PDF", () => {
    expect(validateFileMeta({ name: "doc.pdf", type: "application/pdf", size: 1024 }).ok).toBe(true);
  });

  it("rejects a non-PDF file", () => {
    const result = validateFileMeta({ name: "photo.jpg", type: "image/jpeg", size: 1024 });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validateFileMeta({ name: "empty.pdf", type: "application/pdf", size: 0 }).ok).toBe(false);
  });

  it("recognizes the PDF magic header", () => {
    const bytes = new TextEncoder().encode("%PDF-1.7\n...");
    expect(looksLikePdfContent(bytes)).toBe(true);
  });

  it("rejects non-PDF content", () => {
    const bytes = new TextEncoder().encode("not a pdf at all");
    expect(looksLikePdfContent(bytes)).toBe(false);
  });
});

describe("parsePageRange", () => {
  it("accepts a single page", () => {
    const result = parsePageRange("3", 10);
    expect(result).toEqual({ ok: true, pages: [3] });
  });

  it("accepts a simple range", () => {
    const result = parsePageRange("1-3", 10);
    expect(result).toEqual({ ok: true, pages: [1, 2, 3] });
  });

  it("accepts a mix of ranges and single pages, de-duplicated and sorted", () => {
    const result = parsePageRange("5, 1-3, 3, 8", 10);
    expect(result).toEqual({ ok: true, pages: [1, 2, 3, 5, 8] });
  });

  it("tolerates extra whitespace", () => {
    const result = parsePageRange("  1 - 3 ,  5  ", 10);
    expect(result).toEqual({ ok: true, pages: [1, 2, 3, 5] });
  });

  it("rejects an empty string", () => {
    expect(parsePageRange("", 10).ok).toBe(false);
    expect(parsePageRange("   ", 10).ok).toBe(false);
  });

  it("rejects a page beyond the document's page count", () => {
    const result = parsePageRange("15", 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/doesn't exist/);
  });

  it("rejects a range that extends past the last page", () => {
    const result = parsePageRange("8-15", 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/last page/);
  });

  it("rejects an inverted range", () => {
    const result = parsePageRange("5-2", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects a page number of zero", () => {
    const result = parsePageRange("0", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects garbage tokens", () => {
    const result = parsePageRange("abc", 10);
    expect(result.ok).toBe(false);
  });

  it("rejects a selection exceeding the max page cap", () => {
    const result = parsePageRange("1-301", 500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Too many pages/);
  });
});

describe("safeBaseName", () => {
  it("strips the .pdf extension", () => {
    expect(safeBaseName("document.pdf")).toBe("document");
  });

  it("strips path-like segments defensively", () => {
    expect(safeBaseName("../../etc/passwd.pdf")).toBe("passwd");
  });

  it("replaces unsafe characters", () => {
    expect(safeBaseName("my report (final)!!.pdf")).toBe("my-report-final");
  });

  it("falls back to a fixed name when nothing usable remains", () => {
    expect(safeBaseName("....pdf")).toBe("document");
    expect(safeBaseName("###.pdf")).toBe("document");
  });
});

describe("pageFileName", () => {
  it("builds the expected output filename", () => {
    expect(pageFileName("document", 1)).toBe("document-page-1.jpg");
    expect(pageFileName("document", 12)).toBe("document-page-12.jpg");
  });
});

// --- convert.ts (orchestration, against a fake renderer) -----------------

function makeFakeOpener(pageCount: number, opts: { failOnPage?: number } = {}) {
  const renderPage = vi.fn(async (pageNumber: number): Promise<RenderedPageResult> => {
    if (opts.failOnPage === pageNumber) {
      throw new Error(`Rendering failed on page ${pageNumber}. It may use unsupported content.`);
    }
    return {
      bytes: new TextEncoder().encode(`fake-jpeg-bytes-page-${pageNumber}`).buffer,
      width: 100,
      height: 200,
    };
  });
  const destroy = vi.fn();
  const opener = async (): Promise<OpenedPdf> => ({ pageCount, renderPage, destroy });
  return { opener, renderPage, destroy };
}

const baseOptions: PdfToJpgOptions = { quality: "recommended", resolution: "standard" };

describe("convertPdfToJpg", () => {
  it("converts all pages by default, in order", async () => {
    const { opener } = makeFakeOpener(3);
    const result = await convertPdfToJpg(new Uint8Array([1]), "document.pdf", baseOptions, opener);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pages.map((p) => p.pageNumber)).toEqual([1, 2, 3]);
      expect(result.pages.map((p) => p.fileName)).toEqual([
        "document-page-1.jpg",
        "document-page-2.jpg",
        "document-page-3.jpg",
      ]);
    }
  });

  it("converts only the requested pages, in the requested order", async () => {
    const { opener, renderPage } = makeFakeOpener(10);
    const result = await convertPdfToJpg(
      new Uint8Array([1]),
      "doc.pdf",
      { ...baseOptions, pages: [8, 2] },
      opener
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pages.map((p) => p.pageNumber)).toEqual([8, 2]);
    expect(renderPage).toHaveBeenCalledTimes(2);
  });

  it("reports an error and stops if a page fails to render", async () => {
    const { opener } = makeFakeOpener(5, { failOnPage: 3 });
    const result = await convertPdfToJpg(new Uint8Array([1]), "doc.pdf", baseOptions, opener);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/page 3/);
  });

  it("rejects a page selection outside the document's real page count", async () => {
    const { opener } = makeFakeOpener(3);
    const result = await convertPdfToJpg(
      new Uint8Array([1]),
      "doc.pdf",
      { ...baseOptions, pages: [99] },
      opener
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an empty page selection", async () => {
    const { opener } = makeFakeOpener(3);
    const result = await convertPdfToJpg(new Uint8Array([1]), "doc.pdf", { ...baseOptions, pages: [] }, opener);
    expect(result.ok).toBe(false);
  });

  it("always destroys the opened document, even on failure", async () => {
    const { opener, destroy } = makeFakeOpener(5, { failOnPage: 2 });
    await convertPdfToJpg(new Uint8Array([1]), "doc.pdf", baseOptions, opener);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("surfaces the opener's error message when the document can't be opened at all", async () => {
    const failingOpener = async (): Promise<OpenedPdf> => {
      throw new Error("Couldn't read this PDF. It may be corrupt, password-protected, or unsupported.");
    };
    const result = await convertPdfToJpg(new Uint8Array([1]), "doc.pdf", baseOptions, failingOpener);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/corrupt/);
  });

  it("invokes onPage for each page as soon as it's rendered, and emits progress in order", async () => {
    const { opener } = makeFakeOpener(3);
    const seenPages: number[] = [];
    const stages: string[] = [];
    await convertPdfToJpg(
      new Uint8Array([1]),
      "doc.pdf",
      baseOptions,
      opener,
      (event) => stages.push(event.stage),
      (page) => seenPages.push(page.pageNumber)
    );
    expect(seenPages).toEqual([1, 2, 3]);
    expect(stages[0]).toBe("reading");
    expect(stages[1]).toBe("preparing");
    expect(stages[stages.length - 1]).toBe("preparing-downloads");
  });
});
