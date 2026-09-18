import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { splitPdf } from "@/lib/pdf-splitter/split";
import {
  looksLikePdfContent,
  parseSplitRanges,
  rangeFileName,
  safeBaseName,
  singlePageFileName,
  validateFileMeta,
} from "@/lib/pdf-splitter/validation";

// --- validation.ts -------------------------------------------------------

describe("validateFileMeta / looksLikePdfContent (re-exported from pdf-merger)", () => {
  it("accepts a normal PDF", () => {
    expect(validateFileMeta({ name: "doc.pdf", type: "application/pdf", size: 1024 }).ok).toBe(true);
  });

  it("rejects a non-PDF file", () => {
    expect(validateFileMeta({ name: "photo.jpg", type: "image/jpeg", size: 1024 }).ok).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(validateFileMeta({ name: "empty.pdf", type: "application/pdf", size: 0 }).ok).toBe(false);
  });

  it("recognizes the PDF magic header", () => {
    expect(looksLikePdfContent(new TextEncoder().encode("%PDF-1.7\n..."))).toBe(true);
  });

  it("rejects non-PDF content", () => {
    expect(looksLikePdfContent(new TextEncoder().encode("not a pdf"))).toBe(false);
  });
});

describe("parseSplitRanges", () => {
  it("treats each comma-separated token as its own output group", () => {
    const result = parseSplitRanges("1-3, 4-6, 10", 10);
    expect(result).toEqual({ ok: true, groups: [[1, 2, 3], [4, 5, 6], [10]] });
  });

  it("accepts a single page as its own group", () => {
    expect(parseSplitRanges("5", 10)).toEqual({ ok: true, groups: [[5]] });
  });

  it("tolerates extra whitespace", () => {
    expect(parseSplitRanges("  1 - 2 ,  4  ", 10)).toEqual({ ok: true, groups: [[1, 2], [4]] });
  });

  it("rejects an empty string", () => {
    expect(parseSplitRanges("", 10).ok).toBe(false);
    expect(parseSplitRanges("   ", 10).ok).toBe(false);
  });

  it("rejects a page beyond the document's page count", () => {
    const result = parseSplitRanges("15", 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/doesn't exist/);
  });

  it("rejects a range extending past the last page", () => {
    const result = parseSplitRanges("8-15", 10);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/last page/);
  });

  it("rejects an inverted range", () => {
    expect(parseSplitRanges("5-2", 10).ok).toBe(false);
  });

  it("rejects garbage tokens", () => {
    expect(parseSplitRanges("abc", 10).ok).toBe(false);
  });

  it("rejects too many output groups", () => {
    const manyTokens = Array.from({ length: 301 }, (_, i) => `${i + 1}`).join(",");
    const result = parseSplitRanges(manyTokens, 500);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Too many/);
  });
});

describe("safeBaseName", () => {
  it("strips the .pdf extension", () => {
    expect(safeBaseName("document.pdf")).toBe("document");
  });

  it("strips path-like segments defensively", () => {
    expect(safeBaseName("../../etc/passwd.pdf")).toBe("passwd");
  });

  it("falls back to a fixed name when nothing usable remains", () => {
    expect(safeBaseName("....pdf")).toBe("document");
  });
});

describe("filenames", () => {
  it("builds single-page filenames", () => {
    expect(singlePageFileName("document", 3)).toBe("document-page-3.pdf");
  });

  it("builds range filenames for a multi-page group", () => {
    expect(rangeFileName("document", [4, 5, 6])).toBe("document-pages-4-6.pdf");
  });

  it("builds range filenames for a single-page group", () => {
    expect(rangeFileName("document", [10])).toBe("document-pages-10.pdf");
  });
});

// --- split.ts (real pdf-lib integration, generated PDFs) -----------------

async function makeTestPdf(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    // Distinguishable page widths so page identity/order can be verified
    // after splitting, same technique used by pdf-merger.test.ts.
    const page = doc.addPage([100 + i * 10, 200]);
    page.drawText(`page-${i + 1}`, { x: 10, y: 10 });
  }
  return doc.save();
}

describe("splitPdf", () => {
  it("splits into one PDF per page in 'all-pages' mode", async () => {
    const bytes = await makeTestPdf(4);
    const result = await splitPdf(bytes, "document.pdf", "all-pages", undefined);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files).toHaveLength(4);
    expect(result.files.map((f) => f.fileName)).toEqual([
      "document-page-1.pdf",
      "document-page-2.pdf",
      "document-page-3.pdf",
      "document-page-4.pdf",
    ]);
    expect(result.files.every((f) => f.pageCount === 1)).toBe(true);

    // Verify each output is a genuinely valid, openable PDF with the
    // correct original page (checked via the distinguishable width).
    for (let i = 0; i < 4; i++) {
      const outDoc = await PDFDocument.load(result.files[i]!.bytes);
      expect(outDoc.getPageCount()).toBe(1);
      expect(outDoc.getPage(0).getWidth()).toBe(100 + i * 10);
    }
  });

  it("splits into custom range groups, preserving page order within each group", async () => {
    const bytes = await makeTestPdf(10);
    const result = await splitPdf(bytes, "doc.pdf", "ranges", [[1, 2, 3], [4, 5, 6], [10]]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((f) => f.fileName)).toEqual([
      "doc-pages-1-3.pdf",
      "doc-pages-4-6.pdf",
      "doc-pages-10.pdf",
    ]);
    expect(result.files.map((f) => f.pageCount)).toEqual([3, 3, 1]);

    const firstGroup = await PDFDocument.load(result.files[0]!.bytes);
    expect(firstGroup.getPageCount()).toBe(3);
    expect(firstGroup.getPage(0).getWidth()).toBe(100); // original page 1
    expect(firstGroup.getPage(2).getWidth()).toBe(120); // original page 3

    const lastGroup = await PDFDocument.load(result.files[2]!.bytes);
    expect(lastGroup.getPage(0).getWidth()).toBe(190); // original page 10
  });

  it("rejects a page selection outside the real page count", async () => {
    const bytes = await makeTestPdf(3);
    const result = await splitPdf(bytes, "doc.pdf", "ranges", [[99]]);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty ranges selection", async () => {
    const bytes = await makeTestPdf(3);
    const result = await splitPdf(bytes, "doc.pdf", "ranges", []);
    expect(result.ok).toBe(false);
  });

  it("reports a clear error for a corrupted/non-PDF input", async () => {
    const bytes = new TextEncoder().encode("not a real pdf");
    const result = await splitPdf(bytes, "doc.pdf", "all-pages", undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/corrupt|Couldn't read/);
  });

  it("emits progress events in order", async () => {
    const bytes = await makeTestPdf(3);
    const stages: string[] = [];
    await splitPdf(bytes, "doc.pdf", "all-pages", undefined, (e) => stages.push(e.stage));
    expect(stages[0]).toBe("reading");
    expect(stages[stages.length - 1]).toBe("finalizing");
    expect(stages.filter((s) => s === "splitting")).toHaveLength(3);
  });

  it("derives a safe filename even from a path-like input name", async () => {
    const bytes = await makeTestPdf(2);
    const result = await splitPdf(bytes, "../../etc/passwd.pdf", "all-pages", undefined);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.files[0]!.fileName).toBe("passwd-page-1.pdf");
  });
});
