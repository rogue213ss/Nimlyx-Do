import { describe, expect, it } from "vitest";
import { TITLE_CATEGORIES, generateTitles } from "@/lib/social/titles";

describe("generateTitles", () => {
  it("generates the requested number of titles", () => {
    const titles = generateTitles("meal prepping", "howto", 5);
    expect(titles).toHaveLength(5);
  });

  it("fills the topic into each title", () => {
    const titles = generateTitles("meal prepping", "listicle", 5);
    expect(titles.every((t) => t.toLowerCase().includes("meal prepping"))).toBe(true);
  });

  it("produces distinct titles for the same topic", () => {
    const titles = generateTitles("meal prepping", "howto", 5);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("produces different output for different categories", () => {
    const howto = generateTitles("meal prepping", "howto", 1)[0];
    const review = generateTitles("meal prepping", "review", 1)[0];
    expect(howto).not.toBe(review);
  });

  it("supports every declared category without throwing", () => {
    for (const category of TITLE_CATEGORIES) {
      expect(() => generateTitles("a topic", category.id, 5)).not.toThrow();
    }
  });

  it("respects a lower requested count", () => {
    const titles = generateTitles("meal prepping", "howto", 2);
    expect(titles).toHaveLength(2);
  });
});
