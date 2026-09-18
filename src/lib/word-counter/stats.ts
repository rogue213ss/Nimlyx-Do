// Pure text-statistics logic for Word Counter. No DOM, no timers — a
// single synchronous function of a string, fully unit-testable, same
// "pure lib, thin component" split used by json-formatter/format.ts.
// Deliberately runs on the main thread with no worker: even multi-page
// pasted text is a handful of regex passes over a string, well within
// what a keystroke-driven UI can afford (see PROJECT_CONTEXT.md decision
// log for why this differs from every PDF/image tool's worker-based
// approach).

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

const READING_WPM = 200; // commonly cited average adult silent-reading speed
const SPEAKING_WPM = 130; // commonly cited average spoken presentation pace

// Common abbreviations that end in a period but should NOT be treated as
// sentence boundaries. Deliberately a curated list of genuinely common
// English abbreviations, not an attempt at exhaustive coverage — see
// `isSentenceEndingToken`'s doc comment for the other, more general rule
// (the "initials" pattern) that covers many two-letter cases (e.g.,
// i.e., a.m., U.S.) without needing to be listed individually here.
const ABBREVIATIONS = new Set([
  // Titles / honorifics
  "mr", "mrs", "ms", "mx", "dr", "prof", "sr", "jr", "st", "rev", "fr", "hon",
  // Military / official ranks
  "gen", "col", "maj", "capt", "lt", "sgt", "cpl", "pvt", "adm",
  // Business
  "inc", "ltd", "co", "corp", "llc", "llp", "dept", "est",
  // Latin / general abbreviations
  "etc", "vs", "approx", "no", "vol", "ed", "eds", "al", "cf", "ca", "fig",
  // Address components
  "ave", "blvd", "rd", "apt", "ste",
  // Months
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
  // Days
  "mon", "tue", "tues", "wed", "thu", "thurs", "fri", "sat", "sun",
]);

/**
 * Decides whether a `.`/`!`/`?` run at the end of a whitespace-delimited
 * token is a real sentence boundary, or just punctuation belonging to an
 * abbreviation/initialism. `wordPart` is the token with its trailing
 * `.`/`!`/`?` run already stripped (e.g. "Mr" from "Mr.", "U.S" from
 * "U.S.").
 *
 * Two combined rules, deliberately simple and explainable rather than
 * real NLP:
 * 1. A curated list of common abbreviations (`ABBREVIATIONS` above).
 * 2. A general "initials" pattern: tokens made of single letters
 *    separated by internal periods (e.g. "U.S", "e.g", "J.K", "a.m")
 *    are treated as abbreviations generically, without needing every
 *    such combination individually listed.
 *
 * This is a real improvement over blind punctuation-splitting, not a
 * complete fix — genuinely ambiguous or unlisted abbreviations, and the
 * rarer case of a sentence that truly ends with one of these
 * abbreviations, remain known limitations (see the FAQ).
 */
function isAbbreviationToken(wordPart: string): boolean {
  if (wordPart.length === 0) return false;
  const lower = wordPart.toLowerCase();
  if (ABBREVIATIONS.has(lower)) return true;

  const segments = lower.split(".");
  if (segments.length >= 2 && segments.every((seg) => /^[a-z]?$/.test(seg))) return true;

  return false;
}

/**
 * Computes word/character/sentence/paragraph counts and estimated
 * reading/speaking time for a block of text.
 *
 * Deliberately simple, documented heuristics rather than attempting
 * linguistically perfect segmentation:
 * - Words: whitespace-separated tokens. A hyphenated word ("well-known")
 *   counts as one word; an em-dash-joined pair without spaces
 *   ("word—word") also counts as one, matching how most word processors
 *   behave.
 * - Sentences: counts real sentence-ending punctuation, skipping runs
 *   that belong to a recognized abbreviation or initialism (see
 *   `isAbbreviationToken`) — so "Mr. Smith went home." now correctly
 *   counts as one sentence, not two. A trailing fragment with no
 *   terminal punctuation still counts as one sentence. This meaningfully
 *   reduces — but doesn't eliminate — over-counting: unlisted or
 *   genuinely ambiguous abbreviations are a known, documented remaining
 *   limitation (see the FAQ), not something this V1 solves with real
 *   NLP-based sentence-boundary detection.
 * - Paragraphs: blocks of text separated by one or more blank lines.
 */
export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();

  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  let sentences = 0;
  if (trimmed.length > 0) {
    const tokens = trimmed.split(/\s+/);
    let endedOnBoundary = false;
    for (const token of tokens) {
      const match = /[.!?]+$/.exec(token);
      endedOnBoundary = false;
      if (!match) continue;
      const wordPart = token.slice(0, match.index);
      if (isAbbreviationToken(wordPart)) continue;
      sentences++;
      endedOnBoundary = true;
    }
    // A trailing fragment with no terminal punctuation (or one that was
    // judged to be an abbreviation, not a real sentence end) still
    // represents an in-progress sentence worth counting.
    if (!endedOnBoundary) sentences++;
  }

  const paragraphs =
    trimmed.length === 0
      ? 0
      : trimmed
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0).length;

  const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / READING_WPM));
  const speakingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / SPEAKING_WPM));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMinutes, speakingTimeMinutes };
}
