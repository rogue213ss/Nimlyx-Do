import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { mergePdfs } from "@/lib/pdf-merger/merge";
import {
  MAX_FILE_COUNT,
  looksLikePdfContent,
  moveDown,
  moveItem,
  moveUp,
  validateBatchMeta,
  validateFileMeta,
} from "@/lib/pdf-merger/validation";

function file(name: string, type: string, size: number) {
  return { name, type, size };
}

// --- Fixture PDF generation -------------------------------------------
// These build real, valid PDFs with pdf-lib itself (not hand-rolled byte
// strings), so `mergePdfs` below is exercised against genuine PDF data —
// this is a real integration test of the merge algorithm, not a mock.

async function makePdf(pageWidths: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const width of pageWidths) {
    doc.addPage([width, 100]);
  }
  return doc.save();
}

async function makeCorruptBytes(): Promise<Uint8Array> {
  return new TextEncoder().encode("this is definitely not a pdf");
}

describe("validateFileMeta", () => {
  it("accepts a normal PDF", () => {
    expect(validateFileMeta(file("doc.pdf", "application/pdf", 1024)).ok).toBe(true);
  });

  it("accepts a PDF with an empty MIME type but a .pdf extension (common for some browsers/OSes)", () => {
    expect(validateFileMeta(file("doc.pdf", "", 1024)).ok).toBe(true);
  });

  it("rejects a non-PDF file", () => {
    const result = validateFileMeta(file("photo.jpg", "image/jpeg", 1024));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not a PDF/);
  });

  it("rejects an empty file", () => {
    expect(validateFileMeta(file("empty.pdf", "application/pdf", 0)).ok).toBe(false);
  });

  it("rejects an oversized file", () => {
    const result = validateFileMeta(file("huge.pdf", "application/pdf", 101 * 1024 * 1024));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too large/);
  });
});

describe("validateBatchMeta", () => {
  it("accepts a batch within the limit", () => {
    const files = Array.from({ length: 5 }, (_, i) => file(`f${i}.pdf`, "application/pdf", 1024));
    const result = validateBatchMeta(0, files);
    expect(result.accepted.length).toBe(5);
    expect(result.batchWarning).toBeUndefined();
  });

  it("truncates and warns when the batch would exceed MAX_FILE_COUNT", () => {
    const files = Array.from({ length: MAX_FILE_COUNT + 5 }, (_, i) =>
      file(`f${i}.pdf`, "application/pdf", 1024)
    );
    const result = validateBatchMeta(0, files);
    expect(result.accepted.length).toBe(MAX_FILE_COUNT);
    expect(result.batchWarning).toMatch(new RegExp(String(MAX_FILE_COUNT)));
  });

  it("accounts for files already in the queue, not just the new batch", () => {
    const existing = MAX_FILE_COUNT - 2;
    const incoming = Array.from({ length: 5 }, (_, i) => file(`f${i}.pdf`, "application/pdf", 1024));
    const result = validateBatchMeta(existing, incoming);
    expect(result.accepted.length).toBe(2);
    expect(result.batchWarning).toBeDefined();
  });

  it("rejects invalid files individually without dropping valid ones", () => {
    const files = [
      file("good.pdf", "application/pdf", 1024),
      file("bad.txt", "text/plain", 1024),
      file("good2.pdf", "application/pdf", 1024),
    ];
    const result = validateBatchMeta(0, files);
    expect(result.accepted.length).toBe(2);
    expect(result.rejected.length).toBe(1);
    expect(result.rejected[0]?.file.name).toBe("bad.txt");
  });
});

describe("looksLikePdfContent", () => {
  it("recognizes real PDF bytes", async () => {
    const bytes = await makePdf([100]);
    expect(looksLikePdfContent(bytes)).toBe(true);
  });

  it("rejects non-PDF content", async () => {
    const bytes = await makeCorruptBytes();
    expect(looksLikePdfContent(bytes)).toBe(false);
  });

  it("rejects content shorter than the magic header", () => {
    expect(looksLikePdfContent(new Uint8Array([0x25, 0x50]))).toBe(false);
  });

  it("rejects empty content", () => {
    expect(looksLikePdfContent(new Uint8Array())).toBe(false);
  });
});

describe("moveItem / moveUp / moveDown", () => {
  it("moves an item from one index to another", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moveUp swaps with the previous item", () => {
    expect(moveUp(["a", "b", "c"], 1)).toEqual(["b", "a", "c"]);
  });

  it("moveDown swaps with the next item", () => {
    expect(moveDown(["a", "b", "c"], 1)).toEqual(["a", "c", "b"]);
  });

  it("moveUp on the first item is a no-op (clamped)", () => {
    const items = ["a", "b", "c"];
    expect(moveUp(items, 0)).toEqual(items);
  });

  it("moveDown on the last item is a no-op (clamped)", () => {
    const items = ["a", "b", "c"];
    expect(moveDown(items, 2)).toEqual(items);
  });

  it("does not mutate the original array", () => {
    const items = ["a", "b", "c"];
    moveItem(items, 0, 2);
    expect(items).toEqual(["a", "b", "c"]);
  });

  it("returns the same reference for an out-of-range fromIndex", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 5, 0)).toBe(items);
  });
});

describe("mergePdfs — real pdf-lib execution against generated fixtures", () => {
  it("merges two single-page PDFs into one two-page PDF", async () => {
    const a = await makePdf([200]);
    const b = await makePdf([300]);

    const result = await mergePdfs([
      { name: "a.pdf", bytes: a },
      { name: "b.pdf", bytes: b },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pageCount).toBe(2);
      // Confirm the output is itself a valid, loadable PDF — not just a
      // blob of bytes we assumed was correct.
      const reloaded = await PDFDocument.load(result.bytes);
      expect(reloaded.getPageCount()).toBe(2);
    }
  });

  it("preserves page order (A then B) using distinguishable page widths", async () => {
    const a = await makePdf([200]);
    const b = await makePdf([400]);

    const result = await mergePdfs([
      { name: "a.pdf", bytes: a },
      { name: "b.pdf", bytes: b },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const reloaded = await PDFDocument.load(result.bytes);
      const pages = reloaded.getPages();
      expect(pages[0]?.getWidth()).toBe(200);
      expect(pages[1]?.getWidth()).toBe(400);
    }
  });

  it("preserves the reversed order (B then A) when input order is reversed", async () => {
    const a = await makePdf([200]);
    const b = await makePdf([400]);

    const result = await mergePdfs([
      { name: "b.pdf", bytes: b },
      { name: "a.pdf", bytes: a },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const reloaded = await PDFDocument.load(result.bytes);
      const pages = reloaded.getPages();
      expect(pages[0]?.getWidth()).toBe(400);
      expect(pages[1]?.getWidth()).toBe(200);
    }
  });

  it("merges multi-page PDFs, summing page counts correctly", async () => {
    const a = await makePdf([100, 100, 100]); // 3 pages
    const b = await makePdf([100, 100]); // 2 pages

    const result = await mergePdfs([
      { name: "a.pdf", bytes: a },
      { name: "b.pdf", bytes: b },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pageCount).toBe(5);
  });

  it("merges a single PDF (still produces a valid, re-saved result)", async () => {
    const a = await makePdf([100, 100]);
    const result = await mergePdfs([{ name: "a.pdf", bytes: a }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pageCount).toBe(2);
  });

  it("fails gracefully on a corrupt/non-PDF file, identifying which file", async () => {
    const good = await makePdf([100]);
    const bad = await makeCorruptBytes();

    const result = await mergePdfs([
      { name: "good.pdf", bytes: good },
      { name: "bad.pdf", bytes: bad },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failedFile).toBe("bad.pdf");
      expect(result.error).toMatch(/bad\.pdf/);
      expect(result.error).not.toMatch(/at pdf-lib|Error:|\.ts:\d+/); // no raw stack trace leakage
    }
  });

  it("rejects an empty file list with a clear message", async () => {
    const result = await mergePdfs([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at least one PDF/);
  });

  it("reports real, truthful progress events as files are actually processed", async () => {
    const a = await makePdf([100]);
    const b = await makePdf([100]);
    const events: string[] = [];

    await mergePdfs(
      [
        { name: "a.pdf", bytes: a },
        { name: "b.pdf", bytes: b },
      ],
      (event) => {
        events.push(
          event.stage === "reading" ? `reading:${event.fileName}:${event.index}/${event.total}` : "finalizing"
        );
      }
    );

    expect(events).toEqual(["reading:a.pdf:1/2", "reading:b.pdf:2/2", "finalizing"]);
  });
});
