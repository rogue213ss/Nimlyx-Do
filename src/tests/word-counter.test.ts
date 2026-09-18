import { describe, expect, it } from "vitest";
import { computeTextStats } from "@/lib/word-counter/stats";

describe("computeTextStats", () => {
  it("returns all zeros for empty input", () => {
    expect(computeTextStats("")).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      speakingTimeMinutes: 0,
    });
  });

  it("returns all zeros for whitespace-only input", () => {
    const stats = computeTextStats("   \n\n  \t  ");
    expect(stats.words).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
  });

  it("counts a simple sentence correctly", () => {
    const stats = computeTextStats("The quick brown fox jumps over the lazy dog.");
    expect(stats.words).toBe(9);
    expect(stats.sentences).toBe(1);
    expect(stats.paragraphs).toBe(1);
  });

  it("counts characters with and without spaces", () => {
    const stats = computeTextStats("ab cd");
    expect(stats.characters).toBe(5);
    expect(stats.charactersNoSpaces).toBe(4);
  });

  it("counts characters including leading/trailing spaces (not trimmed)", () => {
    const stats = computeTextStats("  hi  ");
    expect(stats.characters).toBe(6);
  });

  it("treats a hyphenated word as a single word", () => {
    const stats = computeTextStats("well-known fact");
    expect(stats.words).toBe(2);
  });

  it("counts multiple sentences separated by periods", () => {
    const stats = computeTextStats("First sentence. Second sentence. Third one!");
    expect(stats.sentences).toBe(3);
  });

  it("counts a trailing fragment with no terminal punctuation as a sentence", () => {
    const stats = computeTextStats("Finished thought. Unfinished one");
    expect(stats.sentences).toBe(2);
  });

  it("counts text with no terminal punctuation at all as one sentence", () => {
    const stats = computeTextStats("just some words here");
    expect(stats.sentences).toBe(1);
  });

  it("counts multiple question marks / exclamation points as separate sentences", () => {
    const stats = computeTextStats("Really? Yes! Absolutely.");
    expect(stats.sentences).toBe(3);
  });

  it("counts paragraphs separated by blank lines", () => {
    const stats = computeTextStats("First paragraph.\n\nSecond paragraph.\n\nThird paragraph.");
    expect(stats.paragraphs).toBe(3);
  });

  it("treats single line breaks as the same paragraph", () => {
    const stats = computeTextStats("Line one.\nLine two.\nLine three.");
    expect(stats.paragraphs).toBe(1);
  });

  it("ignores extra blank lines between paragraphs", () => {
    const stats = computeTextStats("First.\n\n\n\nSecond.");
    expect(stats.paragraphs).toBe(2);
  });

  it("computes reading time based on ~200 wpm, rounding up, minimum 1 minute for any words", () => {
    const oneWord = computeTextStats("hello");
    expect(oneWord.readingTimeMinutes).toBe(1);

    const words400 = Array(400).fill("word").join(" ");
    expect(computeTextStats(words400).readingTimeMinutes).toBe(2);

    const words201 = Array(201).fill("word").join(" ");
    expect(computeTextStats(words201).readingTimeMinutes).toBe(2);
  });

  it("computes speaking time based on ~130 wpm, rounding up, minimum 1 minute for any words", () => {
    const oneWord = computeTextStats("hello");
    expect(oneWord.speakingTimeMinutes).toBe(1);

    const words260 = Array(260).fill("word").join(" ");
    expect(computeTextStats(words260).speakingTimeMinutes).toBe(2);
  });

  it("handles multiple consecutive spaces and tabs between words without over-counting", () => {
    const stats = computeTextStats("one    two\ttthree");
    expect(stats.words).toBe(3);
  });

  it("counts a large realistic block of text sensibly", () => {
    const paragraph =
      "This is a test paragraph. It has multiple sentences! Does it work correctly? It should.";
    const stats = computeTextStats(paragraph);
    expect(stats.words).toBe(15);
    expect(stats.sentences).toBe(4);
    expect(stats.paragraphs).toBe(1);
  });

  // --- Abbreviation handling (the improved heuristic) ---------------------

  it("does not split a sentence after a common title abbreviation", () => {
    const stats = computeTextStats("Mr. Smith went home.");
    expect(stats.sentences).toBe(1);
  });

  it("does not split after multiple abbreviations in one sentence", () => {
    const stats = computeTextStats("Dr. Jones works at Acme Inc. downtown.");
    expect(stats.sentences).toBe(1);
  });

  it("does not split on generic two-letter initialisms like e.g. or i.e.", () => {
    expect(computeTextStats("Bring snacks, e.g. chips, for the trip.").sentences).toBe(1);
    expect(computeTextStats("Some fruits, i.e. apples and pears, are here.").sentences).toBe(1);
  });

  it("does not split on a.m./p.m. time abbreviations", () => {
    const stats = computeTextStats("We meet at 9 a.m. sharp.");
    expect(stats.sentences).toBe(1);
  });

  it("does not split on multi-letter initials like a person's initials", () => {
    const stats = computeTextStats("J.K. Rowling wrote this. It was great.");
    expect(stats.sentences).toBe(2);
  });

  it("does not split on country/organization initialisms like U.S. or U.N.", () => {
    const stats = computeTextStats("The U.S. economy grew this quarter.");
    expect(stats.sentences).toBe(1);
  });

  it("does not split a sentence after 'Dr.' even when it happens to be the true end of a sentence", () => {
    // Known, documented tradeoff: distinguishing "Dr. Smith" (mid-sentence)
    // from a sentence that genuinely ends in an abbreviation isn't
    // possible with this heuristic — the algorithm always treats a listed
    // abbreviation as non-final, favoring the far more common case (an
    // abbreviation followed by a name) over the rarer one (an
    // abbreviation truly ending a sentence). See the FAQ.
    const stats = computeTextStats("Dr. Smith arrived at 9 a.m. Everyone was ready.");
    expect(stats.sentences).toBe(1);
  });

  it("does not miscount a mid-sentence decimal number as a sentence boundary", () => {
    const stats = computeTextStats("The rate is 3.14 percent this year, which is high.");
    expect(stats.sentences).toBe(1);
  });

  it("still counts a real sentence ending in a decimal number correctly", () => {
    const stats = computeTextStats("The value is 3.14. That surprised everyone.");
    expect(stats.sentences).toBe(2);
  });
});
