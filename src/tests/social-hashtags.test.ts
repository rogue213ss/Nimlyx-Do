import { describe, expect, it } from "vitest";
import { extractKeywords, titleCaseTopic, topicToTagSlug } from "@/lib/social/keywords";
import { generateHashtags } from "@/lib/social/hashtags";

describe("extractKeywords", () => {
  it("extracts lowercase word tokens", () => {
    expect(extractKeywords("Sunset Photography")).toEqual(["sunset", "photography"]);
  });

  it("removes stopwords", () => {
    expect(extractKeywords("a trip to the mountains")).toEqual(["trip", "mountains"]);
  });

  it("splits hyphenated words into parts", () => {
    expect(extractKeywords("sunset-photography")).toEqual(["sunset", "photography"]);
  });

  it("dedupes repeated words", () => {
    expect(extractKeywords("food food recipes")).toEqual(["food", "recipes"]);
  });

  it("returns empty array for empty input", () => {
    expect(extractKeywords("")).toEqual([]);
  });

  it("strips punctuation", () => {
    expect(extractKeywords("fitness, gym & workouts!")).toEqual(["fitness", "gym", "workouts"]);
  });
});

describe("topicToTagSlug", () => {
  it("joins words with no spaces", () => {
    expect(topicToTagSlug("sunset photography")).toBe("sunsetphotography");
  });

  it("strips punctuation", () => {
    expect(topicToTagSlug("mom's recipes!")).toBe("momsrecipes");
  });
});

describe("titleCaseTopic", () => {
  it("title-cases a lowercase topic", () => {
    expect(titleCaseTopic("sunset photography")).toBe("Sunset Photography");
  });

  it("leaves topics with existing capitals unchanged", () => {
    expect(titleCaseTopic("NASA launch")).toBe("NASA launch");
  });

  it("returns empty string for empty input", () => {
    expect(titleCaseTopic("")).toBe("");
  });
});

describe("generateHashtags", () => {
  it("returns an empty result for an empty topic", () => {
    const { hashtags } = generateHashtags("");
    expect(hashtags).toEqual([]);
  });

  it("includes a hashtag derived from the whole topic", () => {
    const { hashtags } = generateHashtags("sunset photography");
    expect(hashtags).toContain("sunsetphotography");
  });

  it("includes hashtags derived from individual topic words", () => {
    const { hashtags } = generateHashtags("sunset photography");
    expect(hashtags).toContain("sunset");
    expect(hashtags).toContain("photography");
  });

  it("matches a curated category and pulls its hashtags", () => {
    const { hashtags, matchedCategories } = generateHashtags("home workout fitness");
    expect(matchedCategories.length).toBeGreaterThan(0);
    expect(hashtags).toContain("fitnessmotivation");
  });

  it("never exceeds the requested count", () => {
    const { hashtags } = generateHashtags("fitness travel food fashion business", 10);
    expect(hashtags.length).toBeLessThanOrEqual(10);
  });

  it("never returns duplicate hashtags", () => {
    const { hashtags } = generateHashtags("fitness fitness gym workout");
    expect(new Set(hashtags).size).toBe(hashtags.length);
  });

  it("falls back to a small generic set for an unmatched topic without inventing unrelated tags", () => {
    const { hashtags, matchedCategories } = generateHashtags("xyzzyplonk");
    expect(matchedCategories).toEqual([]);
    // Still returns the topic-derived tag plus some generic fallback,
    // but the fallback bucket itself is capped at 5 entries — confirm
    // the result never becomes an unbounded wall of unrelated tags.
    expect(hashtags.length).toBeLessThanOrEqual(6);
  });

  it("all returned hashtags are lowercase alphanumeric with no spaces or symbols", () => {
    const { hashtags } = generateHashtags("Sunset Photography! #amazing");
    for (const tag of hashtags) {
      expect(tag).toMatch(/^[a-z0-9]+$/);
    }
  });
});
