// Shared, environment-agnostic text helpers used by every social-media
// generator tool (hashtags, captions, titles, descriptions, bios). Pure
// string logic, no DOM — fully unit-testable, same "pure lib" discipline
// as every other tool in this project.

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "in", "on", "at", "to", "for",
  "with", "about", "my", "your", "our", "is", "are", "be", "this", "that",
  "it", "as", "by", "from",
]);

/** Splits a free-text topic into normalized, lowercase, stopword-free
 * word tokens. Punctuation is stripped; hyphenated words are split into
 * their parts (so "sunset-photography" yields both "sunset" and
 * "photography" as candidates for hashtag derivation). */
export function extractKeywords(topic: string): string[] {
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  // Dedupe while preserving first-seen order.
  return Array.from(new Set(words));
}

/** Converts a topic into a single hashtag-safe, no-space slug, e.g.
 * "sunset photography" -> "sunsetphotography". Used for the one
 * "whole topic as a tag" hashtag. */
export function topicToTagSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join("");
}

/** Title-cases a topic for use inside generated captions/titles, e.g.
 * "sunset photography" -> "Sunset Photography". Left mostly as-is if the
 * user already used capitals (so acronyms/brand names aren't mangled). */
export function titleCaseTopic(topic: string): string {
  const trimmed = topic.trim();
  if (trimmed === "") return trimmed;
  if (/[A-Z]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}
