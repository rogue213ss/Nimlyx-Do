import { describe, expect, it } from "vitest";
import { CAPTION_TONES, generateCaptions } from "@/lib/social/captions";

describe("generateCaptions", () => {
  it("generates the requested number of captions", () => {
    const captions = generateCaptions("morning coffee", "casual", 3);
    expect(captions).toHaveLength(3);
  });

  it("fills the topic into each template", () => {
    const captions = generateCaptions("morning coffee", "minimal", 5);
    expect(captions.every((c) => c.caption.toLowerCase().includes("morning coffee"))).toBe(true);
  });

  it("produces distinct captions for the same topic", () => {
    const captions = generateCaptions("morning coffee", "casual", 3);
    const unique = new Set(captions.map((c) => c.caption));
    expect(unique.size).toBe(captions.length);
  });

  it("produces different output for different tones", () => {
    const casual = generateCaptions("morning coffee", "casual", 1)[0]!.caption;
    const professional = generateCaptions("morning coffee", "professional", 1)[0]!.caption;
    expect(casual).not.toBe(professional);
  });

  it("supports every declared tone without throwing", () => {
    for (const tone of CAPTION_TONES) {
      expect(() => generateCaptions("a topic", tone.id, 3)).not.toThrow();
    }
  });

  it("handles an empty topic gracefully", () => {
    const captions = generateCaptions("", "casual", 2);
    expect(captions).toHaveLength(2);
  });
});
