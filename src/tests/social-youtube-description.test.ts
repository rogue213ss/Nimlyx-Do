import { describe, expect, it } from "vitest";
import { generateDescription } from "@/lib/social/youtube-description";

describe("generateDescription", () => {
  it("includes the topic in the intro line", () => {
    const desc = generateDescription({
      topic: "beginner home workouts",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(desc.toLowerCase()).toContain("beginner home workouts");
  });

  it("formats each key point as its own bullet", () => {
    const desc = generateDescription({
      topic: "beginner home workouts",
      keyPoints: ["Why warming up matters", "Three beginner-friendly moves"],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(desc).toContain("• Why warming up matters");
    expect(desc).toContain("• Three beginner-friendly moves");
  });

  it("omits the key points section entirely when there are none", () => {
    const desc = generateDescription({
      topic: "beginner home workouts",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(desc).not.toContain("What you'll learn");
  });

  it("includes a subscribe line only when requested", () => {
    const withCta = generateDescription({
      topic: "cooking",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: true,
    });
    const withoutCta = generateDescription({
      topic: "cooking",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(withCta.toLowerCase()).toContain("subscribing");
    expect(withoutCta.toLowerCase()).not.toContain("subscribing");
  });

  it("includes hashtags only when requested", () => {
    const withTags = generateDescription({
      topic: "cooking",
      keyPoints: [],
      includeHashtags: true,
      includeSubscribeCta: false,
    });
    const withoutTags = generateDescription({
      topic: "cooking",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(withTags).toContain("#");
    expect(withoutTags).not.toContain("#");
  });

  it("never leaves a trailing blank line", () => {
    const desc = generateDescription({
      topic: "cooking",
      keyPoints: [],
      includeHashtags: false,
      includeSubscribeCta: false,
    });
    expect(desc.endsWith("\n")).toBe(false);
  });
});
