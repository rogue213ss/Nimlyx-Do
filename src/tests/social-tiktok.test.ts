import { describe, expect, it } from "vitest";
import { generateTiktokCaptions } from "@/lib/social/tiktok";

describe("generateTiktokCaptions", () => {
  it("generates the requested number of results", () => {
    const results = generateTiktokCaptions("iced coffee", 4);
    expect(results).toHaveLength(4);
  });

  it("fills the topic into each caption", () => {
    const results = generateTiktokCaptions("iced coffee", 4);
    expect(results.every((r) => r.caption.toLowerCase().includes("iced coffee"))).toBe(true);
  });

  it("caps hashtags to a small TikTok-appropriate count", () => {
    const results = generateTiktokCaptions("fitness gym workout", 1);
    expect(results[0]!.hashtags.length).toBeLessThanOrEqual(6);
  });

  it("produces distinct captions for the same topic", () => {
    const results = generateTiktokCaptions("iced coffee", 4);
    const unique = new Set(results.map((r) => r.caption));
    expect(unique.size).toBe(results.length);
  });

  it("attaches the same hashtag set to every caption for one topic", () => {
    const results = generateTiktokCaptions("iced coffee", 3);
    const [first, ...rest] = results;
    expect(rest.every((r) => JSON.stringify(r.hashtags) === JSON.stringify(first!.hashtags))).toBe(true);
  });
});
